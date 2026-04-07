import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  return Response.json({ success: false, error: "Unknown action" }, { status: 400 })
}
