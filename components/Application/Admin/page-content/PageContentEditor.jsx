'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ExternalLink, RefreshCw, RotateCcw, Save } from 'lucide-react'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'

const hasKeys = (node) => node && typeof node === 'object' && Object.keys(node).length > 0

/**
 * The shell every Admin → Pages editor shares: loads the page's content,
 * keeps the form, and publishes it.
 *
 *   • Tabs group the page's sections; a dot marks a tab with unsaved edits
 *     (sunflower) or errors (red), and a failed save opens the first tab
 *     that needs fixing. Every tab stays mounted, so edits survive
 *     switching.
 *   • Saves carry the version the editor loaded. If another admin has
 *     published since, the save is refused and the editor offers to load
 *     their version (keeping these edits on screen until then).
 *   • Leaving with unsaved edits asks first.
 *
 * pageKey  — 'gift-boxes' | 'about-us'
 * schema   — the page's zod schema (lib/pageContent/schema.js)
 * defaults — the page's designed defaults
 * sections — [{ value, label, keys: ['hero', …], content: <fields /> }]
 */
const PageContentEditor = ({ pageKey, title, description, viewHref, breadcrumb, schema, defaults, sections }) => {
    const [tab, setTab] = useState(sections[0].value)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [attempt, setAttempt] = useState(0)
    const [saving, setSaving] = useState(false)
    const [meta, setMeta] = useState({ updatedAt: null, updatedBy: '' })
    const [ready, setReady] = useState(false)
    const [conflict, setConflict] = useState(false)

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaults,
        mode: 'onChange',
    })
    const { formState } = form
    const endpoint = `/api/page-content/${pageKey}`

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const { data } = await axios.get(endpoint)
            if (!data?.success) throw new Error(data?.message || 'Could not load this page.')
            form.reset(data.data.content)
            setMeta({ updatedAt: data.data.updatedAt, updatedBy: data.data.updatedBy || '' })
            setReady(true)
            setConflict(false)
            return true
        } catch (error) {
            const message = error?.response?.data?.message || error.message
            setLoadError(message)
            showToast('error', message)
            return false
        } finally {
            setLoading(false)
        }
    }, [endpoint, form])

    useEffect(() => { load() }, [load, attempt])

    useEffect(() => {
        if (!formState.isDirty) return undefined
        const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [formState.isDirty])

    const onSubmit = async (content) => {
        if (!ready || saving) return
        setSaving(true)
        try {
            const { data } = await axios.put(endpoint, { content, baseUpdatedAt: meta.updatedAt })
            if (!data?.success) throw Object.assign(new Error(data?.message), { status: data?.statusCode })
            form.reset(data.data.content)
            setMeta({ updatedAt: data.data.updatedAt, updatedBy: data.data.updatedBy || '' })
            setConflict(false)
            showToast('success', data.message)
        } catch (error) {
            const status = error?.response?.status || error?.status
            const message = error?.response?.data?.message || error.message || 'Could not publish. Please try again.'
            if (status === 409) setConflict(true)
            showToast('error', message)
        } finally {
            setSaving(false)
        }
    }

    const onInvalid = (errors) => {
        const first = sections.find((section) => section.keys.some((key) => hasKeys(errors?.[key])))
        if (first) setTab(first.value)
        showToast('error', 'Please fix the highlighted fields.')
    }

    const resetDefaults = () => {
        form.reset(structuredClone(defaults), { keepDefaultValues: true })
        showToast('success', 'The designed defaults are back in the form. Publish to put them live.')
    }

    const tabState = (keys) => {
        if (keys.some((key) => hasKeys(formState.errors?.[key]))) return 'error'
        if (keys.some((key) => hasKeys(formState.dirtyFields?.[key]) || formState.dirtyFields?.[key] === true)) return 'dirty'
        return null
    }

    const disabled = loading || !ready || saving

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title={title}
                description={description}
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumb} />}
                actions={
                    <Button asChild variant="outline" className="h-9">
                        <a href={viewHref} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" /> View page
                        </a>
                    </Button>
                }
            />

            {loadError && !ready && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                    <span>Could not load this page’s content: {loadError}</span>
                    <Button type="button" variant="outline" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
                </div>
            )}

            {conflict && (
                <div role="alert" className="ef-tone--danger flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
                    <span className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        Someone else published this page after you opened it. Your edits are still here; loading their version replaces them.
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={async () => { if (await load()) showToast('success', 'Loaded the latest published version.') }}
                    >
                        <RefreshCw className="size-4" /> Reload latest (discard edits)
                    </Button>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex min-w-0 flex-col gap-4 sm:gap-6" noValidate>
                    <div className="sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
                        <div className="flex min-w-0 items-center gap-2 text-sm">
                            {loading || !ready ? (
                                <span className="text-muted-foreground">{loading ? 'Loading content…' : 'Content unavailable'}</span>
                            ) : formState.isDirty ? (
                                <span className="ef-tone--sun rounded-full border px-2.5 py-0.5 text-xs font-medium">Unsaved changes</span>
                            ) : (
                                <span className="ef-tone--forest rounded-full border px-2.5 py-0.5 text-xs font-medium">All changes published</span>
                            )}
                            <span className="hidden truncate text-muted-foreground md:inline">
                                {meta.updatedAt
                                    ? `Last published ${dayjs(meta.updatedAt).format('DD MMM YYYY, hh:mm A')}${meta.updatedBy ? ` by ${meta.updatedBy}` : ''}`
                                    : 'Showing the designed defaults'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="ghost" className="h-9" onClick={resetDefaults} disabled={disabled}>
                                <RotateCcw className="size-4" /> Defaults
                            </Button>
                            <Button type="button" variant="outline" className="h-9" disabled={!formState.isDirty || saving} onClick={() => form.reset()}>
                                Discard
                            </Button>
                            <ButtonLoading
                                type="submit"
                                loading={saving}
                                disabled={disabled}
                                className="h-9"
                                text={<span className="inline-flex items-center gap-2"><Save className="size-4" /> Save &amp; publish</span>}
                            />
                        </div>
                    </div>

                    <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-4">
                        <div className="-mx-1 overflow-x-auto px-1 pb-1">
                            <TabsList className="h-9 w-max">
                                {sections.map((section) => {
                                    const state = tabState(section.keys)
                                    return (
                                        <TabsTrigger key={section.value} value={section.value} className="relative px-3">
                                            {section.label}
                                            {state && (
                                                <span
                                                    className={cn('absolute right-1 top-1 size-1.5 rounded-full', state === 'error' ? 'bg-destructive' : 'bg-[var(--brand-sun)]')}
                                                    aria-label={state === 'error' ? 'has errors' : 'unsaved changes'}
                                                />
                                            )}
                                        </TabsTrigger>
                                    )
                                })}
                            </TabsList>
                        </div>

                        <fieldset disabled={disabled} className={cn('min-w-0', (loading || !ready) && 'pointer-events-none opacity-60')}>
                            {sections.map((section) => (
                                <TabsContent key={section.value} value={section.value} forceMount className="data-[state=inactive]:hidden">
                                    <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-2">
                                        {section.content}
                                    </div>
                                </TabsContent>
                            ))}
                        </fieldset>
                    </Tabs>
                </form>
            </Form>
        </div>
    )
}

export default PageContentEditor
