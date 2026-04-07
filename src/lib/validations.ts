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
  techPriorities: z.string().optional()
})

export type MentorFeedbackFormData = z.infer<typeof mentorFeedbackSchema>

export const promoteCourseSchema = z.object({
  action: z.literal("promote"),
  resourceId: z.string().cuid(),
  employeeId: z.string().cuid()
})

export const addCourseSchema = z.object({
  action: z.literal("add"),
  employeeId: z.string().cuid(),
  stageId: z.string().cuid(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  platform: z.string().min(2, "Platform is required"),
  type: z.enum(["Video", "Article", "Course", "Book", "Project"]),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rationale: z.string().min(10, "Please provide a rationale of at least 10 characters")
})

export const mentorNoteSchema = z.object({
  employeeId: z.string().cuid(),
  note: z.string().min(1, "Note cannot be empty")
})

export const courseActionSchema = z.discriminatedUnion("action", [
  promoteCourseSchema,
  addCourseSchema
])

export type AddCourseFormData = z.infer<typeof addCourseSchema>
export type MentorNoteFormData = z.infer<typeof mentorNoteSchema>

export const employeeFeedbackSchema = z.object({
  rating: z.coerce.number().min(1, "Please provide a rating").max(5),
  learned: z.string().min(30, "Please write at least 30 characters"),
  nextGoal: z.string().min(20, "Please write at least 20 characters")
})

export const mentorQuarterlySchema = z.object({
  targetUserId: z.string().cuid(),
  rating: z.coerce.number().min(1, "Please provide a rating").max(5),
  learned: z.string().min(30, "Please write at least 30 characters"),
  nextGoal: z.string().min(20, "Please write at least 20 characters")
})

export type EmployeeFeedbackFormData = z.infer<typeof employeeFeedbackSchema>
export type MentorQuarterlyFormData = z.infer<typeof mentorQuarterlySchema>
