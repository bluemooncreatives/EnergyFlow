import { cn } from '@/lib/utils'

const PageHeader = ({ title, description, actions, breadcrumb, className }) => {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {breadcrumb}
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
        </div>
    )
}

export default PageHeader
