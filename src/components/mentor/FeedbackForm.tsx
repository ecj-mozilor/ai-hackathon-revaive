"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { mentorFeedbackSchema, MentorFeedbackFormData } from "@/lib/validations"

const SOFT_SKILLS = [
  "Communication",
  "Leadership",
  "Ownership & Accountability",
  "Cross-functional Collaboration",
  "Time Management",
  "Problem Solving",
  "Presentation Skills",
  "Adaptability",
]

interface FeedbackFormProps {
  employeeId: string
}

export default function FeedbackForm({ employeeId }: FeedbackFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MentorFeedbackFormData>({
    resolver: zodResolver(mentorFeedbackSchema),
    defaultValues: {
      employeeId,
      strengths: "",
      skillGaps: "",
      softSkills: [],
      techPriorities: "",
    },
  })

  const softSkills = watch("softSkills")

  function toggleSoftSkill(skill: string) {
    const current = softSkills ?? []
    if (current.includes(skill)) {
      setValue("softSkills", current.filter(s => s !== skill), { shouldValidate: true })
    } else {
      setValue("softSkills", [...current, skill], { shouldValidate: true })
    }
  }

  async function onSubmit(data: MentorFeedbackFormData) {
    const res = await fetch("/api/mentor-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? "Something went wrong")
      return
    }
    toast.success("Feedback submitted! The employee can now generate their learning path.")
    router.push("/mentor")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("employeeId")} />

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-zinc-900">Your Feedback</h2>

          {/* Strengths */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Observed Strengths</label>
            <Textarea
              placeholder="What does this employee do particularly well?"
              rows={3}
              {...register("strengths")}
            />
            {errors.strengths && <p className="text-xs text-red-500">{errors.strengths.message}</p>}
          </div>

          {/* Skill Gaps */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Skill Gaps Identified</label>
            <Textarea
              placeholder="What areas need the most development?"
              rows={3}
              {...register("skillGaps")}
            />
            {errors.skillGaps && <p className="text-xs text-red-500">{errors.skillGaps.message}</p>}
          </div>

          <Separator />

          {/* Soft Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Soft Skills to Develop</label>
            <div className="flex flex-wrap gap-2">
              {SOFT_SKILLS.map(skill => {
                const selected = (softSkills ?? []).includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSoftSkill(skill)}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-zinc-600 border-zinc-300 hover:border-indigo-400"
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
            {errors.softSkills && <p className="text-xs text-red-500">{errors.softSkills.message}</p>}
          </div>

          <Separator />

          {/* Tech Priorities */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">
              Technical Areas to Prioritise{" "}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="e.g. TypeScript, system design, SQL..."
              rows={2}
              {...register("techPriorities")}
            />
          </div>

        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting…" : "Submit Feedback & Unlock Path Generation"}
          </button>
        </div>
      </div>
    </form>
  )
}
