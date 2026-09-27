import { cn } from '@/lib/utils'

// Organic wave that grows OUT of a coloured band into its neighbour, drawn in
// the band's own colour (`currentColor`). Because it never has to match the
// neighbouring section, it stays correct when sections around the band drop
// out (e.g. a product rail with no data). The band must be `relative` with a
// z-index above its siblings so the wave paints over the next section.
const WaveEdge = ({ position = 'top', className }) => (
    <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className={cn(
            'pointer-events-none absolute inset-x-0 block h-[clamp(16px,3vw,44px)] w-full',
            position === 'top' ? 'bottom-[calc(100%-1px)] rotate-180' : 'top-[calc(100%-1px)]',
            className
        )}
    >
        <path
            fill="currentColor"
            d="M0 0h1440v22c-96 14-190 26-300 26-150 0-222-30-372-30S520 44 364 44C220 44 118 24 0 16z"
        />
    </svg>
)

export default WaveEdge
