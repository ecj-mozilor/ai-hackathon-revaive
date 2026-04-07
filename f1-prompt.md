# Feature 1 – Employee Onboarding Questionnaire

Build the employee onboarding questionnaire feature end-to-end.
Follow the design system and conventions defined in `CLAUDE.md`.

---

## What to build

### 1. Zod Validation Schema — `/src/lib/validations.ts`

Create this file with the following schema:

```ts
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
```

---

### 2. API Route — `/src/app/api/questionnaire/route.ts`

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { questionnaireSchema } from "@/lib/validations"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = questionnaireSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.questionnaireResponse.findUnique({ where: { userId: session.user.id } })
  if (existing) return Response.json({ success: false, error: "Questionnaire already submitted" }, { status: 400 })

  const questionnaire = await prisma.questionnaireResponse.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      status: "AWAITING_MENTOR"
    }
  })

  return Response.json({ success: true, data: { id: questionnaire.id, status: questionnaire.status } })
}
```

---

### 3. Login Page — `/src/app/(auth)/login/page.tsx`

Build a clean centred login page with:
- SkillPath logo/wordmark at the top (text-based, indigo colour)
- Email and password inputs using shadcn `Input`
- "Sign In" button (full width, indigo)
- Uses `signIn` from `next-auth/react` with `callbackUrl: "/"`
- Shows error message if login fails
- Background: `bg-zinc-50`, card: `bg-white rounded-xl shadow-sm p-8 w-full max-w-md`

---

### 4. Dashboard Layout — `/src/app/(dashboard)/layout.tsx`

Build a layout with:
- Auth guard: if no session, redirect to `/login`
- Fixed left sidebar (`w-60 bg-zinc-900 min-h-screen`)
- SkillPath wordmark at top of sidebar in indigo
- Logged-in user's name and role badge at bottom of sidebar
- Role-aware nav links using `lucide-react` icons:
  - EMPLOYEE: Dashboard (`/employee`), My Learning Path (`/employee/learning-path`), Feedback (`/employee/feedback`)
  - MENTOR: Dashboard (`/mentor`), My Team (`/mentor`), Feedback (`/mentor/feedback`)
- Active link highlighted with `bg-zinc-800 text-white`, inactive: `text-zinc-400 hover:text-white hover:bg-zinc-800`
- Main content area: `flex-1 bg-zinc-50 min-h-screen`

---

### 5. Employee Home Page — `/src/app/(dashboard)/employee/page.tsx`

This page is the smart router. Fetch the current user's questionnaire status server-side and render the correct screen:

| Status | What to show |
|---|---|
| No questionnaire | Welcome card + "Get Started" button → `/employee/questionnaire` |
| `AWAITING_MENTOR` | Amber info card: "Your mentor is reviewing your profile. Hang tight!" with a clock icon |
| `READY_FOR_GENERATION` | Indigo card: "Your mentor has reviewed your profile!" + "Generate My Learning Path" button (POST to `/api/generate`) |
| `GENERATED` | Redirect to `/employee/learning-path` |

---

### 6. Questionnaire Page — `/src/app/(dashboard)/employee/questionnaire/page.tsx`

Build a multi-section form page:

**Layout:**
- Page title: "Tell us about yourself"
- Subtitle: "This helps us build a learning path that's right for you"
- Card with three sections separated by `Separator`

**Section 1 — About You**
- Current Designation: `Input` (text)
- Years of Experience: `Input` (number)

**Section 2 — Your Skills**
- Dynamic skill entries: each row has a text input (skill name) + `Select` (Beginner / Intermediate / Advanced) + remove button
- "Add Skill +" button in indigo outline style
- Minimum 1 skill enforced
- Skill proficiency colour hint: Beginner → zinc, Intermediate → blue, Advanced → indigo

**Section 3 — Your Goals**
- Career Objective: `Select` with 4 options
- Preferred Learning Format: checkbox group (multi-select) for 5 options
- Hours per week: `Input` (number)

**Footer:**
- "Save & Continue" button (full width, indigo)
- On submit: POST to `/api/questionnaire`, redirect to `/employee` on success
- Show field-level error messages from Zod
- Use `react-hook-form` with `zodResolver`
- Show sonner toast on success: "Profile saved! Waiting for your mentor's review."

---

## Acceptance Criteria
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Employee can log in and land on `/employee`
- [ ] Employees with no questionnaire see the welcome screen
- [ ] Questionnaire form validates all fields before submission
- [ ] Skills can be added and removed dynamically
- [ ] On submission, DB record created with `status: AWAITING_MENTOR`
- [ ] Employee is shown the "waiting for mentor" screen after submission
- [ ] Existing questionnaire prevents re-submission (handled server-side)