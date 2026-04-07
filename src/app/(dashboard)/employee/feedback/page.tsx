import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentQuarter, getQuarterLabel } from "@/lib/utils"
import { FeedbackSummaryCard } from "@/components/shared/FeedbackSummaryCard"
import { EmployeeFeedbackForm } from "@/components/employee/EmployeeFeedbackForm"
import Link from "next/link"
import { Clock } from "lucide-react"

export default async function EmployeeFeedbackPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { quarter, year } = getCurrentQuarter()
  const quarterLabel = getQuarterLabel(quarter, year)

  const [learningPath, allFeedback] = await Promise.all([
    prisma.learningPath.findUnique({ where: { userId: session.user.id } }),
    prisma.quarterlyFeedback.findMany({
      where: { userId: session.user.id, submittedBy: "EMPLOYEE" },
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    }),
  ])

  const currentSubmitted = allFeedback.find(f => f.quarter === quarter && f.year === year)
  const pastFeedback = allFeedback.filter(f => !(f.quarter === quarter && f.year === year))

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Quarterly Reflection</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {quarterLabel} · Take a moment to reflect on your learning journey
        </p>
      </div>

      {/* No learning path */}
      {!learningPath && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 flex gap-3">
          <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 mb-1">
              Complete at least one quarter of learning before submitting feedback.
            </p>
            <Link
              href="/employee/learning-path"
              className="text-sm text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Go to My Learning Path →
            </Link>
          </div>
        </div>
      )}

      {/* Current quarter: submitted summary */}
      {learningPath && currentSubmitted && (
        <FeedbackSummaryCard
          quarter={currentSubmitted.quarter}
          year={currentSubmitted.year}
          rating={currentSubmitted.rating}
          learned={currentSubmitted.learned}
          nextGoal={currentSubmitted.nextGoal}
          submittedBy="EMPLOYEE"
        />
      )}

      {/* Current quarter: form */}
      {learningPath && !currentSubmitted && (
        <EmployeeFeedbackForm quarterLabel={quarterLabel} />
      )}

      {/* Past reflections */}
      {pastFeedback.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Previous Reflections</h2>
          {pastFeedback.map(f => (
            <FeedbackSummaryCard
              key={f.id}
              quarter={f.quarter}
              year={f.year}
              rating={f.rating}
              learned={f.learned}
              nextGoal={f.nextGoal}
              submittedBy="EMPLOYEE"
              collapsible
              defaultOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
