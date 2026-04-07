import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { employeeFeedbackSchema, mentorQuarterlySchema } from "@/lib/validations"
import { getCurrentQuarter } from "@/lib/utils"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session)
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { quarter, year } = getCurrentQuarter()
  const role = session.user.role

  if (role === "EMPLOYEE") {
    const parsed = employeeFeedbackSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    const path = await prisma.learningPath.findUnique({ where: { userId: session.user.id } })
    if (!path)
      return Response.json({ success: false, error: "Complete at least one quarter of learning before submitting feedback" }, { status: 400 })

    const existing = await prisma.quarterlyFeedback.findFirst({
      where: { userId: session.user.id, quarter, year, submittedBy: "EMPLOYEE" }
    })
    if (existing)
      return Response.json({ success: false, error: "Feedback already submitted for this quarter" }, { status: 400 })

    const feedback = await prisma.quarterlyFeedback.create({
      data: {
        userId: session.user.id,
        submittedBy: "EMPLOYEE",
        quarter,
        year,
        rating: parsed.data.rating,
        learned: parsed.data.learned,
        nextGoal: parsed.data.nextGoal
      }
    })
    return Response.json({ success: true, data: feedback })
  }

  if (role === "MENTOR") {
    const parsed = mentorQuarterlySchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    const employee = await prisma.user.findUnique({ where: { id: parsed.data.targetUserId } })
    if (!employee || employee.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const existing = await prisma.quarterlyFeedback.findFirst({
      where: { userId: parsed.data.targetUserId, quarter, year, submittedBy: "MENTOR" }
    })
    if (existing)
      return Response.json({ success: false, error: "Feedback already submitted for this employee this quarter" }, { status: 400 })

    const feedback = await prisma.quarterlyFeedback.create({
      data: {
        userId: parsed.data.targetUserId,
        submittedBy: "MENTOR",
        quarter,
        year,
        rating: parsed.data.rating,
        learned: parsed.data.learned,
        nextGoal: parsed.data.nextGoal
      }
    })
    return Response.json({ success: true, data: feedback })
  }

  return Response.json({ success: false, error: "Unknown role" }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session)
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") ?? session.user.id

  if (userId !== session.user.id) {
    const employee = await prisma.user.findUnique({ where: { id: userId } })
    if (!employee || employee.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const feedbacks = await prisma.quarterlyFeedback.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { quarter: "desc" }]
  })

  return Response.json({ success: true, data: feedbacks })
}
