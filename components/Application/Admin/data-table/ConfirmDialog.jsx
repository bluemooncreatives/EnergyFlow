'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// In-app confirmation for destructive table actions (trash, delete forever,
// restore) — replaces the browser's blocking confirm().
const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel = 'Confirm', tone = 'danger', loading = false, onConfirm }) => (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
        <DialogContent className="sm:max-w-md" showCloseButton={!loading}>
            <DialogHeader className="flex-row items-start gap-4 text-left">
                <span
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-full',
                        tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'
                    )}
                    aria-hidden="true"
                >
                    <AlertTriangle className="size-5" />
                </span>
                <div className="space-y-1.5">
                    <DialogTitle className="text-lg">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </div>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    className={cn('h-10 px-4', tone === 'danger' && 'bg-destructive text-white hover:bg-destructive/90')}
                    onClick={onConfirm}
                    disabled={loading}
                    autoFocus
                >
                    {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {confirmLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
)

export default ConfirmDialog
