import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { LearningPathHeader } from "@/components/employee/LearningPathHeader"
import { StageCard } from "@/components/employee/StageCard"
import Link from "next/link"

export default async function LearningPathPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const learningPath = await prisma.learningPath.findUnique({
    where: { userId: session.user.id },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          resources: { orderBy: { priority: "asc" } }
        }
      }
    }
  })

  if (!learningPath) redirect("/employee")

  const allResources = learningPath.stages.flatMap(s => s.resources)
  const allResourceIds = allResources.map(r => r.id)
  const initialCompleted = allResources.filter(r => r.status === "COMPLETED").map(r => r.id)
  const overallPct = allResourceIds.length
    ? Math.round((initialCompleted.length / allResourceIds.length) * 100)
    : 0

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <a href="/employee" className="text-sm text-zinc-400 hover:text-indigo-600 transition-colors inline-block mb-2">
        ← Back to Dashboard
      </a>

      {/* Celebration banner */}
      {overallPct === 100 && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5">
          <p className="text-lg font-semibold mb-1">🏆 You&apos;ve completed your learning path!</p>
          <p className="text-sm text-emerald-100 mb-4">
            Fantastic work this quarter. Head to the Feedback section to reflect on your journey.
          </p>
          <Link
            href="/employee/feedback"
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Submit Quarterly Feedback →
          </Link>
        </div>
      )}

      {/* Header with live overall progress */}
      <LearningPathHeader
        goal={learningPath.goal}
        generatedAt={formatDate(learningPath.generatedAt)}
        allResourceIds={allResourceIds}
        initialCompleted={initialCompleted}
      />

      {/* Stages */}
      <div className="space-y-8">
        {learningPath.stages.map((stage, idx) => (
          <StageCard key={stage.id} stage={stage} index={idx} />
        ))}
      </div>
    </div>
  )
}
