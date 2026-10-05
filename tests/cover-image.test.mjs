import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'

const setup = () => {
    let failed = 0
    const context = { exports: {}, require: name => ({
        react: { useState: () => [failed, fn => { failed = fn(failed) }] },
        'react/jsx-runtime': jsx,
        'next/image': { default: function Image() {} },
    })[name] }
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../components/Application/Website/storefront/CoverImage.jsx', import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: false },
    }).outputText, context)
    return context.exports.default
}

test('failed cover delivery uses the fallback once and then leaves the branded card visible', () => {
    const Cover = setup()
    const element = Cover({ src: 'https://res.cloudinary.com/store/image/upload/missing.jpg', fallbackSrc: '/default.jpg', alt: 'Custom photo', style: { objectPosition: 'top' } })
    let image = element.type(element.props)
    assert.equal(image.props.alt, 'Custom photo')
    image.props.onError()
    image = element.type(element.props)
    assert.equal(image.props.src, '/default.jpg')
    assert.equal(image.props.style.objectPosition, 'center')
    image.props.onError()
    assert.equal(element.type(element.props), null)
})

test('identical fallbacks never loop; new covers get a fresh component state', () => {
    const Cover = setup()
    const element = Cover({ src: '/same.jpg', fallbackSrc: '/same.jpg' })
    element.type(element.props).props.onError()
    assert.equal(element.type(element.props), null)
    assert.notEqual(Cover({ src: '/new.jpg' }).key, element.key)
    assert.equal(Cover({ src: '' }), null)
})
