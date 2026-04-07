import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Sidebar from "@/components/shared/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.user.name, role: session.user.role }} />
      <main className="flex-1 bg-zinc-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
