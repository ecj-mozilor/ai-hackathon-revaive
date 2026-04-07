import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ReporteeCardProps {
  employee: {
    id: string
    name: string
    questionnaire: {
      designation: string
      status: string
    } | null
  }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
        Not Started
      </span>
    )
  }
  if (status === "AWAITING_MENTOR") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending Your Review
      </span>
    )
  }
  if (status === "READY_FOR_GENERATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Awaiting Generation
      </span>
    )
  }
  if (status === "GENERATED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        Path Active
      </span>
    )
  }
  return null
}

export default function ReporteeCard({ employee }: ReporteeCardProps) {
  const status = employee.questionnaire?.status ?? null
  const isPending = status === "AWAITING_MENTOR"

  return (
    <div
      className={cn(
        "bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4",
        isPending ? "border-l-4 border-l-violet-500 border-r border-t border-b border-zinc-200" : "border-zinc-200"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 truncate">{employee.name}</p>
          <p className="text-sm text-zinc-500 truncate">
            {employee.questionnaire?.designation ?? "—"}
          </p>
        </div>
      </div>

      <StatusBadge status={status} />

      <Link
        href={`/mentor/${employee.id}`}
        className="mt-auto inline-flex items-center justify-center rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        View Profile →
      </Link>
    </div>
  )
}
