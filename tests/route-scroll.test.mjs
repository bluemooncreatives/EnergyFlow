import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Exercise the component's effects with a deterministic clock and router.
const setup = (initialPath = '/shop') => {
    let pathname = initialPath
    let now = 0
    let cursor = 0
    let hashTarget = false
    const refs = []
    const effects = []
    const listeners = new Map()
    const frames = new Map()
    const scrolls = []
    let frameId = 0
    const window = { location: { pathname, hash: '' }, scrollY: 900,
        addEventListener: (type, handler) => listeners.set(type, handler),
        removeEventListener: (type, handler) => { if (listeners.get(type) === handler) listeners.delete(type) },
    }
    const react = {
        useRef: (value) => refs[cursor++] ||= { current: value },
        useEffect: (fn, deps) => {
            const index = cursor++
            const previous = effects[index]
            if (previous && deps.every((dep, i) => dep === previous.deps[i])) return
            previous?.cleanup?.()
            effects[index] = { deps, cleanup: fn() }
        },
    }
    const modules = {
        react,
        'next/navigation': { usePathname: () => pathname },
        '@/components/Application/LenisProvider': { getLenis: () => ({ resize() {} }) },
        '@/lib/scroll': {
            scrollToY: (y) => { scrolls.push(y); window.scrollY = y },
            scrollToElement: (id) => { scrolls.push(id); return hashTarget },
        },
    }
    const context = { exports: {}, require: (name) => modules[name], window,
        performance: { now: () => now },
        requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId },
        cancelAnimationFrame: (id) => frames.delete(id),
    }
    const source = fs.readFileSync(new URL('../components/Application/RouteScrollReset.jsx', import.meta.url), 'utf8')
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
    const render = () => { cursor = 0; context.exports.default() }
    render()
    return { window, scrolls, render,
        navigate: (path) => { pathname = window.location.pathname = path; render() },
        pop: (path) => { window.location.pathname = path; listeners.get('popstate')() },
        input: () => listeners.get('wheel')?.(),
        targetReady: () => { hashTarget = true },
        tick: (time) => { now = time; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()) },
    }
}

test('initial load and repeated effects preserve restored scroll', () => {
    const app = setup()
    app.render()
    assert.deepEqual(app.scrolls, [])
})

test('fresh page navigation resets native scroll and cancels momentum at zero', () => {
    const app = setup()
    app.window.scrollY = 0
    app.navigate('/about-us')
    assert.deepEqual(app.scrolls, [0])
    app.window.scrollY = 900
    app.tick(200)
    assert.equal(app.window.scrollY, 0)
    app.input()
    const count = app.scrolls.length
    app.tick(300)
    assert.equal(app.scrolls.length, count)
})

test('history between pages preserves position', () => {
    const app = setup()
    app.pop('/')
    app.navigate('/')
    assert.deepEqual(app.scrolls, [])
})

test('query or hash history does not suppress the next page reset', () => {
    const app = setup()
    app.pop('/shop')
    app.navigate('/contact')
    assert.deepEqual(app.scrolls, [0])
})

test('encoded hash waits for streamed content beyond the menu animation', () => {
    const app = setup()
    app.window.location.hash = '#delivery%20info'
    app.navigate('/contact')
    app.tick(800)
    assert.equal(app.scrolls.includes(0), false)
    app.targetReady()
    app.tick(1500)
    assert.equal(app.scrolls.at(-1), 'delivery info')
    const count = app.scrolls.length
    app.tick(2000)
    assert.equal(app.scrolls.length, count)
})
