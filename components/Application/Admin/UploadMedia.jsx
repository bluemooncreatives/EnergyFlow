'use client'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import { CldUploadWidget } from 'next-cloudinary'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const UploadMedia = ({ isMultiple, queryClient, onUploaded, onBusyChange, disabled = false, buttonText = 'Upload Media' }) => {
    const [saving, setSaving] = useState(false)
    const [widgetOpen, setWidgetOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [pending, setPending] = useState([])
    const [error, setError] = useState('')
    const savingRef = useRef(false)
    const mounted = useRef(true)
    const busy = widgetOpen || uploading || saving || pending.length > 0
    const configured = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)

    useEffect(() => { onBusyChange?.(busy) }, [busy, onBusyChange])
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])
    useEffect(() => {
        if (!busy) return
        const warn = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [busy])

    const saveUploads = async (files) => {
        if (savingRef.current || !files.length) return
        savingRef.current = true
        setSaving(true)
        setError('')
        try {
            const { data } = await axios.post('/api/media/create', files)
            if (!data.success) throw new Error(data.message)
            // Refresh failures must not turn a successful upload into a failed one.
            await Promise.allSettled([
                queryClient.invalidateQueries({ queryKey: ['media-data'] }),
                queryClient.invalidateQueries({ queryKey: ['MediaModal'] }),
            ])
            if (!mounted.current) return
            setPending([])
            onUploaded?.(data.data)
            showToast('success', data.message)
        } catch (failure) {
            if (mounted.current) setError(failure?.response?.data?.message || failure.message || 'Could not save the upload.')
        } finally {
            savingRef.current = false
            if (mounted.current) setSaving(false)
        }
    }
    const handleOnError = (failure) => {
        setWidgetOpen(false)
        setUploading(false)
        showToast('error', failure?.statusText || failure?.message || 'Upload failed. Please try again.')
    }
    const handleOnQueueEnd = (results) => {
        setUploading(false)
        const files = Array.isArray(results?.info?.files) ? results.info.files : []
        const uploaded = [...new Map(files.filter(file => file.uploadInfo?.asset_id && file.uploadInfo?.public_id)
            .map(file => [file.uploadInfo.asset_id, { asset_id: file.uploadInfo.asset_id, public_id: file.uploadInfo.public_id }])).values()]
        if (!uploaded.length) return
        setPending(uploaded)
        void saveUploads(uploaded)
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <CldUploadWidget
                signatureEndpoint="/api/cloudinary-signature"
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onOpen={() => setWidgetOpen(true)}
                onClose={() => setWidgetOpen(false)}
                onQueuesStart={() => setUploading(true)}
                onAbort={() => setUploading(false)}
                onBatchCancelled={() => setUploading(false)}
                onError={handleOnError}
                onQueuesEnd={handleOnQueueEnd}
                config={{ cloud: { cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY } }}
                options={{ multiple: isMultiple, maxFiles: isMultiple ? 20 : 1, sources: ['local', 'url', 'unsplash', 'google_drive'], maxFileSize: 5 * 1024 * 1024, resourceType: 'image', clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'] }}
            >
                {({ open }) => (
                    <Button type="button" size="lg" disabled={disabled || busy || !configured} onClick={() => { try { open() } catch (failure) { handleOnError(failure) } }}>
                        <Plus className="size-4" />{saving ? 'Saving image…' : buttonText}
                    </Button>
                )}
            </CldUploadWidget>
            <p className="text-xs text-muted-foreground">{configured ? 'Max image size: 5 MB.' : 'Cloudinary upload is not configured. You can still choose an existing library image.'}</p>
            {error && (
                <div role="alert" className="max-w-sm space-y-2 text-sm text-destructive">
                    <p>{error} Your selected cover has not changed.</p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={saving || disabled} onClick={() => saveUploads(pending)}>Retry saving upload</Button>
                        <Button type="button" variant="ghost" disabled={saving || disabled} onClick={() => { setPending([]); setError('') }}>Dismiss upload</Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UploadMedia
