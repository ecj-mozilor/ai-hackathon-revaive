"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addCourseSchema, AddCourseFormData } from "@/lib/validations"

interface Resource {
  id: string
  title: string
  addedByMentor: boolean
  stageId: string
}

interface Stage {
  id: string
  title: string
  order: number
  resources: Resource[]
}

interface Props {
  employeeId: string
  stages: Stage[]
}

const RESOURCE_TYPES = ["Video", "Article", "Course", "Book", "Project"] as const

export function CourseManager({ employeeId, stages }: Props) {
  const [promotableStages, setPromotableStages] = useState<Stage[]>(stages)
  const [selectedResourceId, setSelectedResourceId] = useState("")
  const [promoting, setPromoting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddCourseFormData>({
    resolver: zodResolver(addCourseSchema),
    defaultValues: {
      action: "add",
      employeeId,
      stageId: stages[0]?.id ?? "",
      title: "",
      platform: "",
      type: "Course",
      url: "",
      rationale: "",
    },
  })

  const nonMentorResources = promotableStages.flatMap(stage =>
    stage.resources
      .filter(r => !r.addedByMentor)
      .map(r => ({ ...r, stageTitle: stage.title, stageOrder: stage.order }))
  )

  async function handlePromote() {
    if (!selectedResourceId) return
    setPromoting(true)
    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote", resourceId: selectedResourceId, employeeId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Failed to promote course")
        return
      }
      // Optimistic: mark as addedByMentor so it disappears from dropdown
      setPromotableStages(prev =>
        prev.map(stage => ({
          ...stage,
          resources: stage.resources.map(r =>
            r.id === selectedResourceId ? { ...r, addedByMentor: true } : r
          )
        }))
      )
      setSelectedResourceId("")
      toast.success("Course promoted! It will appear at the top of the employee's list.")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setPromoting(false)
    }
  }

  async function onAddCourse(data: AddCourseFormData) {
    const res = await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.error ?? "Failed to add course")
      return
    }
    const stageIdx = stages.findIndex(s => s.id === data.stageId)
    const stageNum = stageIdx >= 0 ? stageIdx + 1 : "?"
    toast.success(`Course added! It appears at the top of Stage ${stageNum} with a Mentor Recommended badge.`)
    reset({
      action: "add",
      employeeId,
      stageId: stages[0]?.id ?? "",
      title: "",
      platform: "",
      type: "Course",
      url: "",
      rationale: "",
    })
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-6">
      <h2 className="text-base font-semibold text-zinc-900">Course Management</h2>

      {/* Promote existing course */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-700">Promote a Course to Top</p>
          <p className="text-xs text-zinc-500 mt-0.5">Move an existing AI-recommended course to the top of the list</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedResourceId}
            onChange={e => setSelectedResourceId(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select a course…</option>
            {promotableStages.map(stage => {
              const eligible = stage.resources.filter(r => !r.addedByMentor)
              if (!eligible.length) return null
              return (
                <optgroup key={stage.id} label={`Stage ${stage.order} — ${stage.title}`}>
                  {eligible.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </optgroup>
              )
            })}
          </select>
          <button
            type="button"
            onClick={handlePromote}
            disabled={!selectedResourceId || promoting}
            className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {promoting ? "Promoting…" : "Promote to Top"}
          </button>
        </div>
      </div>

      <Separator />

      {/* Add new course */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-zinc-700">Add a New Course</p>
        </div>

        <form onSubmit={handleSubmit(onAddCourse)} className="space-y-3">
          <input type="hidden" {...register("action")} value="add" />
          <input type="hidden" {...register("employeeId")} value={employeeId} />

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Title</label>
            <Input placeholder="e.g. Advanced TypeScript Patterns" {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-zinc-600">Platform</label>
              <Input placeholder="e.g. Coursera, YouTube" {...register("platform")} />
              {errors.platform && <p className="text-xs text-red-500">{errors.platform.message}</p>}
            </div>
            <div className="w-36 space-y-1">
              <label className="text-xs font-medium text-zinc-600">Type</label>
              <select
                {...register("type")}
                className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {RESOURCE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Add to Stage</label>
            <select
              {...register("stageId")}
              className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {stages.map((s, i) => (
                <option key={s.id} value={s.id}>Stage {i + 1} — {s.title}</option>
              ))}
            </select>
            {errors.stageId && <p className="text-xs text-red-500">{errors.stageId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">URL <span className="text-zinc-400">(optional)</span></label>
            <Input placeholder="https://..." {...register("url")} />
            <p className="text-xs text-zinc-400">Leave blank if no direct link</p>
            {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Rationale</label>
            <Textarea
              placeholder="Why are you recommending this?"
              rows={2}
              {...register("rationale")}
            />
            {errors.rationale && <p className="text-xs text-red-500">{errors.rationale.message}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding…" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
