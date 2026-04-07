import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import { calcOverallProgress, calcStageProgress } from "@/lib/utils"

interface Resource {
  id: string
  title: string
  type: string
  platform: string
  url: string | null
  rationale: string
  priority: number
  addedByMentor: boolean
  status: string
}

interface Stage {
  id: string
  title: string
  duration: string
  order: number
  resources: Resource[]
}

interface Props {
  learningPath: {
    goal: string
    generatedAt: Date
    stages: Stage[]
  }
}

const statusBadge: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-500",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
}

const statusLabel: Record<string, string> = {
  PENDING: "Not started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed ✓",
}

export function MentorLearningPathView({ learningPath }: Props) {
  const overallProgress = calcOverallProgress(learningPath.stages)

  return (
    <div className="space-y-5">
      {/* Goal banner */}
      <div className="rounded-xl bg-indigo-600 p-5 text-white">
        <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide mb-1">Employee&apos;s goal</p>
        <p className="font-semibold mb-3">🎯 {learningPath.goal}</p>
        <div className="flex items-center justify-between text-sm text-indigo-200 mb-2">
          <span>Overall Progress: {overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="gap-0">
          <ProgressTrack className="h-2 w-full rounded-full bg-indigo-400/40">
            <ProgressIndicator className="h-full rounded-full bg-white transition-all" />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Stages */}
      {learningPath.stages.map((stage, idx) => {
        const stageProgress = calcStageProgress(stage.resources)
        const completedCount = stage.resources.filter(r => r.status === "COMPLETED").length

        return (
          <div key={stage.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-zinc-900 text-sm">{stage.title}</h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{stage.duration}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{completedCount} of {stage.resources.length} completed</p>
              </div>
            </div>

            <Progress value={stageProgress} className="gap-0">
              <ProgressTrack className="h-1.5 w-full rounded-full bg-zinc-200">
                <ProgressIndicator className="h-full rounded-full bg-emerald-500 transition-all" />
              </ProgressTrack>
            </Progress>

            <div className="space-y-2 pl-10">
              {stage.resources.map(r => (
                <div
                  key={r.id}
                  className={`rounded-xl border bg-white p-4 ${r.addedByMentor ? "border-l-4 border-l-violet-500 border-r border-t border-b border-zinc-200" : "border-zinc-200"}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {r.addedByMentor && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Mentor Recommended</span>
                      )}
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{r.type}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{r.platform}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[r.status] ?? statusBadge.PENDING}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{r.title}</p>
                  <p className="text-xs text-zinc-500 italic mt-0.5">&ldquo;{r.rationale}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
