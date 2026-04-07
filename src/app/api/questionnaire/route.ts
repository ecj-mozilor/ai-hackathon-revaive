import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { questionnaireSchema } from "@/lib/validations"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = questionnaireSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.questionnaireResponse.findUnique({ where: { userId: session.user.id } })
  if (existing) return Response.json({ success: false, error: "Questionnaire already submitted" }, { status: 400 })

  const questionnaire = await prisma.questionnaireResponse.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      status: "AWAITING_MENTOR"
    }
  })

  return Response.json({ success: true, data: { id: questionnaire.id, status: questionnaire.status } })
}
