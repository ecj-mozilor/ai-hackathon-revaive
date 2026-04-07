import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import FeedbackForm from "@/components/mentor/FeedbackForm"
import { MentorLearningPathView } from "@/components/mentor/MentorLearningPathView"
import { CourseManager } from "@/components/mentor/CourseManager"
import { MentorNotes } from "@/components/mentor/MentorNotes"
import { CheckCircle2, Clock } from "lucide-react"

interface SkillEntry {
  name: string
  proficiency: string
}

const proficiencyStyles: Record<string, string> = {
  Beginner: "bg-zinc-100 text-zinc-600",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced: "bg-indigo-100 text-indigo-700",
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ employeeId: string }>
}) {
  const { employeeId } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MENTOR") redirect("/login")

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    include: {
      questionnaire: true,
      receivedFeedback: true,
      learningPath: {
        include: {
          stages: {
            orderBy: { order: "asc" },
            include: {
              resources: {
                orderBy: { priority: "asc" },
              },
            },
          },
        },
      },
      notesForEmployee: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!employee) notFound()
  if (employee.mentorId !== session.user.id) redirect("/mentor")

  const q = employee.questionnaire
  const feedback = employee.receivedFeedback
  const learningPath = employee.learningPath
  const notes = employee.notesForEmployee

  const skills = (q?.skills ?? []) as unknown as SkillEntry[]
  const isGenerated = q?.status === "GENERATED"

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <a href="/mentor" className="text-sm text-zinc-400 hover:text-indigo-600 transition-colors mb-4 inline-block">
          ← Back to My Team
        </a>
        <h1 className="text-2xl font-semibold text-zinc-900">{employee.name}</h1>
      </div>

      {/* Section 1 — Employee Profile Summary */}
      {q ? (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Designation</p>
              <p className="font-medium text-zinc-900">{q.designation}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Experience</p>
              <p className="font-medium text-zinc-900">{q.experience} yr{q.experience !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Hours / Week</p>
              <p className="font-medium text-zinc-900">{q.hoursPerWeek}h</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Career Goal</p>
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-700">
              {q.careerGoal}
            </span>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${proficiencyStyles[s.proficiency] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {s.name} · {s.proficiency}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Learning Formats</p>
            <div className="flex flex-wrap gap-2">
              {q.learningFormat.map(f => (
                <span key={f} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-3">
          <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Waiting for the employee to fill their questionnaire before you can add feedback.
          </p>
        </div>
      )}

      {/* Section 2 — Feedback */}
      {q?.status === "AWAITING_MENTOR" && !feedback && (
        <FeedbackForm employeeId={employee.id} />
      )}

      {feedback && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Submitted Feedback</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              Feedback Submitted ✓
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-zinc-700 mb-0.5">Observed Strengths</p>
              <p className="text-zinc-600 whitespace-pre-wrap">{feedback.strengths}</p>
            </div>
            <div>
              <p className="font-medium text-zinc-700 mb-0.5">Skill Gaps</p>
              <p className="text-zinc-600 whitespace-pre-wrap">{feedback.skillGaps}</p>
            </div>
            <div>
              <p className="font-medium text-zinc-700 mb-1">Soft Skills to Develop</p>
              <div className="flex flex-wrap gap-1.5">
                {feedback.softSkills.map(s => (
                  <span key={s} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs text-indigo-700">{s}</span>
                ))}
              </div>
            </div>
            {feedback.techPriorities && (
              <div>
                <p className="font-medium text-zinc-700 mb-0.5">Technical Priorities</p>
                <p className="text-zinc-600 whitespace-pre-wrap">{feedback.techPriorities}</p>
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-700 mb-1">Readiness Rating</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${i < feedback.readinessRating ? "text-amber-400" : "text-zinc-200"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3 — Learning Path View (only if GENERATED) */}
      {isGenerated && learningPath && (
        <MentorLearningPathView
          learningPath={{
            goal: learningPath.goal,
            generatedAt: learningPath.generatedAt,
            stages: learningPath.stages,
          }}
        />
      )}

      {/* Section 4 — Course Management (only if GENERATED) */}
      {isGenerated && learningPath && (
        <CourseManager
          employeeId={employeeId}
          stages={learningPath.stages.map(s => ({
            id: s.id,
            title: s.title,
            order: s.order,
            resources: s.resources.map(r => ({
              id: r.id,
              title: r.title,
              addedByMentor: r.addedByMentor,
              stageId: r.stageId,
            })),
          }))}
        />
      )}

      {/* Section 5 — Mentor Notes (always visible) */}
      {q && (
        <MentorNotes
          employeeId={employeeId}
          initialNotes={notes.map(n => ({
            id: n.id,
            note: n.note,
            createdAt: n.createdAt,
          }))}
        />
      )}
    </div>
  )
}
