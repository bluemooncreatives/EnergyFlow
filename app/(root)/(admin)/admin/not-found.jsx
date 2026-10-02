import { FileQuestion } from 'lucide-react'
import AdminEmptyState from '@/components/Application/Admin/AdminEmptyState'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'

// Unknown admin URLs land here (via the [...missing] catch-all) so the 404
// keeps the sidebar and topbar instead of dropping to the storefront page.
export default function AdminNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center rounded-md bg-card">
            <AdminEmptyState
                icon={FileQuestion}
                tone="danger"
                title="Page not found"
                description="This admin page doesn’t exist or may have moved. Check the URL or head back to the dashboard."
                action={{ href: ADMIN_DASHBOARD, label: 'Back to dashboard' }}
            />
        </div>
    )
}
