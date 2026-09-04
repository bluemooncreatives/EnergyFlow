import './admin.css'
import AppSidebar from '@/components/Application/Admin/AppSidebar'
import SkipToMain from '@/components/Application/Admin/SkipToMain'
import ThemeProvider from '@/components/Application/Admin/ThemeProvider'
import Topbar from '@/components/Application/Admin/Topbar'
import Main from '@/components/Application/Admin/layout/Main'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

const layout = ({ children }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <TooltipProvider delayDuration={100}>
                <SidebarProvider className="admin-theme bg-background">
                    <SkipToMain />
                    <AppSidebar />
                    <SidebarInset
                        className="@container/content bg-background has-data-[layout=fixed]:h-svh peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))] md:peer-data-[variant=inset]:rounded-[var(--admin-shell-radius)] md:peer-data-[variant=inset]:overflow-hidden"
                    >
                        <Topbar />
                        <Main id="content">{children}</Main>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </ThemeProvider>
    )
}

export default layout
