import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BASE = 'h-9 w-full rounded-sm text-base font-semibold uppercase'

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
