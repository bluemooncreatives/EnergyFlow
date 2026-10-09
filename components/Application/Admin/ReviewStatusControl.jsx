'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import FeedbackStatusSelect from './FeedbackStatusSelect'

export default function ReviewStatusControl({ review }) {
    const [saving, setSaving] = useState(false)
    const queryClient = useQueryClient()

    const changeStatus = async (status) => {
        setSaving(true)
        try {
            const { data } = await axios.put('/api/review/update', { _id: review._id, status })
            if (!data.success) throw new Error(data.message)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['review-data'] }),
                queryClient.invalidateQueries({ queryKey: ['product-review'] }),
                queryClient.invalidateQueries({ queryKey: ['product-review-summary'] }),
            ])
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error?.response?.data?.message || error.message || 'Could not update review.')
        } finally {
            setSaving(false)
        }
    }

    return <FeedbackStatusSelect value={review.isDraft ? 'draft' : 'live'} onChange={changeStatus} disabled={saving} label={`Visibility for ${review.user || 'reviewer'}: ${review.title}`} />
}
