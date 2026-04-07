import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Clock, Sparkles, Rocket } from "lucide-react"
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

  if (user.questionnaire?.status === "GENERATED") {
    redirect("/employee/learning-path")
  }

  const q = user.questionnaire

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
        Welcome back, {session.user.name.split(" ")[0]}
      </h1>
      <p className="text-zinc-500 mb-8">Here&apos;s where you are on your learning journey.</p>

      {/* No questionnaire — Welcome screen */}
      {!q && (
        <div className="bg-white rounded-xl shadow-sm p-8 border-2 border-dashed border-zinc-200 flex flex-col items-center text-center">
          <Rocket className="h-10 w-10 text-indigo-500 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Welcome to SkillPath</h2>
          <p className="text-zinc-500 mb-6 max-w-sm">
            Let&apos;s build your personalised learning path. Start by telling us about your skills and career goals — it only takes 5 minutes.
          </p>
          <Link
            href="/employee/questionnaire"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      )}

      {/* AWAITING_MENTOR — Waiting screen */}
      {q?.status === "AWAITING_MENTOR" && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-zinc-200 border-l-4 border-l-amber-400 flex gap-4">
          <Clock className="size-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-zinc-900 mb-1">
              Waiting for your mentor
            </h2>
            <p className="text-zinc-500 text-sm mb-2">
              Your profile is with your mentor for review. Once they submit their observations, you&apos;ll be able to generate your learning path.
            </p>
            <p className="text-amber-600 text-sm font-medium">We&apos;ll have your path ready soon!</p>
          </div>
        </div>
      )}

      {/* READY_FOR_GENERATION — Generate screen */}
      {q?.status === "READY_FOR_GENERATION" && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-zinc-200 border-l-4 border-l-indigo-500 flex gap-4">
          <Sparkles className="size-6 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">
              ✨ Your mentor has reviewed your profile!
            </h2>
            <p className="text-zinc-500 text-sm mb-5">
              {user.mentor ? `${user.mentor.name} has submitted their feedback. ` : ""}
              Your personalised learning path is ready to be generated.
            </p>
            <GeneratePathButton />
          </div>
        </div>
      )}
    </div>
  )
}
