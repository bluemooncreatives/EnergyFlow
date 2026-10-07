'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { ArrowDown, ArrowUp, ChevronDown, Copy, ImageOff, ImagePlus, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import MediaModal from '@/components/Application/Admin/MediaModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { EMPTY_IMAGE, IMAGE_POSITIONS } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'

/* Field building blocks for Admin → Pages. Like the newsletter settings
   fields, every one is bound by `name` (a dot path into the page content)
   and reads the form from context. */

const POSITION_LABELS = { center: 'Centre', top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' }

const NATIVE_SELECT = 'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30'

// The first error message anywhere under a path (for a list item's header).
// RHF error nodes carry the field's DOM node as `ref`: never walk into it.
const firstMessage = (node) => {
    if (!node || typeof node !== 'object') return null
    if (typeof node.message === 'string' && node.message) return node.message
    for (const [key, value] of Object.entries(node)) {
        if (key === 'ref' || key === 'types') continue
        const found = firstMessage(value)
        if (found) return found
    }
    return null
}
const errorAt = (errors, path) => firstMessage(path.split('.').reduce((at, key) => at?.[key], errors))

export const SelectField = ({ name, label, options, hint }) => {
    const { control } = useFormContext()
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <select {...field} value={field.value ?? ''} className={NATIVE_SELECT}>
                            {options.map((option) => (
                                <option key={String(option.value)} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </FormControl>
                    {hint && <FormDescription>{hint}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

// 0 = no stars shown.
export const RatingField = ({ name, label = 'Star rating' }) => {
    const { control } = useFormContext()
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <select
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={String(field.value ?? 0)}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className={NATIVE_SELECT}
                        >
                            <option value="0">No stars</option>
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                        </select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

/**
 * A list of short phrases (ticker items, tags, pillars, perks) edited as
 * chips: type and press Enter (or comma) to add, × to remove, drag-free
 * reordering with the arrows on hover.
 */
export const TagsField = ({ name, label, max = 6, maxLength = 40, placeholder = 'Type and press Enter', hint }) => {
    const { control } = useFormContext()
    const [draft, setDraft] = useState('')

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const list = Array.isArray(field.value) ? field.value : []
                const update = (next) => field.onChange(next)
                const add = () => {
                    const value = draft.replace(/\s+/g, ' ').trim().slice(0, maxLength)
                    if (!value || list.length >= max) return
                    if (list.some((item) => item.toLowerCase() === value.toLowerCase())) { setDraft(''); return }
                    update([...list, value])
                    setDraft('')
                }
                const move = (i, step) => {
                    const j = i + step
                    if (j < 0 || j >= list.length) return
                    const next = [...list]
                    ;[next[i], next[j]] = [next[j], next[i]]
                    update(next)
                }
                return (
                    <FormItem>
                        <FormLabel className="flex w-full items-center justify-between gap-2">
                            <span>{label}</span>
                            <span className="text-xs font-normal tabular-nums text-muted-foreground">{list.length}/{max}</span>
                        </FormLabel>
                        {list.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                                {list.map((item, i) => (
                                    <li key={`${item}-${i}`} className="group inline-flex max-w-full items-center gap-0.5 rounded-full border bg-muted/50 py-0.5 pl-3 pr-1 text-xs">
                                        <span className="truncate">{item}</span>
                                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="hidden size-5 place-items-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-30 group-hover:grid group-focus-within:grid" aria-label={`Move "${item}" earlier`}>
                                            <ArrowUp className="size-3 -rotate-90" />
                                        </button>
                                        <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="hidden size-5 place-items-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-30 group-hover:grid group-focus-within:grid" aria-label={`Move "${item}" later`}>
                                            <ArrowDown className="size-3 -rotate-90" />
                                        </button>
                                        <button type="button" onClick={() => update(list.filter((_, j) => j !== i))} className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove "${item}"`}>
                                            <X className="size-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {list.length < max && (
                            <div className="flex gap-2">
                                <Input
                                    value={draft}
                                    maxLength={maxLength}
                                    placeholder={placeholder}
                                    aria-label={`Add to ${label}`}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
                                    }}
                                    onBlur={field.onBlur}
                                />
                                <Button type="button" variant="outline" className="h-8 shrink-0" onClick={add} disabled={!draft.trim()}>
                                    <Plus className="size-4" /> Add
                                </Button>
                            </div>
                        )}
                        {hint && <FormDescription>{hint}</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )
            }}
        />
    )
}

/**
 * An image slot: preview, "Choose from media" (the shared media library),
 * remove, alt text and crop focus. Empty means automatic — `autoNote` says
 * what the page shows instead.
 */
export const ImageField = ({ name, label, hint, autoNote = 'Automatic: the page picks a photo for you.', defaultImage }) => {
    const { control, setValue, getValues, getFieldState, formState } = useFormContext()
    const image = useWatch({ control, name }) || EMPTY_IMAGE
    // URL / media id problems (alt text shows its own message by its field).
    const pickError = getFieldState(`${name}.url`, formState).error?.message || getFieldState(`${name}.mediaId`, formState).error?.message
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState([])
    const [broken, setBroken] = useState('')

    const set = (next) => setValue(name, next, { shouldDirty: true, shouldValidate: true })

    const onSelect = (picked) => {
        const media = picked?.[0]
        if (!media?.url) return false
        const current = getValues(name) || EMPTY_IMAGE
        set({
            mediaId: String(media._id || ''),
            url: media.url,
            alt: current.url && current.alt ? current.alt : (media.alt || current.alt || ''),
            position: current.position || 'center',
        })
        setBroken('')
        return true
    }

    const restoreDefault = defaultImage?.url && image.url !== defaultImage.url
    const showPreview = image.url && broken !== image.url

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-start gap-3">
                <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {showPreview ? (
                        <Image
                            src={image.url}
                            alt=""
                            fill
                            sizes="144px"
                            className="object-cover"
                            style={{ objectPosition: image.position || 'center' }}
                            onError={() => setBroken(image.url)}
                        />
                    ) : (
                        <span className="grid size-full place-items-center px-2 text-center text-[0.6875rem] leading-tight text-muted-foreground">
                            {image.url ? <><ImageOff className="mb-1 size-4" />Can’t load this photo</> : 'Automatic'}
                        </span>
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{image.url ? (hint || 'Shown on the page.') : autoNote}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="h-8" onClick={() => { setSelected([]); setOpen(true) }}>
                            <ImagePlus className="size-4" /> {image.url ? 'Change' : 'Choose from media'}
                        </Button>
                        {image.url && (
                            <Button type="button" variant="ghost" className="h-8 text-destructive hover:text-destructive/80" onClick={() => set({ ...EMPTY_IMAGE })}>
                                <Trash2 className="size-4" /> Remove
                            </Button>
                        )}
                        {restoreDefault && (
                            <Button type="button" variant="ghost" className="h-8" onClick={() => set({ ...defaultImage })}>
                                <RotateCcw className="size-4" /> Original photo
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {image.url && (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                    <FormField
                        control={control}
                        name={`${name}.alt`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex w-full items-center justify-between gap-2">
                                    <span>Alt text</span>
                                    <span className="text-xs font-normal tabular-nums text-muted-foreground">{String(field.value ?? '').length}/160</span>
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="What the photo shows" maxLength={160} {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <SelectField
                        name={`${name}.position`}
                        label="Crop focus"
                        options={IMAGE_POSITIONS.map((value) => ({ value, label: POSITION_LABELS[value] }))}
                    />
                </div>
            )}
            {pickError && <p className="text-sm text-destructive">{pickError}</p>}

            <MediaModal open={open} setOpen={setOpen} selectedMedia={selected} setSelectedMedia={setSelected} isMultiple={false} onSelect={onSelect} />
        </div>
    )
}

/**
 * A repeatable list of objects (cards, steps, people, tabs…). Each item is a
 * collapsible panel with move up/down, duplicate and remove; `renderItem`
 * draws its fields from a `prefix` like "promise.items.2".
 */
export const ListField = ({ name, label, description, max, min = 0, noun = 'item', newItem, itemTitle, renderItem }) => {
    const { control, formState: { errors, submitCount } } = useFormContext()
    const { fields, append, remove, move, insert } = useFieldArray({ control, name })
    const values = useWatch({ control, name }) || []
    const [openId, setOpenId] = useState(null)
    const [openLast, setOpenLast] = useState(false)
    const listError = name.split('.').reduce((at, key) => at?.[key], errors)

    // A freshly added item opens for editing.
    useEffect(() => {
        if (!openLast || !fields.length) return
        setOpenId(fields[fields.length - 1].id)
        setOpenLast(false)
    }, [openLast, fields])

    // After a failed save, open the first item that needs fixing.
    useEffect(() => {
        if (!submitCount) return
        const bad = fields.findIndex((_, index) => errorAt(errors, `${name}.${index}`))
        if (bad >= 0) setOpenId(fields[bad].id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitCount])

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{fields.length}/{max}</span>
            </div>

            {fields.length === 0 && (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No {noun}s yet. {min === 0 ? 'The page leaves this part out until you add one.' : ''}
                </p>
            )}

            <ol className="flex flex-col gap-2">
                {fields.map((field, index) => {
                    const prefix = `${name}.${index}`
                    const open = openId === field.id
                    const title = itemTitle?.(values[index] || {}, index) || `${noun[0].toUpperCase()}${noun.slice(1)} ${index + 1}`
                    const itemError = errorAt(errors, prefix)
                    return (
                        <li key={field.id} className={cn('rounded-lg border bg-card', itemError && 'border-destructive/60')}>
                            <div className="flex items-center gap-1 p-1.5 pl-3">
                                <button
                                    type="button"
                                    onClick={() => setOpenId(open ? null : field.id)}
                                    aria-expanded={open}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded py-1 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
                                    <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
                                    {itemError && <span className="shrink-0 text-xs text-destructive">Needs attention</span>}
                                    <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                                </button>
                                <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Move ${title} up`}>
                                    <ArrowUp className="size-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1} aria-label={`Move ${title} down`}>
                                    <ArrowDown className="size-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => insert(index + 1, structuredClone(values[index] || newItem()))} disabled={fields.length >= max} aria-label={`Duplicate ${title}`}>
                                    <Copy className="size-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive/80" onClick={() => remove(index)} disabled={fields.length <= min} aria-label={`Remove ${title}`}>
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                            {/* Kept mounted while closed so validation can reach every field. */}
                            <div className={cn('flex flex-col gap-4 border-t p-3 sm:p-4', !open && 'hidden')}>
                                {renderItem(prefix, index)}
                            </div>
                        </li>
                    )
                })}
            </ol>

            {fields.length < max && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-fit"
                    onClick={() => {
                        append(newItem())
                        setOpenLast(true)
                    }}
                >
                    <Plus className="size-4" /> Add {noun}
                </Button>
            )}
            {listError?.message && <p className="text-sm text-destructive">{listError.message}</p>}
            {listError?.root?.message && <p className="text-sm text-destructive">{listError.root.message}</p>}
        </div>
    )
}
