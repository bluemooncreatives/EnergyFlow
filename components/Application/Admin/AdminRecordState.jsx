'use client'

import { CircleAlert, SearchX } from 'lucide-react'
import AdminEmptyState from '@/components/Application/Admin/AdminEmptyState'
import PageHeader from '@/components/Application/Admin/PageHeader'

/**
 * Full-page fallback for admin edit/detail screens whose record failed to
 * load. A 404 (or a malformed id, 400) reads as "not found" with a link back
 * to the list; anything else is a load failure with a retry.
 */
const AdminRecordState = ({ entity, error, errorStatus, onRetry, backHref, backLabel, header }) => {
    const missing = errorStatus === 404 || errorStatus === 400
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {header && <PageHeader {...header} />}
            <div className="rounded-md bg-card">
                <AdminEmptyState
                    icon={missing ? SearchX : CircleAlert}
                    tone="danger"
                    title={missing ? `${entity} not found` : `Couldn’t load this ${entity.toLowerCase()}`}
                    description={
                        missing
                            ? `This ${entity.toLowerCase()} may have been deleted or moved to the trash. Check the link or pick another from the list.`
                            : error || 'Something went wrong while loading. Please try again.'
                    }
                    onRetry={missing ? undefined : onRetry}
                    action={backHref ? { href: backHref, label: backLabel || 'Back to list' } : undefined}
                />
            </div>
        </div>
    )
}

export default AdminRecordState
