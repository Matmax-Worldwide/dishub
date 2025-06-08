"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import "./sidebar.css"

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleCollapsed: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function SidebarProvider({
  children,
  defaultCollapsed = false
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const value = React.useMemo(() => ({
    collapsed,
    setCollapsed,
    toggleCollapsed
  }), [collapsed, toggleCollapsed])

  return (
    <SidebarContext.Provider value={value}>
      <div className="sidebar-provider" data-collapsed={collapsed}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const { collapsed } = useSidebar()

    return (
    <div
            className={cn(
        "h-full border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
              className
            )}
          >
            {children}
          </div>
  )
}

interface SidebarHeaderProps {
  children?: React.ReactNode
  className?: string
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
      return (
    <div className={cn("p-4 border-b border-border", className)}>
          {children}
        </div>
      )
    }

interface SidebarContentProps {
  children: React.ReactNode
  className?: string
}

export function SidebarContent({ children, className }: SidebarContentProps) {
      return (
    <div className={cn("flex-1 overflow-auto p-4", className)}>
      {children}
    </div>
  )
}

interface SidebarFooterProps {
  children: React.ReactNode
  className?: string
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
    return (
    <div className={cn("p-4 border-t border-border", className)}>
            {children}
      </div>
    )
  }

interface SidebarGroupProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export function SidebarGroup({ children, title, className }: SidebarGroupProps) {
  const { collapsed } = useSidebar()

  return (
    <div className={cn("mb-4", className)}>
      {title && !collapsed && (
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

interface SidebarItemProps {
  children: React.ReactNode
  icon?: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function SidebarItem({
  children,
  icon,
  active = false,
  disabled = false,
  onClick,
  className
}: SidebarItemProps) {
  const { collapsed } = useSidebar()

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center rounded-md font-medium transition-colors duration-200",
        collapsed ? "justify-center px-2" : "px-3 justify-start", 
        "py-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {icon && (
        <span className={cn(
          "flex items-center justify-center h-5 w-5", 
          collapsed ? "mx-auto" : "mr-2"
        )}>
          {icon}
        </span>
      )}
      {!collapsed && <span>{children}</span>}
    </button>
  )
}

interface SidebarMenuProps {
  children: React.ReactNode
  className?: string
}

export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  )
}

interface SidebarMenuItemProps {
  children: React.ReactNode
  className?: string
}

export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

interface SidebarMenuButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function SidebarMenuButton({
  children,
  className,
  onClick
}: SidebarMenuButtonProps) {
  const { collapsed } = useSidebar()

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {!collapsed && children}
    </button>
  )
}

interface SidebarCollapseButtonProps {
  icon?: React.ReactNode
  className?: string
}

export function SidebarCollapseButton({
  icon,
  className
}: SidebarCollapseButtonProps) {
  const { toggleCollapsed, collapsed } = useSidebar()

  return (
    <button
      onClick={toggleCollapsed}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "mx-auto",
        className
      )}
    >
      <span className="sidebar-collapse-icon-wrapper">
        {icon}
      </span>
    </button>
  )
}
