'use client'
import Image from 'next/image'
import logoWhite from '@/public/assets/images/hero/logo.png'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

const TeamSwitcher = ({ teams = [] }) => {
    const activeTeam = teams[0]

    if (!activeTeam) return null

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="cursor-default hover:bg-transparent hover:text-inherit"
                >
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-transparent group-data-[collapsible=icon]:size-8">
                        <Image
                            src={logoWhite}
                            alt="Energyflow"
                            width={48}
                            height={48}
                            sizes="48px"
                            className="size-full object-contain brightness-110 contrast-105 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
                            priority
                        />
                    </div>
                    <div className="grid flex-1 text-start text-md leading-tight">
                        <span className="truncate font-semibold font-header">
                            {activeTeam.name}
                        </span>
                        <span className="truncate text-sm">{activeTeam.plan}</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default TeamSwitcher
