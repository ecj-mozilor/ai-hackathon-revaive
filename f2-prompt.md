# Feature 2 – Mentor Initial Feedback (Pre-Generation Gate)

Build the mentor initial feedback feature end-to-end.
Follow the design system and conventions defined in `CLAUDE.md`.
Feature 1 (questionnaire + auth + layout) is already complete.

---

## What to build

### 1. Add Zod Schema — append to `/src/lib/validations.ts`

```ts
export const mentorFeedbackSchema = z.object({
  employeeId: z.string().cuid(),
  strengths: z.string().min(20, "Please provide at least 20 characters"),
  skillGaps: z.string().min(20, "Please provide at least 20 characters"),
  softSkills: z.array(z.string()).min(1, "Select at least one soft skill"),
  techPriorities: z.string().optional(),
  readinessRating: z.coerce.number().min(1).max(5)
})

export type MentorFeedbackFormData = z.infer<typeof mentorFeedbackSchema>
```

---

### 2. API Route — `/src/app/api/mentor-feedback/route.ts`

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mentorFeedbackSchema } from "@/lib/validations"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "MENTOR") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = mentorFeedbackSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  // Ownership check
  const employee = await prisma.user.findUnique({ where: { id: parsed.data.employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  // Check questionnaire exists and is in correct status
  const questionnaire = await prisma.questionnaireResponse.findUnique({ where: { userId: parsed.data.employeeId } })
  if (!questionnaire || questionnaire.status !== "AWAITING_MENTOR")
    return Response.json({ success: false, error: "Employee is not awaiting mentor feedback" }, { status: 400 })

  // Check not already submitted
  const existing = await prisma.mentorInitialFeedback.findUnique({ where: { employeeId: parsed.data.employeeId } })
  if (existing)
    return Response.json({ success: false, error: "Feedback already submitted for this employee" }, { status: 400 })

  // Save feedback + update status in a transaction
  await prisma.$transaction([
    prisma.mentorInitialFeedback.create({
      data: {
        mentorId: session.user.id,
        employeeId: parsed.data.employeeId,
        strengths: parsed.data.strengths,
        skillGaps: parsed.data.skillGaps,
        softSkills: parsed.data.softSkills,
        techPriorities: parsed.data.techPriorities ?? "",
        readinessRating: parsed.data.readinessRating
      }
    }),
    prisma.questionnaireResponse.update({
      where: { userId: parsed.data.employeeId },
      data: { status: "READY_FOR_GENERATION" }
    })
  ])

  return Response.json({ success: true, data: { employeeId: parsed.data.employeeId, status: "READY_FOR_GENERATION" } })
}
```

---

### 3. Mentor Home Page — `/src/app/(dashboard)/mentor/page.tsx`

Fetch all reportees server-side using `getServerSession`.

**Layout:**
- Page title: "My Team"
- Subtitle: "Review your reportees and provide feedback"
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

**Reportee Card (`/src/components/mentor/ReporteeCard.tsx`):**
- Avatar with initials fallback (`bg-indigo-100 text-indigo-700`)
- Name + Designation
- Status badge based on questionnaire status:
  - No questionnaire → zinc "Not Started"
  - `AWAITING_MENTOR` → amber "Pending Your Review" (pulsing dot animation)
  - `READY_FOR_GENERATION` → blue "Awaiting Generation"
  - `GENERATED` → emerald "Path Active"
- "View Profile →" button (indigo outline)
- Card has a violet left border if status is `AWAITING_MENTOR` to draw attention

**Empty state:** if no reportees, show: "No team members assigned yet"

---

### 4. Employee Profile Page — `/src/app/(dashboard)/mentor/[employeeId]/page.tsx`

Fetch employee data server-side. Redirect to `/mentor` if employee doesn't belong to this mentor.

**Section 1 — Employee Profile Summary (read-only card)**
- Name, designation, experience as a header row
- Career goal as an indigo badge
- Skills rendered as tags:
  - Beginner → `bg-zinc-100 text-zinc-600`
  - Intermediate → `bg-blue-100 text-blue-700`
  - Advanced → `bg-indigo-100 text-indigo-700`
- Learning formats as small zinc badges
- Hours per week

**Section 2 — Your Feedback**

Condition A — `status: AWAITING_MENTOR` → show the feedback form:
- Observed Strengths: `Textarea` (min 20 chars)
- Skill Gaps Identified: `Textarea` (min 20 chars)
- Soft Skills to Develop: checkbox group (multi-select) with these options:
  - Communication, Leadership, Ownership & Accountability,
    Cross-functional Collaboration, Time Management,
    Problem Solving, Presentation Skills, Adaptability
- Technical Areas to Prioritise: `Textarea` (optional)
- Readiness for Stated Goal: star rating component (1–5 clickable stars)
  - Build a simple `StarRating` component in `/src/components/shared/StarRating.tsx`
  - Selected stars: `text-amber-400 fill-amber-400`
  - Unselected: `text-zinc-300`
- Submit button: "Submit Feedback & Unlock Path Generation" (full width, indigo)
- On success: show sonner toast "Feedback submitted! The employee can now generate their learning path." and redirect to `/mentor`

Condition B — status is past `AWAITING_MENTOR` → show read-only feedback summary card:
- Display all submitted feedback fields in a clean summary
- Emerald "Feedback Submitted ✓" badge at the top
- No edit option

Condition C — No questionnaire yet → show amber info card:
- "Waiting for employee to fill their questionnaire before you can add feedback."

---

### 5. Shared StarRating Component — `/src/components/shared/StarRating.tsx`

```tsx
"use client"
import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange: (val: number) => void
  max?: number
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star
            size={24}
            className={i < value
              ? "text-amber-400 fill-amber-400"
              : "text-zinc-300 hover:text-amber-300"
            }
          />
        </button>
      ))}
    </div>
  )
}
```

---

## Acceptance Criteria
- [ ] Mentor can log in and see all their reportees on `/mentor`
- [ ] Status badges correctly reflect each employee's current state
- [ ] `AWAITING_MENTOR` cards are visually distinct (violet border + pulsing badge)
- [ ] Mentor can navigate to an employee profile
- [ ] Full questionnaire response is visible in read-only mode
- [ ] Mentor feedback form validates all required fields
- [ ] Star rating is interactive and value is captured correctly
- [ ] On submit: `MentorInitialFeedback` created + questionnaire status updated to `READY_FOR_GENERATION`
- [ ] Mentor is redirected back to `/mentor` with a success toast
- [ ] Submitted feedback shown as read-only if already submitted
- [ ] Mentor cannot access another mentor's reportee (redirect to `/mentor`)

---

## Test Flow
1. Login as `sarah@mozilor.com` / `hackathon123`
2. Should land on `/mentor` — see Priya (READY_FOR_GENERATION) and Dev (AWAITING_MENTOR — highlighted)
3. Click Dev's "View Profile →"
4. See Dev's questionnaire summary
5. Fill in the feedback form + star rating → submit
6. Should redirect to `/mentor` — Dev's badge changes to "Awaiting Generation"
7. Login as `dev@mozilor.com` → should now see "Your mentor has reviewed your profile" screen