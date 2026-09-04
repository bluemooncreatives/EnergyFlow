'use client'
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes";
import { Moon, Sun } from 'lucide-react'


const ThemeSwitch = () => {
    const { setTheme } = useTheme()
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="cursor-pointer">
                    <Sun className="size-4 dark:hidden" />
                    <Moon className="hidden size-4 dark:block" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ThemeSwitch
