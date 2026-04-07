import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentQuarter, getQuarterLabel } from "@/lib/utils"
import { ReporteeQuarterlyRow } from "@/components/mentor/ReporteeQuarterlyRow"
import { Users } from "lucide-react"

export default async function MentorFeedbackPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MENTOR") redirect("/login")

  const { quarter, year } = getCurrentQuarter()
  const quarterLabel = getQuarterLabel(quarter, year)

  const reportees = await prisma.user.findMany({
    where: { mentorId: session.user.id },
    include: {
      questionnaire: { select: { designation: true } },
      quarterlyFeedbacks: {
        where: { quarter, year },
      },
    },
  })

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Team Quarterly Feedback</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {quarterLabel} · Submit observations for your reportees
        </p>
      </div>

      {reportees.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <Users className="size-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No reportees assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportees.map(employee => {
            const employeeSubmitted = employee.quarterlyFeedbacks.find(f => f.submittedBy === "EMPLOYEE") ?? null
            const mentorSubmitted = employee.quarterlyFeedbacks.find(f => f.submittedBy === "MENTOR") ?? null

            return (
              <ReporteeQuarterlyRow
                key={employee.id}
                employee={{
                  id: employee.id,
                  name: employee.name,
                  designation: employee.questionnaire?.designation ?? null,
                }}
                employeeSubmitted={employeeSubmitted ? {
                  id: employeeSubmitted.id,
                  quarter: employeeSubmitted.quarter,
                  year: employeeSubmitted.year,
                  rating: employeeSubmitted.rating,
                  learned: employeeSubmitted.learned,
                  nextGoal: employeeSubmitted.nextGoal,
                  submittedBy: "EMPLOYEE",
                } : null}
                mentorSubmitted={mentorSubmitted ? {
                  id: mentorSubmitted.id,
                  quarter: mentorSubmitted.quarter,
                  year: mentorSubmitted.year,
                  rating: mentorSubmitted.rating,
                  learned: mentorSubmitted.learned,
                  nextGoal: mentorSubmitted.nextGoal,
                  submittedBy: "MENTOR",
                } : null}
                quarterLabel={quarterLabel}
                quarter={quarter}
                year={year}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
