import { cn } from '@/lib/utils'

const PageHeader = ({ title, description, actions, breadcrumb, className }) => {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {breadcrumb}
            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-3">
                <div className="min-w-0">
                    <h2 className="break-words text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&>*]:max-sm:flex-1">{actions}</div> : null}
            </div>
        </div>
    )
}

export default PageHeader
