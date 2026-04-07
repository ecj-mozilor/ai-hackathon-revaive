import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { promoteCourseSchema, addCourseSchema } from "@/lib/validations"
import { NextRequest } from "next/server"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === "updateStatus") {
    if (session.user.role !== "EMPLOYEE")
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const { resourceId, status } = body
    if (!resourceId || !["IN_PROGRESS", "COMPLETED"].includes(status))
      return Response.json({ success: false, error: "Invalid request" }, { status: 400 })

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { stage: { include: { learningPath: true } } }
    })
    if (!resource || resource.stage.learningPath.userId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { status }
    })

    return Response.json({ success: true, data: updated })
  }

  if (action === "promote") {
    if (session.user.role !== "MENTOR")
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const parsed = promoteCourseSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    const resource = await prisma.resource.findUnique({
      where: { id: parsed.data.resourceId },
      include: { stage: { include: { learningPath: { include: { user: true } } } } }
    })
    if (!resource || resource.stage.learningPath.user.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const updated = await prisma.resource.update({
      where: { id: parsed.data.resourceId },
      data: { priority: 0, addedByMentor: true }
    })
    return Response.json({ success: true, data: updated })
  }

  if (action === "add") {
    if (session.user.role !== "MENTOR")
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const parsed = addCourseSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    const stage = await prisma.stage.findUnique({
      where: { id: parsed.data.stageId },
      include: { learningPath: { include: { user: true } } }
    })
    if (!stage || stage.learningPath.user.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const resource = await prisma.resource.create({
      data: {
        stageId: parsed.data.stageId,
        title: parsed.data.title,
        platform: parsed.data.platform,
        type: parsed.data.type,
        url: parsed.data.url || null,
        rationale: parsed.data.rationale,
        priority: 0,
        addedByMentor: true,
        status: "PENDING"
      }
    })
    return Response.json({ success: true, data: resource })
  }

  return Response.json({ success: false, error: "Unknown action" }, { status: 400 })
}
