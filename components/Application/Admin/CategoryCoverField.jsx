'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { COVER_POSITIONS, isCategoryCoverUrl, resolveCategoryArt } from '@/lib/categoryCover'
import { CATEGORY_ART } from '@/components/Application/Website/storefront/categoryArt'
import { showToast } from '@/lib/showToast'
import MediaModal from './MediaModal'
import UploadMedia from './UploadMedia'

export default function CategoryCoverField({ form, media, onMediaChange, onBusyChange, disabled = false }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState([])
    const [uploadBusy, setUploadBusy] = useState(false)
    const [failedSrc, setFailedSrc] = useState(null)
    const dirty = form.formState.isDirty
    useEffect(() => { onBusyChange?.(uploadBusy || open) }, [uploadBusy, open, onBusyChange])
    useEffect(() => () => { onBusyChange?.(false) }, [onBusyChange])
    useEffect(() => {
        if (!dirty) return
        const warn = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [dirty])
    const [name, slug, imageId, alt, position] = form.watch(['name', 'slug', 'coverImage', 'coverAlt', 'coverPosition'])
    const custom = imageId && isCategoryCoverUrl(media?.secure_url) ? { src: media.secure_url, alt: alt || media.alt || name, position } : null
    const art = resolveCategoryArt({ cover: custom, name }, CATEGORY_ART[slug])

    const choose = (asset) => {
        if (!asset || !isCategoryCoverUrl(asset.secure_url)) {
            showToast('error', 'Choose a Cloudinary image from the library.')
            return false
        }
        if (String(asset._id) === imageId) return true
        onMediaChange(asset)
        form.setValue('coverImage', asset._id, { shouldDirty: true, shouldValidate: true })
        form.setValue('coverAlt', '', { shouldDirty: true, shouldValidate: true })
        setFailedSrc(null)
        return true
    }

    return (
        <section className="mb-6 rounded-lg border p-4 sm:p-5">
            <h2 className="text-base font-semibold">Category cover image</h2>
            <p className="mt-1 text-sm text-muted-foreground">Shown in Shop by Category and other category previews. Upload a photo or choose one from your media library, then save the category to publish.</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <div className="relative isolate aspect-[3/4] max-w-64 overflow-hidden rounded-lg bg-[var(--palette-pine)] text-white">
                    {art.src && failedSrc !== art.src && <Image src={art.src} alt={art.alt || ''} fill sizes="256px" className="object-cover" style={{ objectPosition: art.position || 'center' }} onError={() => setFailedSrc(art.src)} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute inset-x-4 bottom-4 text-xl font-semibold">{name || 'Category preview'}</span>
                </div>
                <div className="flex min-w-0 flex-col items-start gap-4">
                    <div className="flex flex-wrap items-start gap-3">
                        <Button type="button" variant="outline" disabled={disabled || uploadBusy} onClick={() => {
                            setDraft(custom ? [{ _id: imageId, url: media.secure_url, alt: media.alt || '' }] : [])
                            setOpen(true)
                        }}><ImagePlus className="size-4" />{imageId ? 'Change image' : 'Choose from library'}</Button>
                        <UploadMedia isMultiple={false} queryClient={queryClient} disabled={disabled} onBusyChange={setUploadBusy} buttonText="Upload cover" onUploaded={(assets) => choose(assets?.[0])} />
                    </div>
                    {imageId ? (
                        <Button type="button" variant="ghost" disabled={disabled || uploadBusy} onClick={() => {
                            onMediaChange(null)
                            form.setValue('coverImage', null, { shouldDirty: true, shouldValidate: true })
                            form.setValue('coverAlt', '', { shouldDirty: true })
                            form.setValue('coverPosition', 'center', { shouldDirty: true })
                        }}><Trash2 className="size-4" />Remove custom cover</Button>
                    ) : <p className="text-sm text-muted-foreground">Using automatic artwork or a product photo. Choose a cover to control this image.</p>}
                    {imageId && (!custom || failedSrc === art.src) && <p role="status" className="text-sm text-destructive">This cover is unavailable. The storefront uses a fallback. Choose another image, remove the cover, or restore it from Media.</p>}
                    {uploadBusy && <p role="status" className="text-sm text-muted-foreground">Finish or dismiss the upload before saving this category.</p>}
                    <FormField control={form.control} name="coverImage" render={() => <FormItem><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="coverAlt" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Image description (alt text)</FormLabel>
                            <FormControl><Input {...field} value={field.value || ''} disabled={disabled || !imageId} maxLength={200} placeholder="A bowl of almonds and cashews" /></FormControl>
                            <FormDescription>Leave blank to use the media description or category name.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="coverPosition" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Crop focus</FormLabel>
                            <FormControl><select {...field} value={field.value || 'center'} disabled={disabled || !imageId} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                                {COVER_POSITIONS.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
                            </select></FormControl>
                            <FormDescription>Keep this part of the photo visible as the card changes size.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>
            <MediaModal open={open} setOpen={setOpen} selectedMedia={draft} setSelectedMedia={setDraft} isMultiple={false} filterMedia={(asset) => isCategoryCoverUrl(asset.secure_url)} onSelect={(selected) => {
                const asset = selected[0]
                return choose({ _id: asset._id, secure_url: asset.url, alt: asset.alt })
            }} />
        </section>
    )
}
