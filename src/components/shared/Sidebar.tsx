"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, MessageSquare, Users, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

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
    <aside className="w-60 bg-zinc-900 flex flex-col sticky top-0 h-screen">
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

      <div className="px-4 py-5 border-t border-zinc-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{user.name}</p>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">
            {user.role.toLowerCase()}
          </Badge>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
          title="Sign out"
          className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  )
}
