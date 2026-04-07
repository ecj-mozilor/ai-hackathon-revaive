import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mentorFeedbackSchema } from "@/lib/validations"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "MENTOR") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = mentorFeedbackSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const employee = await prisma.user.findUnique({ where: { id: parsed.data.employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const questionnaire = await prisma.questionnaireResponse.findUnique({ where: { userId: parsed.data.employeeId } })
  if (!questionnaire || questionnaire.status !== "AWAITING_MENTOR")
    return Response.json({ success: false, error: "Employee is not awaiting mentor feedback" }, { status: 400 })

  const existing = await prisma.mentorInitialFeedback.findUnique({ where: { employeeId: parsed.data.employeeId } })
  if (existing)
    return Response.json({ success: false, error: "Feedback already submitted for this employee" }, { status: 400 })

  await prisma.$transaction([
    prisma.mentorInitialFeedback.create({
      data: {
        mentorId: session.user.id,
        employeeId: parsed.data.employeeId,
        strengths: parsed.data.strengths,
        skillGaps: parsed.data.skillGaps,
        softSkills: parsed.data.softSkills,
        techPriorities: parsed.data.techPriorities ?? "",
        readinessRating: parsed.data.readinessRating
      }
    }),
    prisma.questionnaireResponse.update({
      where: { userId: parsed.data.employeeId },
      data: { status: "READY_FOR_GENERATION" }
    })
  ])

  return Response.json({ success: true, data: { employeeId: parsed.data.employeeId, status: "READY_FOR_GENERATION" } })
}
