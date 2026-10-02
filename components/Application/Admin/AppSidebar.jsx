'use client'
import { useMemo } from 'react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar'
import { ADMIN_GIFT_ENQUIRIES_SHOW } from '@/routes/AdminPanelRoute'
import { sidebarData } from './layout/data/sidebar-data'
import TeamSwitcher from './layout/TeamSwitcher'
import NavGroup from './layout/NavGroup'
import NavUser from './layout/NavUser'

// Unread corporate enquiries, shown as a badge on their menu item. Polled so
// a new enquiry surfaces without a reload; a failed fetch just hides it.
const useUnreadEnquiries = () => {
    const { data } = useQuery({
        queryKey: ['gift-enquiry-stats'],
        queryFn: async () => {
            const { data: res } = await axios.get('/api/gift-enquiry/stats')
            return res?.success ? Number(res.data?.unread) || 0 : 0
        },
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000,
        retry: false,
    })
    return data || 0
}

const AppSidebar = () => {
    const unread = useUnreadEnquiries()

    const navGroups = useMemo(() => {
        if (!unread) return sidebarData.navGroups
        const badge = unread > 99 ? '99+' : String(unread)
        return sidebarData.navGroups.map((group) => ({
            ...group,
            items: group.items.map((item) => (item.url === ADMIN_GIFT_ENQUIRIES_SHOW ? { ...item, badge } : item)),
        }))
    }, [unread])

    return (
        <Sidebar variant="inset" collapsible="icon" className="z-50">
            <SidebarHeader>
                <TeamSwitcher teams={sidebarData.teams} />
            </SidebarHeader>
            <SidebarContent>
                {navGroups.map((group) => (
                    <NavGroup key={group.title} {...group} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar
