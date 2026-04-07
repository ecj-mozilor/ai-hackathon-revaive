import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ReporteeCard from "@/components/mentor/ReporteeCard"

export default async function MentorDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MENTOR") redirect("/login")

  const reportees = await prisma.user.findMany({
    where: { mentorId: session.user.id },
    include: {
      questionnaire: {
        select: { designation: true, status: true }
      }
    },
    orderBy: { name: "asc" }
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">My Team</h1>
      <p className="text-zinc-500 mb-8">Review your reportees and provide feedback</p>

      {reportees.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
          No team members assigned yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportees.map(emp => (
            <ReporteeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  )
}
