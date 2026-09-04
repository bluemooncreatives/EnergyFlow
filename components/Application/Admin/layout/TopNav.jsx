import Link from 'next/link'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TopNav = ({ className, links = [], ...props }) => {
    return (
        <>
            <div className="lg:hidden">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="md:size-7">
                            <Menu className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                        {links.map(({ title, href, isActive, disabled }) => (
                            <DropdownMenuItem key={`${title}-${href}`} asChild>
                                <Link
                                    href={href}
                                    className={!isActive ? 'text-muted-foreground' : ''}
                                    aria-disabled={disabled}
                                    tabIndex={disabled ? -1 : undefined}
                                >
                                    {title}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <nav
                className={cn(
                    'hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6',
                    className
                )}
                {...props}
            >
                {links.map(({ title, href, isActive, disabled }) => (
                    <Link
                        key={`${title}-${href}`}
                        href={href}
                        aria-disabled={disabled}
                        tabIndex={disabled ? -1 : undefined}
                        className={cn(
                            'text-sm font-medium transition-colors hover:text-primary',
                            isActive ? '' : 'text-muted-foreground',
                            disabled && 'pointer-events-none opacity-60'
                        )}
                    >
                        {title}
                    </Link>
                ))}
            </nav>
        </>
    )
}

export default TopNav
