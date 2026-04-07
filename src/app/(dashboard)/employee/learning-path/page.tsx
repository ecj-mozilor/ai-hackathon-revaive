import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { LearningPathHeader } from "@/components/employee/LearningPathHeader"
import { StageCard } from "@/components/employee/StageCard"
import { GeneratePathButton } from "@/components/employee/GeneratePathButton"
import Link from "next/link"
import { BookOpen, Sparkles, Clock } from "lucide-react"

export default async function LearningPathPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [learningPath, questionnaire, mentor] = await Promise.all([
    prisma.learningPath.findUnique({
      where: { userId: session.user.id },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: { resources: { orderBy: { priority: "asc" } } }
        }
      }
    }),
    prisma.questionnaireResponse.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, include: { mentor: { select: { name: true } } } }).then(u => u?.mentor ?? null),
  ])

  if (!learningPath) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">My Learning Path</h1>

        {questionnaire?.status === "READY_FOR_GENERATION" && (
          <div className="bg-indigo-50 rounded-xl border border-indigo-200 border-l-4 border-l-indigo-500 p-6 flex gap-3">
            <Sparkles className="size-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 mb-0.5">✨ Ready to generate your learning path!</p>
              <p className="text-sm text-zinc-500 mb-4">
                {mentor ? `${mentor.name} has submitted their feedback. ` : ""}
                Generate your personalised path now.
              </p>
              <GeneratePathButton />
            </div>
          </div>
        )}

        {questionnaire?.status === "AWAITING_MENTOR" && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 border-l-4 border-l-amber-400 p-6 flex gap-3">
            <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 mb-0.5">Waiting for mentor feedback</p>
              <p className="text-sm text-zinc-500">
                {mentor ? `${mentor.name} is` : "Your mentor is"} reviewing your profile. Your learning path will be available to generate once they submit their feedback.
              </p>
            </div>
          </div>
        )}

        {!questionnaire && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center text-center">
            <BookOpen className="size-10 text-zinc-300 mb-3" />
            <h2 className="text-base font-semibold text-zinc-800 mb-1">No learning path yet</h2>
            <p className="text-sm text-zinc-500 mb-4">Complete your profile questionnaire first to get started.</p>
            <Link href="/employee/questionnaire" className="text-sm text-indigo-600 hover:underline">Complete Questionnaire →</Link>
          </div>
        )}
      </div>
    )
  }

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
