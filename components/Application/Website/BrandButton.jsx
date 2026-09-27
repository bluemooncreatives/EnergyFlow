import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Pill CTA sized to the storefront .ef-btn (44px touch target, sentence case).
const BASE = 'h-11 w-full rounded-[var(--radius-control)] text-[0.9375rem] font-medium'

export const BrandButton = ({ className, ...props }) => (
    <Button
        variant="brand"
        className={cn(BASE, className)}
        {...props}
    />
)

export const BrandOutlineButton = ({ className, ...props }) => (
    <Button
        variant="brand-outline"
        className={cn(BASE, className)}
        {...props}
    />
)
