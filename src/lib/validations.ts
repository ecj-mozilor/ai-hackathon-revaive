import { z } from "zod"

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced"])
})

export const questionnaireSchema = z.object({
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  experience: z.coerce.number().min(0).max(50),
  skills: z.array(skillSchema).min(1, "Add at least one skill"),
  careerGoal: z.enum([
    "Promotion to next level",
    "Lateral move within same function",
    "Cross-functional transfer",
    "General upskilling"
  ]),
  learningFormat: z.array(z.string()).min(1, "Select at least one format"),
  hoursPerWeek: z.coerce.number().min(1).max(40)
})

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>

export const mentorFeedbackSchema = z.object({
  employeeId: z.string().cuid(),
  strengths: z.string().min(20, "Please provide at least 20 characters"),
  skillGaps: z.string().min(20, "Please provide at least 20 characters"),
  softSkills: z.array(z.string()).min(1, "Select at least one soft skill"),
  techPriorities: z.string().optional(),
  readinessRating: z.coerce.number().min(1).max(5)
})

export type MentorFeedbackFormData = z.infer<typeof mentorFeedbackSchema>
