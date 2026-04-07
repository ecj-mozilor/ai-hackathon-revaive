# Feature 6 – Quarterly Feedback

Build the quarterly feedback feature end-to-end for both employees and mentors.
Follow the design system and conventions defined in `CLAUDE.md`.
Features 1–5 are already complete.

---

## What to build

### 1. Add Zod Schema — append to `/src/lib/validations.ts`

```ts
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
```

---

### 2. Quarter Utility — append to `/src/lib/utils.ts`

```ts
export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return { quarter, year: now.getFullYear() }
}

export function getQuarterLabel(quarter: number, year: number) {
  return `Q${quarter} ${year}`
}
```

---

### 3. API Route — `/src/app/api/quarterly-feedback/route.ts`

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { employeeFeedbackSchema, mentorQuarterlySchema } from "@/lib/validations"
import { getCurrentQuarter } from "@/lib/utils"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session)
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { quarter, year } = getCurrentQuarter()
  const role = session.user.role

  if (role === "EMPLOYEE") {
    const parsed = employeeFeedbackSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    // Block if no learning path yet
    const path = await prisma.learningPath.findUnique({ where: { userId: session.user.id } })
    if (!path)
      return Response.json({ success: false, error: "Complete at least one quarter of learning before submitting feedback" }, { status: 400 })

    // Prevent duplicate submission
    const existing = await prisma.quarterlyFeedback.findFirst({
      where: { userId: session.user.id, quarter, year, submittedBy: "EMPLOYEE" }
    })
    if (existing)
      return Response.json({ success: false, error: "Feedback already submitted for this quarter" }, { status: 400 })

    const feedback = await prisma.quarterlyFeedback.create({
      data: {
        userId: session.user.id,
        submittedBy: "EMPLOYEE",
        quarter,
        year,
        rating: parsed.data.rating,
        learned: parsed.data.learned,
        nextGoal: parsed.data.nextGoal
      }
    })
    return Response.json({ success: true, data: feedback })
  }

  if (role === "MENTOR") {
    const parsed = mentorQuarterlySchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

    // Ownership check
    const employee = await prisma.user.findUnique({ where: { id: parsed.data.targetUserId } })
    if (!employee || employee.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    // Prevent duplicate
    const existing = await prisma.quarterlyFeedback.findFirst({
      where: { userId: parsed.data.targetUserId, quarter, year, submittedBy: "MENTOR" }
    })
    if (existing)
      return Response.json({ success: false, error: "Feedback already submitted for this employee this quarter" }, { status: 400 })

    const feedback = await prisma.quarterlyFeedback.create({
      data: {
        userId: parsed.data.targetUserId,
        submittedBy: "MENTOR",
        quarter,
        year,
        rating: parsed.data.rating,
        learned: parsed.data.learned,
        nextGoal: parsed.data.nextGoal
      }
    })
    return Response.json({ success: true, data: feedback })
  }

  return Response.json({ success: false, error: "Unknown role" }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session)
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") ?? session.user.id

  // Mentor can only fetch their reportees' feedback
  if (userId !== session.user.id) {
    const employee = await prisma.user.findUnique({ where: { id: userId } })
    if (!employee || employee.mentorId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const feedbacks = await prisma.quarterlyFeedback.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { quarter: "desc" }]
  })

  return Response.json({ success: true, data: feedbacks })
}
```

---

### 4. Employee Feedback Page — `/src/app/(dashboard)/employee/feedback/page.tsx`

Fetch the current quarter's employee feedback server-side.
Also fetch all past feedback for the history section.

**Page layout:**

**Header:**
- Page title: "Quarterly Reflection"
- Subtitle: "Q{n} {year} · Take a moment to reflect on your learning journey"

**Condition A — Not yet submitted this quarter → show form:**

```
┌──────────────────────────────────────────────────┐
│  Q2 2026 Reflection                              │
│  ──────────────────────────────────────────────  │
│  How would you rate your learning path?          │
│  ★ ★ ★ ★ ☆                                      │
│                                                  │
│  What did you learn this quarter?                │
│  [                                             ] │
│  [                                             ] │
│                                                  │
│  What do you want to focus on next quarter?      │
│  [                                             ] │
│                                                  │
│              [  Submit Reflection  ]             │
└──────────────────────────────────────────────────┘
```

- Use `react-hook-form` + `zodResolver(employeeFeedbackSchema)`
- Star rating using the `StarRating` component from F2
- On success: show sonner toast "Reflection submitted! See you next quarter 👋" and replace form with submitted summary card
- On error: show destructive `Alert` with error message

**Condition B — Already submitted this quarter → show summary:**

```
┌──────────────────────────────────────────────────┐
│  ✅ Q2 2026 Reflection Submitted                 │
│  ──────────────────────────────────────────────  │
│  Your Rating    ★ ★ ★ ★ ☆                       │
│                                                  │
│  What you learned                                │
│  "Completed TypeScript deep dive and started     │
│   system design fundamentals..."                 │
│                                                  │
│  Your focus for Q3                               │
│  "Node.js backend development and API design"    │
└──────────────────────────────────────────────────┘
```

- Emerald "Submitted ✓" badge at the top
- All fields read-only

**Condition C — No learning path yet:**
- Amber info card: "Complete at least one quarter of learning before submitting feedback."
- Link back to learning path: "Go to My Learning Path →"

**Past Feedback History section (below the current quarter card):**
- Section heading: "Previous Reflections"
- If no past feedback (only current quarter): hide this section
- Render each past quarter as a collapsed `Card` with:
  - Quarter label + rating stars (read-only) as summary row
  - Expandable details (use a simple `useState` toggle — no need for accordion)

---

### 5. Mentor Feedback Page — `/src/app/(dashboard)/mentor/feedback/page.tsx`

Server component — fetch all reportees with their quarterly feedback status for the current quarter.

**Page layout:**

**Header:**
- Page title: "Team Quarterly Feedback"
- Subtitle: "Q{n} {year} · Submit observations for your reportees"

**Reportee feedback status list:**

For each reportee, show a row:
```
┌─────────────────────────────────────────────────┐
│  👤 Priya Menon — Frontend Developer            │
│  Employee submitted: ✅  |  Your feedback: ⏳   │
│                              [ Give Feedback → ] │
└─────────────────────────────────────────────────┘
```

- If mentor has already submitted: show emerald "Submitted ✓" badge, no CTA
- If not submitted: show amber "Pending" badge + "Give Feedback →" button
- Clicking opens the feedback form below (or use a modal)

**Mentor Feedback Form** (client component `/src/components/mentor/MentorFeedbackForm.tsx`):

```
┌──────────────────────────────────────────────────┐
│  Feedback for: Priya Menon  ·  Q2 2026          │
│  ──────────────────────────────────────────────  │
│  How would you rate their progress?              │
│  ★ ★ ★ ☆ ☆                                      │
│                                                  │
│  Observations on skill improvement               │
│  [                                             ] │
│  [                                             ] │
│                                                  │
│  Suggested focus for next quarter                │
│  [                                             ] │
│                                                  │
│              [  Submit Feedback  ]               │
└──────────────────────────────────────────────────┘
```

- Use `react-hook-form` + `zodResolver(mentorQuarterlySchema)`
- Star rating using `StarRating` component
- On success: toast "Feedback submitted for {employeeName}!" + replace form with read-only summary
- Hidden `targetUserId` field pre-populated with the reportee's id

---

### 6. Feedback Summary Card Component — `/src/components/shared/FeedbackSummaryCard.tsx`

Reusable component used in both employee and mentor feedback pages:

```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { getQuarterLabel } from "@/lib/utils"

interface FeedbackSummaryCardProps {
  quarter: number
  year: number
  rating: number
  learned: string
  nextGoal: string
  submittedBy: "EMPLOYEE" | "MENTOR"
  subjectName?: string // for mentor view: "Feedback for Priya Menon"
  collapsible?: boolean
  defaultOpen?: boolean
}

export function FeedbackSummaryCard({
  quarter, year, rating, learned, nextGoal, submittedBy, subjectName, collapsible = false, defaultOpen = true
}: FeedbackSummaryCardProps) {
  // implement collapsible toggle with useState if collapsible === true
  // render star rating as read-only filled/unfilled stars
  // render learned and nextGoal as styled text blocks
}
```

---

### 7. Update Mentor Employee Profile Page

In `/src/app/(dashboard)/mentor/[employeeId]/page.tsx`, add a **Quarterly Feedback History** section at the bottom (after Mentor Notes):

- Fetch all quarterly feedback for this employee (`submittedBy: EMPLOYEE` and `submittedBy: MENTOR`)
- Show two columns:
  - Left: Employee's reflections (past quarters)
  - Right: Mentor's feedback (past quarters)
- Use `FeedbackSummaryCard` with `collapsible: true`
- Empty state for each column: "No {employee/mentor} feedback submitted yet"

---

### 8. Sidebar Nav Active Link Update

Ensure the Feedback nav link in the sidebar shows a notification dot when:
- EMPLOYEE: current quarter feedback not yet submitted AND learning path exists
- MENTOR: any reportee has no mentor quarterly feedback this quarter

This is a nice-to-have — implement only if time allows.

---

## Acceptance Criteria
- [ ] Employee sees current quarter reflection form if not yet submitted
- [ ] Employee sees read-only summary if already submitted
- [ ] Employee cannot submit feedback without a learning path
- [ ] Duplicate quarterly submission is blocked server-side (400 error)
- [ ] Star rating is interactive and required
- [ ] Both textareas validate minimum length before submission
- [ ] Mentor sees all reportees with their feedback submission status
- [ ] Mentor can submit feedback for each reportee independently
- [ ] Mentor cannot submit feedback for another mentor's reportee (403)
- [ ] Mentor feedback history visible on the employee profile page
- [ ] Past feedback rendered as collapsible summary cards
- [ ] Quarter and year are auto-determined — no manual input needed
- [ ] Success toast shown on submission for both roles

---

## Test Flow
1. Login as `meera@mozilor.com` → go to `/employee/feedback`
2. Should see Q{current} reflection form (Meera has a generated path)
3. Fill in rating + both text fields → submit
4. Should see read-only summary card with "Submitted ✓" badge
5. Refresh page → still shows submitted summary (not the form)
6. Login as `arjun@mozilor.com` → go to `/mentor/feedback`
7. Should see Meera (submitted) and Rahul (no path yet)
8. Click "Give Feedback →" for Meera → fill form → submit
9. Go to `/mentor/meera-id` → scroll to bottom → see both employee + mentor feedback history
10. Try submitting feedback again for Meera → should get "already submitted" error