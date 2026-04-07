import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import { CourseCard } from "@/components/employee/CourseCard"
import { calcOverallProgress, calcStageProgress } from "@/lib/utils"

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

  const overallProgress = calcOverallProgress(learningPath.stages)
  const generatedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  }).format(new Date(learningPath.generatedAt))

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">My Learning Path</h1>

      {/* Goal banner */}
      <div className="rounded-xl bg-indigo-600 p-6 text-white">
        <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide mb-1">Your goal</p>
        <p className="text-lg font-semibold mb-4">🎯 {learningPath.goal}</p>
        <div className="flex items-center justify-between gap-4 text-sm text-indigo-200 mb-2">
          <span>Generated on {generatedDate}</span>
          <span>Overall Progress: {overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="gap-0">
          <ProgressTrack className="h-2 w-full rounded-full bg-indigo-400/40">
            <ProgressIndicator className="h-full rounded-full bg-white transition-all" />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Stages */}
      <div className="space-y-6">
        {learningPath.stages.map((stage, idx) => {
          const stageProgress = calcStageProgress(stage.resources)
          const completedCount = stage.resources.filter(r => r.status === "COMPLETED").length

          return (
            <div key={stage.id} className="space-y-3">
              {/* Stage header */}
              <div className="flex items-center gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-zinc-900">{stage.title}</h2>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {stage.duration}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {completedCount} of {stage.resources.length} completed
                  </p>
                </div>
              </div>

              {/* Stage progress bar */}
              <Progress value={stageProgress} className="gap-0">
                <ProgressTrack className="h-1.5 w-full rounded-full bg-zinc-200">
                  <ProgressIndicator className="h-full rounded-full bg-emerald-500 transition-all" />
                </ProgressTrack>
              </Progress>

              {/* Resources */}
              <div className="space-y-3 pl-10">
                {stage.resources.map(resource => (
                  <CourseCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
