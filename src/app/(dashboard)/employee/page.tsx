import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Clock, Sparkles, Rocket, User, CheckCircle2 } from "lucide-react"
import { GeneratePathButton } from "@/components/employee/GeneratePathButton"

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      questionnaire: true,
      mentor: { select: { name: true } },
    },
  })

  if (!user) redirect("/login")

  const q = user.questionnaire

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back, {session.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Here&apos;s your profile overview.</p>
      </div>

      {/* Profile card — always visible */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="size-4 text-indigo-500" />
          <p className="text-sm font-semibold text-zinc-800">Your Profile</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Name</p>
            <p className="font-medium text-zinc-800">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Role</p>
            <p className="font-medium text-zinc-800">{q?.designation ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Experience</p>
            <p className="font-medium text-zinc-800">{q ? `${q.experience} yr${q.experience !== 1 ? "s" : ""}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Mentor</p>
            <p className="font-medium text-zinc-800">{user.mentor?.name ?? "—"}</p>
          </div>
        </div>
        {q && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
              🎯 {q.careerGoal}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs text-zinc-600">
              {q.hoursPerWeek}h / week
            </span>
            {q.learningFormat.map(f => (
              <span key={f} className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs text-zinc-600">{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Status card */}
      {!q && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-zinc-200 flex flex-col items-center text-center">
          <Rocket className="h-8 w-8 text-indigo-500 mb-3" />
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Complete your profile</h2>
          <p className="text-zinc-500 text-sm mb-4 max-w-sm">
            Tell us about your skills and career goals so we can build a personalised learning path for you.
          </p>
          <Link
            href="/employee/questionnaire"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      )}

      {q?.status === "AWAITING_MENTOR" && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 border-l-4 border-l-amber-400 p-5 flex gap-3">
          <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-0.5">Waiting for your mentor</p>
            <p className="text-sm text-zinc-500">
              Your profile is with {user.mentor?.name ?? "your mentor"} for review. You&apos;ll be able to generate your learning path once they submit their feedback.
            </p>
          </div>
        </div>
      )}

      {q?.status === "READY_FOR_GENERATION" && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 border-l-4 border-l-indigo-500 p-5 flex gap-3">
          <Sparkles className="size-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 mb-0.5">✨ Ready to generate your learning path!</p>
            <p className="text-sm text-zinc-500 mb-4">
              {user.mentor?.name ?? "Your mentor"} has submitted their feedback. Generate your personalised path now.
            </p>
            <GeneratePathButton />
          </div>
        </div>
      )}

      {q?.status === "GENERATED" && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-5 flex gap-3">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-0.5">Your learning path is ready</p>
            <p className="text-sm text-zinc-500 mb-3">Head to the Learning Path page to track your progress and complete your courses.</p>
            <Link
              href="/employee/learning-path"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Go to My Learning Path →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
