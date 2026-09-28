'use client'

import { Loader2, Save, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Floating bar that appears while a reordered list has unsaved changes.
const UnsavedOrderBar = ({ visible, saving, onSave, onDiscard }) => {
    if (!visible) return null
    return (
        <div className="sticky bottom-4 z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-foreground px-4 py-3 text-background shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300" role="status">
            <p className="text-sm font-medium">You changed the order. Save it to update the storefront.</p>
            <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="ghost" className="h-9 gap-1.5 px-3 text-background hover:bg-background/10 hover:text-background" onClick={onDiscard} disabled={saving}>
                    <Undo2 className="size-4" aria-hidden="true" /> Discard
                </Button>
                <Button type="button" className="h-9 gap-1.5 bg-[var(--palette-sunflower)] px-3 text-[var(--palette-pine)] hover:bg-[var(--brand-amber-hover)]" onClick={onSave} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                    Save order
                </Button>
            </div>
        </div>
    )
}

export default UnsavedOrderBar
