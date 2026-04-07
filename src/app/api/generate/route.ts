import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateLearningPath } from "@/lib/claude"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const userId = session.user.id

  const questionnaire = await prisma.questionnaireResponse.findUnique({ where: { userId } })
  if (!questionnaire || questionnaire.status !== "READY_FOR_GENERATION")
    return Response.json({ success: false, error: "Not ready for generation" }, { status: 400 })

  const existingPath = await prisma.learningPath.findUnique({ where: { userId } })
  if (existingPath)
    return Response.json({ success: true, data: existingPath })

  const mentorFeedback = await prisma.mentorInitialFeedback.findUnique({ where: { employeeId: userId } })
  if (!mentorFeedback)
    return Response.json({ success: false, error: "Mentor feedback not found" }, { status: 400 })

  let aiResult
  try {
    aiResult = await generateLearningPath(questionnaire, mentorFeedback)
  } catch (err) {
    console.error("Claude API error:", err)
    return Response.json({ success: false, error: "AI generation failed. Please try again." }, { status: 502 })
  }

  if (!aiResult?.goal || !Array.isArray(aiResult?.stages)) {
    console.error("Invalid AI response shape:", aiResult)
    return Response.json({ success: false, error: "AI returned an unexpected response. Please try again." }, { status: 502 })
  }

  try {
    const learningPath = await prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          userId,
          goal: aiResult.goal,
          stages: {
            create: aiResult.stages.map((s: any) => ({
              title: s.title,
              duration: s.duration,
              order: s.order,
              resources: {
                create: s.resources.map((r: any) => ({
                  title: r.title,
                  type: r.type,
                  platform: r.platform,
                  url: r.url ?? null,
                  rationale: r.rationale,
                  priority: r.priority,
                  addedByMentor: false,
                  status: "PENDING"
                }))
              }
            }))
          }
        },
        include: {
          stages: { include: { resources: true }, orderBy: { order: "asc" } }
        }
      })

      await tx.questionnaireResponse.update({
        where: { userId },
        data: { status: "GENERATED" }
      })

      return path
    })

    return Response.json({ success: true, data: learningPath })
  } catch (err) {
    console.error("DB save error:", err)
    return Response.json({ success: false, error: "Failed to save learning path. Please try again." }, { status: 500 })
  }
}
