'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './layout/data/sidebar-data'
import TeamSwitcher from './layout/TeamSwitcher'
import NavGroup from './layout/NavGroup'
import NavUser from './layout/NavUser'

const AppSidebar = () => {
    return (
        <Sidebar variant="inset" collapsible="icon" className="z-50">
            <SidebarHeader>
                <TeamSwitcher teams={sidebarData.teams} />
            </SidebarHeader>
            <SidebarContent>
                {sidebarData.navGroups.map((group) => (
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
