'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NavGroup = ({ title, items }) => {
    const { state, isMobile } = useSidebar()
    const pathname = usePathname()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const key = `${item.title}-${item.url || 'group'}`
                    if (!item.items) {
                        return <SidebarMenuLink key={key} item={item} pathname={pathname} />
                    }

                    if (state === 'collapsed' && !isMobile) {
                        return (
                            <SidebarMenuCollapsedDropdown
                                key={key}
                                item={item}
                                pathname={pathname}
                            />
                        )
                    }

                    return (
                        <SidebarMenuCollapsible
                            key={key}
                            item={item}
                            pathname={pathname}
                        />
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

const NavBadge = ({ children }) => {
    return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
}

const SidebarMenuLink = ({ item, pathname }) => {
    const { setOpenMobile } = useSidebar()
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={checkIsActive(pathname, item)}
                tooltip={item.title}
            >
                <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

const SidebarMenuCollapsible = ({ item, pathname }) => {
    const { setOpenMobile } = useSidebar()
    return (
        <Collapsible
            asChild
            defaultOpen={checkIsActive(pathname, item, true)}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="CollapsibleContent">
                    <SidebarMenuSub>
                        {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={checkIsActive(pathname, subItem)}
                                >
                                    <Link href={subItem.url} onClick={() => setOpenMobile(false)}>
                                        {subItem.icon && <subItem.icon />}
                                        <span>{subItem.title}</span>
                                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

const SidebarMenuCollapsedDropdown = ({ item, pathname }) => {
    return (
        <SidebarMenuItem>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={checkIsActive(pathname, item)}
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" sideOffset={4}>
                    <DropdownMenuLabel>
                        {item.title} {item.badge ? `(${item.badge})` : ''}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items.map((sub) => (
                        <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                            <Link
                                href={sub.url}
                                className={checkIsActive(pathname, sub) ? 'bg-secondary' : ''}
                            >
                                {sub.icon && <sub.icon />}
                                <span className="max-w-52 text-wrap">{sub.title}</span>
                                {sub.badge && <span className="ms-auto text-xs">{sub.badge}</span>}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    )
}

const normalizePath = (url = '') => url.split('?')[0]

const checkIsActive = (pathname, item, mainNav = false) => {
    const current = normalizePath(pathname)
    const target = normalizePath(item.url || '')

    return (
        (target && current === target) ||
        !!item?.items?.filter((i) => normalizePath(i.url) === current).length ||
        (mainNav &&
            current.split('/')[1] !== '' &&
            current.split('/')[1] === target.split('/')[1])
    )
}

export default NavGroup
