import { cn } from '@/lib/utils'

const Main = ({ fixed = false, fluid = false, className, ...props }) => {
    return (
        <main
            data-layout={fixed ? 'fixed' : 'auto'}
            className={cn(
                'px-6 py-6',
                fixed && 'flex grow flex-col overflow-hidden',
                !fluid &&
                    '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',
                className
            )}
            {...props}
        />
    )
}

export default Main
