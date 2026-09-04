import { toast } from "sonner"

const getSafeErrorMessage = (message) => {
    const raw = typeof message === 'string' ? message : message?.message
    const text = raw ? String(raw).replace(/\s+/g, ' ').trim() : ''

    if (!text) {
        return 'Something went wrong. Please try again.'
    }

    if (/file size|file is too large|too large|limit exceeded/i.test(text)) {
        return 'Upload failed. Max image size is 5 MB.'
    }

    const looksTechnical = /https?:\/\/\S+|cloudinary|stack|trace|upgrade your plan|errno|exception/i.test(text)
    if (looksTechnical || text.length > 140) {
        return 'Something went wrong. Please try again.'
    }

    return text
}

export const showToast = (type, message) => {
    const options = {
        duration: 5000,
    }

    switch (type) {
        case 'info':
            toast.info(message, options)
            break
        case 'success':
            toast.success(message, options)
            break
        case 'warning':
            toast.warning(message, options)
            break
        case 'error':
            toast.error(getSafeErrorMessage(message), options)
            break
        default:
            toast(message, options)
            break
    }
}
