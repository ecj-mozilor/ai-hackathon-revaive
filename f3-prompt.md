# Feature 3 – AI-Powered Learning Path Generation

Build the AI learning path generation feature end-to-end.
Follow the design system and conventions defined in `CLAUDE.md`.
Features 1 and 2 (questionnaire, auth, layout, mentor feedback) are already complete.

---

## What to build

### 1. API Route — `/src/app/api/generate/route.ts`

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateLearningPath } from "@/lib/claude"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "EMPLOYEE") return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const userId = session.user.id

  // Verify status is READY_FOR_GENERATION
  const questionnaire = await prisma.questionnaireResponse.findUnique({ where: { userId } })
  if (!questionnaire || questionnaire.status !== "READY_FOR_GENERATION")
    return Response.json({ success: false, error: "Not ready for generation" }, { status: 400 })

  // Prevent duplicate generation
  const existingPath = await prisma.learningPath.findUnique({ where: { userId } })
  if (existingPath)
    return Response.json({ success: true, data: existingPath })

  // Fetch mentor feedback
  const mentorFeedback = await prisma.mentorInitialFeedback.findUnique({ where: { employeeId: userId } })
  if (!mentorFeedback)
    return Response.json({ success: false, error: "Mentor feedback not found" }, { status: 400 })

  // Call Claude API
  let aiResult
  try {
    aiResult = await generateLearningPath(questionnaire, mentorFeedback)
  } catch (err) {
    console.error("Claude API error:", err)
    return Response.json({ success: false, error: "AI generation failed. Please try again." }, { status: 502 })
  }

  // Validate shape
  if (!aiResult?.goal || !Array.isArray(aiResult?.stages)) {
    console.error("Invalid AI response shape:", aiResult)
    return Response.json({ success: false, error: "AI returned an unexpected response. Please try again." }, { status: 502 })
  }

  // Save to DB in a transaction
  try {
    const learningPath = await prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          userId,
          stages: {
            create: aiResult.stages.map((s: any) => ({
              title: s.title,
              duration: s.duration,
              order: s.order,
              resources: {
                create: s.resources.map((r: any) => ({
                  title: r.title,
                  type: r.type,
                  platform: r.platform,
                  url: r.url ?? null,
                  rationale: r.rationale,
                  priority: r.priority,
                  addedByMentor: false,
                  status: "PENDING"
                }))
              }
            }))
          }
        },
        include: {
          stages: { include: { resources: true }, orderBy: { order: "asc" } }
        }
      })

      await tx.questionnaireResponse.update({
        where: { userId },
        data: { status: "GENERATED" }
      })

      return path
    })

    return Response.json({ success: true, data: learningPath })
  } catch (err) {
    console.error("DB save error:", err)
    return Response.json({ success: false, error: "Failed to save learning path. Please try again." }, { status: 500 })
  }
}
```

---

### 2. Update Employee Home Page — `/src/app/(dashboard)/employee/page.tsx`

Update the `READY_FOR_GENERATION` status screen to handle the generation trigger:

The "Generate My Learning Path" button should:
- Be a client component button that POSTs to `/api/generate`
- Show a loading state while generating: spinner + "Building your path, this may take a few seconds…"
- On success: redirect to `/employee/learning-path` using `router.push`
- On error: show sonner toast with the error message + a "Try Again" button
- Disable button while loading to prevent double-submit

Create a client component `/src/components/employee/GeneratePathButton.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function GeneratePathButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch("/api/generate", { method: "POST" })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error ?? "Something went wrong")
        return
      }
      toast.success("Your learning path is ready!")
      router.push("/employee/learning-path")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      size="lg"
      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Building your path…
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate My Learning Path
        </>
      )}
    </Button>
  )
}
```

Update the `READY_FOR_GENERATION` screen in `/src/app/(dashboard)/employee/page.tsx` to use this component.

---

### 3. Loading / Generating Screen

When generation is in progress, show a full-card loading experience on the employee home page:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ✨  Your mentor has reviewed your profile!   │
│                                                 │
│   Sarah Chen has submitted their observations. │
│   Click below to generate your personalised    │
│   learning path powered by AI.                 │
│                                                 │
│   [  ✨ Generate My Learning Path  ]           │
│                                                 │
│   This usually takes 5–10 seconds.             │
│                                                 │
└─────────────────────────────────────────────────┘
```

While loading (after button click):
- Disable the button
- Show `Loader2` spinner + "Building your path…" text inside button
- Show subtle helper text below: "Hang tight! We're combining your profile with your mentor's feedback…"

---

### 4. Learning Path Page (Shell) — `/src/app/(dashboard)/employee/learning-path/page.tsx`

Build the full learning path display page. Fetch the learning path server-side.

**If no learning path exists:** redirect to `/employee`

**Page layout:**

**Header:**
- Breadcrumb: "My Learning Path"
- Goal banner card (indigo bg):
  ```
  🎯  Your path to: {learningPath.goal}
  Generated on {formattedDate}        Overall Progress: [====----] 45%
  ```
- Use shadcn `Progress` component for the overall progress bar

**Stage Cards** (rendered in order):
Each stage is a `Card` with:
- Stage number chip: `bg-indigo-600 text-white rounded-full w-7 h-7` + stage title
- Duration badge: `bg-zinc-100 text-zinc-600 text-xs`
- Stage progress bar (emerald colour): "2 of 4 completed"
- List of resource cards below

**Resource / Course Card** (`/src/components/employee/CourseCard.tsx`):
```
┌─────────────────────────────────────────────────────┐
│ 🟣 Mentor Recommended          [Course] [Coursera]  │
│                                                     │
│  Advanced TypeScript Patterns                       │
│  "Directly addresses identified gap in TS depth"    │
│                                                     │
│  [🔗 Open Course]    [▶ Start]                      │
└─────────────────────────────────────────────────────┘
```

- Violet left border + "Mentor Recommended" badge if `addedByMentor: true`
- Type badge: zinc pill
- Platform badge: zinc pill
- Rationale: `text-sm text-zinc-500 italic`
- "Open Course" button: only if `url` is not null, opens in new tab
- Status-based action buttons:
  - `PENDING` → "Start" button (indigo outline) — clicking updates status to `IN_PROGRESS`
  - `IN_PROGRESS` → blue "In Progress" badge + "Mark Complete" button (indigo filled)
  - `COMPLETED` → emerald "Completed ✓" badge, card slightly greyed (`opacity-75`), no action buttons
- All status changes call `PATCH /api/courses`

---

### 5. API Route — `/src/app/api/courses/route.ts`

Handle both status updates (employee) and course additions (mentor — stubbed for now, full implementation in F4):

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === "updateStatus") {
    if (session.user.role !== "EMPLOYEE")
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const { resourceId, status } = body
    if (!resourceId || !["IN_PROGRESS", "COMPLETED"].includes(status))
      return Response.json({ success: false, error: "Invalid request" }, { status: 400 })

    // Verify resource belongs to this user's learning path
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { stage: { include: { learningPath: true } } }
    })
    if (!resource || resource.stage.learningPath.userId !== session.user.id)
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { status }
    })

    return Response.json({ success: true, data: updated })
  }

  return Response.json({ success: false, error: "Unknown action" }, { status: 400 })
}
```

---

### 6. Progress Calculation Utilities — append to `/src/lib/utils.ts`

```ts
export function calcStageProgress(resources: { status: string }[]) {
  if (!resources.length) return 0
  const completed = resources.filter(r => r.status === "COMPLETED").length
  return Math.round((completed / resources.length) * 100)
}

export function calcOverallProgress(stages: { resources: { status: string }[] }[]) {
  const all = stages.flatMap(s => s.resources)
  if (!all.length) return 0
  const completed = all.filter(r => r.status === "COMPLETED").length
  return Math.round((completed / all.length) * 100)
}
```

---

### 7. CourseCard must be a client component

Since course status updates require interactivity, make `CourseCard` a client component.
It should manage its own `status` state locally (initialised from props) and update optimistically on button click before the API call completes. If the API call fails, revert to previous status and show a toast error.

---

## Acceptance Criteria
- [ ] "Generate My Learning Path" button triggers Claude API call
- [ ] Button shows loading state and is disabled during generation
- [ ] Learning path is saved to DB and employee is redirected on success
- [ ] Generation fails gracefully with a retry option
- [ ] Learning path page displays stages in correct order
- [ ] Resources are sorted by priority within each stage
- [ ] Mentor-recommended resources show violet border + badge
- [ ] "Open Course" link only appears when URL is not null
- [ ] Employee can update course status (Start / Mark Complete)
- [ ] Status changes persist to DB
- [ ] Stage and overall progress bars update as courses are completed
- [ ] Completed courses are visually distinct (greyed, no action buttons)
- [ ] Duplicate generation is prevented (returns existing path if already generated)

---

## Test Flow
1. Login as `priya@mozilor.com` / `hackathon123`
2. Should see "Your mentor has reviewed your profile" screen (status: `READY_FOR_GENERATION`)
3. Click "Generate My Learning Path" — watch the loading state
4. Should redirect to `/employee/learning-path` with a full AI-generated path
5. Click "Start" on a course → badge changes to "In Progress"
6. Click "Mark Complete" → card greys out, progress bars update
7. Login as `meera@mozilor.com` → should land directly on `/employee/learning-path` (already generated)