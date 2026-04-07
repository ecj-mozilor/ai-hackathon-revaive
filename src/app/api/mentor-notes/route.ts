import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "MENTOR")
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { employeeId, note } = body
  if (!employeeId || !note)
    return Response.json({ success: false, error: "Missing fields" }, { status: 400 })

  const employee = await prisma.user.findUnique({ where: { id: employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const mentorNote = await prisma.mentorNote.create({
    data: { mentorId: session.user.id, employeeId, note }
  })

  return Response.json({ success: true, data: mentorNote })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employeeId")
  if (!employeeId)
    return Response.json({ success: false, error: "Missing employeeId" }, { status: 400 })

  const employee = await prisma.user.findUnique({ where: { id: employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const notes = await prisma.mentorNote.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  })

  return Response.json({ success: true, data: notes })
}
