import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Clock, Sparkles } from "lucide-react"
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

      {!q && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Get started</h2>
          <p className="text-zinc-500 mb-6">
            Complete your onboarding questionnaire so we can build a personalised learning path for you.
          </p>
          <Link
            href="/employee/questionnaire"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}

      {q?.status === "AWAITING_MENTOR" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex gap-4">
          <Clock className="size-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-amber-900 mb-1">
              Your mentor is reviewing your profile
            </h2>
            <p className="text-amber-700 text-sm">
              Hang tight! Your mentor will review your questionnaire and you&apos;ll be notified when your learning path is ready to generate.
            </p>
          </div>
        </div>
      )}

      {q?.status === "READY_FOR_GENERATION" && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8">
          <div className="flex gap-4">
            <Sparkles className="size-6 text-indigo-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-indigo-900 mb-1">
                Your mentor has reviewed your profile!
              </h2>
              <p className="text-indigo-700 text-sm mb-5">
                {user.mentor ? `${user.mentor.name} has submitted their observations. ` : ""}
                Click below to generate your personalised learning path powered by AI.
              </p>
              <GeneratePathButton />
              <p className="mt-3 text-xs text-indigo-500">This usually takes 5–10 seconds.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
