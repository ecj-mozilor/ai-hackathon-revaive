"use client"

import { useFieldArray, useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

import { questionnaireSchema, QuestionnaireFormData } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LEARNING_FORMATS = [
  "Video courses",
  "Articles & blogs",
  "Hands-on projects",
  "Books",
  "Mentorship sessions",
]

const CAREER_GOALS = [
  "Promotion to next level",
  "Lateral move within same function",
  "Cross-functional transfer",
  "General upskilling",
] as const

const proficiencyColors: Record<string, string> = {
  Beginner: "text-zinc-500",
  Intermediate: "text-blue-600",
  Advanced: "text-indigo-600",
}

export default function QuestionnairePage() {
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      designation: "",
      experience: 0,
      skills: [{ name: "", proficiency: "Beginner" }],
      careerGoal: undefined,
      learningFormat: [],
      hoursPerWeek: 5,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "skills" })
  const learningFormat = watch("learningFormat")

  function toggleFormat(format: string) {
    const current = learningFormat ?? []
    if (current.includes(format)) {
      setValue("learningFormat", current.filter(f => f !== format), { shouldValidate: true })
    } else {
      setValue("learningFormat", [...current, format], { shouldValidate: true })
    }
  }

  async function onSubmit(data: QuestionnaireFormData) {
    const res = await fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? "Something went wrong")
      return
    }
    toast.success("Profile saved! Waiting for your mentor's review.")
    router.push("/employee")
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Tell us about yourself</h1>
      <p className="text-zinc-500 mb-8">This helps us build a learning path that&apos;s right for you.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">

          {/* Section 1 — About You */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">About You</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Current Designation</label>
              <Input placeholder="e.g. Frontend Developer" {...register("designation")} />
              {errors.designation && (
                <p className="text-xs text-red-500">{errors.designation.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Years of Experience</label>
              <Input type="number" min={0} max={50} {...register("experience")} className="w-32" />
              {errors.experience && (
                <p className="text-xs text-red-500">{errors.experience.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 2 — Your Skills */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Your Skills</h2>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const proficiency = watch(`skills.${index}.proficiency`)
                return (
                  <div key={field.id} className="flex items-start gap-2">
                    <Input
                      placeholder="Skill name"
                      {...register(`skills.${index}.name`)}
                      className="flex-1"
                    />
                    <Controller
                      control={control}
                      name={`skills.${index}.proficiency`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className={`w-36 ${proficiencyColors[proficiency] ?? ""}`}>
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {errors.skills && typeof errors.skills.message === "string" && (
              <p className="text-xs text-red-500">{errors.skills.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", proficiency: "Beginner" })}
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="size-3 mr-1" /> Add Skill
            </Button>
          </div>

          <Separator />

          {/* Section 3 — Your Goals */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Your Goals</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Career Objective</label>
              <Controller
                control={control}
                name="careerGoal"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAREER_GOALS.map(goal => (
                        <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.careerGoal && (
                <p className="text-xs text-red-500">{errors.careerGoal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Preferred Learning Format</label>
              <div className="flex flex-wrap gap-2">
                {LEARNING_FORMATS.map(format => {
                  const selected = (learningFormat ?? []).includes(format)
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => toggleFormat(format)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                        selected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-zinc-600 border-zinc-300 hover:border-indigo-400"
                      }`}
                    >
                      {format}
                    </button>
                  )
                })}
              </div>
              {errors.learningFormat && (
                <p className="text-xs text-red-500">{errors.learningFormat.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Hours available per week</label>
              <Input type="number" min={1} max={40} {...register("hoursPerWeek")} className="w-32" />
              {errors.hoursPerWeek && (
                <p className="text-xs text-red-500">{errors.hoursPerWeek.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
