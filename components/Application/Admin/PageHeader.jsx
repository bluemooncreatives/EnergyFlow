import { cn } from '@/lib/utils'

const PageHeader = ({ title, description, actions, breadcrumb, className }) => {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {breadcrumb}
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    {description ? (
                        <p className="text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
        </div>
    )
}

export default PageHeader
