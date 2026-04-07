"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, MessageSquare, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: { name: string; role: string }
}

const employeeLinks = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/learning-path", label: "My Learning Path", icon: BookOpen },
  { href: "/employee/feedback", label: "Feedback", icon: MessageSquare },
]

const mentorLinks = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor", label: "My Team", icon: Users },
  { href: "/mentor/feedback", label: "Feedback", icon: MessageSquare },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const links = user.role === "MENTOR" ? mentorLinks : employeeLinks

  return (
    <aside className="w-60 bg-zinc-900 min-h-screen flex flex-col">
      <div className="px-5 py-6">
        <span className="text-xl font-bold text-indigo-400 tracking-tight">SkillPath</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-5 border-t border-zinc-800">
        <p className="text-sm font-medium text-zinc-200 truncate">{user.name}</p>
        <Badge variant="secondary" className="mt-1 text-xs capitalize">
          {user.role.toLowerCase()}
        </Badge>
      </div>
    </aside>
  )
}
