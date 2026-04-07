# Feature 5 – Employee Learning View & Progress Tracking

Build the complete employee-facing learning path view with progress tracking.
Follow the design system and conventions defined in `CLAUDE.md`.
Features 1–4 are already complete. The learning path page shell was partially built in F3 — this feature completes and polishes it fully.

---

## What to build

### 1. Update Progress Utilities — `/src/lib/utils.ts`

Verify these functions exist (added in F3). If missing, add them:

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

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  })
}
```

---

### 2. Full Learning Path Page — `/src/app/(dashboard)/employee/learning-path/page.tsx`

Fetch the full learning path server-side including all stages and resources.
Redirect to `/employee` if no learning path exists.

**Page structure:**

```
[Back to Dashboard]

🎯 Your path to: {goal}                    [Overall Progress 65%]
   Generated on Apr 7, 2026

─────────────────────────────────────────────────────

  Stage 1                           2 weeks  [3/4 done]
  Strengthen Core TypeScript        [███████░] 75%
  ┌──────────────────────────────────────────────────┐
  │ course card                                      │
  │ course card                                      │
  └──────────────────────────────────────────────────┘

  Stage 2                           3 weeks  [0/3 done]
  System Design Fundamentals        [░░░░░░░░] 0%
  ...

─────────────────────────────────────────────────────
```

**Header card (indigo gradient bg `from-indigo-600 to-indigo-800`):**
- Goal text: `text-2xl font-semibold text-white`
- Generated date: `text-indigo-200 text-sm`
- Overall progress bar on the right side:
  - Label: `text-white text-sm` "{n} of {total} courses completed"
  - shadcn `Progress` with white indicator: `[&>*]:bg-white bg-indigo-400`
  - Percentage: `text-white font-medium`

**Stage card:**
- Stage number circle: `bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`
- Stage title: `text-lg font-semibold text-zinc-800`
- Duration badge: `bg-zinc-100 text-zinc-500 text-xs px-2 py-1 rounded-full`
- Stage progress: `text-sm text-zinc-500` "{completed} of {total} completed"
- Emerald progress bar for stage: `[&>*]:bg-emerald-500`
- Stage complete banner: if all resources completed, show `bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm` → "🎉 Stage complete! Great work."

---

### 3. Course Card Component — `/src/components/employee/CourseCard.tsx`

Full client component with optimistic status updates.

```tsx
"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ExternalLink, PlayCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Resource {
  id: string
  title: string
  type: string
  platform: string
  url: string | null
  rationale: string
  priority: number
  addedByMentor: boolean
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
}

export function CourseCard({ resource }: { resource: Resource }) {
  const [status, setStatus] = useState(resource.status)
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: "IN_PROGRESS" | "COMPLETED") {
    const prev = status
    setStatus(newStatus) // optimistic
    setLoading(true)
    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", resourceId: resource.id, status: newStatus })
      })
      const data = await res.json()
      if (!data.success) {
        setStatus(prev) // revert
        toast.error("Failed to update course status")
      }
    } catch {
      setStatus(prev)
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn(
      "p-4 border transition-all duration-200",
      resource.addedByMentor && "border-l-4 border-l-violet-500",
      status === "COMPLETED" && "opacity-60 bg-zinc-50"
    )}>
      {/* Mentor badge */}
      {resource.addedByMentor && (
        <Badge className="bg-violet-100 text-violet-700 mb-2 text-xs">
          Mentor Recommended
        </Badge>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className={cn(
          "font-medium text-zinc-800",
          status === "COMPLETED" && "line-through text-zinc-400"
        )}>
          {resource.title}
        </h4>
        <div className="flex gap-1 shrink-0">
          <Badge variant="outline" className="text-xs">{resource.type}</Badge>
          <Badge variant="outline" className="text-xs">{resource.platform}</Badge>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-sm text-zinc-500 italic mb-3">{resource.rationale}</p>

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap">
        {resource.url && (
          <Button variant="outline" size="sm" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Open Course
            </a>
          </Button>
        )}

        {status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            onClick={() => updateStatus("IN_PROGRESS")}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <PlayCircle className="h-3 w-3 mr-1" />}
            Start
          </Button>
        )}

        {status === "IN_PROGRESS" && (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => updateStatus("COMPLETED")}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Mark Complete
            </Button>
          </div>
        )}

        {status === "COMPLETED" && (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )}
      </div>
    </Card>
  )
}
```

---

### 4. Stage Card Component — `/src/components/employee/StageCard.tsx`

Client component that tracks stage-level progress reactively.

```tsx
"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CourseCard } from "./CourseCard"
import { calcStageProgress } from "@/lib/utils"

// Pass resources sorted by priority (priority 0 first, then ascending)
export function StageCard({ stage, index }: { stage: any, index: number }) {
  const sorted = [...stage.resources].sort((a, b) => a.priority - b.priority)
  const [progress, setProgress] = useState(calcStageProgress(stage.resources))
  const isComplete = progress === 100

  return (
    <div className="space-y-3">
      {/* Stage header */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-zinc-800">{stage.title}</h3>
            <Badge variant="outline" className="text-xs text-zinc-500">{stage.duration}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={progress}
              className="h-1.5 flex-1 [&>*]:bg-emerald-500"
            />
            <span className="text-xs text-zinc-500 shrink-0">
              {stage.resources.filter((r: any) => r.status === "COMPLETED").length} / {stage.resources.length}
            </span>
          </div>
        </div>
      </div>

      {/* Stage complete banner */}
      {isComplete && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-emerald-700 text-sm">
          🎉 Stage complete! Great work.
        </div>
      )}

      {/* Course cards */}
      <div className="space-y-3 pl-11">
        {sorted.map(resource => (
          <CourseCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  )
}
```

---

### 5. Overall Progress Header — `/src/components/employee/LearningPathHeader.tsx`

Client component that reacts to course completions via a shared Zustand store.

Create `/src/store/progressStore.ts`:

```ts
import { create } from "zustand"

interface ProgressStore {
  completedIds: Set<string>
  markComplete: (id: string) => void
}

export const useProgressStore = create<ProgressStore>((set) => ({
  completedIds: new Set(),
  markComplete: (id) => set(state => ({
    completedIds: new Set([...state.completedIds, id])
  }))
}))
```

Update `CourseCard` to call `markComplete` from the store when a course is marked complete.

`LearningPathHeader` reads total resources and completed count, deriving live overall progress.

```tsx
"use client"
import { Progress } from "@/components/ui/progress"
import { useProgressStore } from "@/store/progressStore"
import { calcOverallProgress } from "@/lib/utils"

export function LearningPathHeader({
  goal,
  generatedAt,
  stages,
  allResourceIds,
  initialCompleted
}: {
  goal: string
  generatedAt: string
  stages: any[]
  allResourceIds: string[]
  initialCompleted: string[]
}) {
  const { completedIds } = useProgressStore()
  const allCompleted = new Set([...initialCompleted, ...completedIds])
  const total = allResourceIds.length
  const completed = allResourceIds.filter(id => allCompleted.has(id)).length
  const pct = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm mb-1">Your learning goal</p>
          <h1 className="text-2xl font-semibold">🎯 {goal}</h1>
          <p className="text-indigo-200 text-sm mt-1">Generated on {generatedAt}</p>
        </div>
        <div className="md:w-64 shrink-0">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-indigo-100">Overall Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 bg-indigo-400 [&>*]:bg-white" />
          <p className="text-indigo-200 text-xs mt-1">{completed} of {total} courses completed</p>
        </div>
      </div>
    </div>
  )
}
```

---

### 6. Status Screens — `/src/app/(dashboard)/employee/page.tsx`

Ensure all four status screens are fully polished:

**No questionnaire — Welcome screen:**
```
┌─────────────────────────────────────────────────┐
│  👋  Welcome to SkillPath                       │
│                                                 │
│  Let's build your personalised learning path.  │
│  Start by telling us about your skills and     │
│  career goals — it only takes 5 minutes.       │
│                                                 │
│  [  Get Started →  ]                           │
└─────────────────────────────────────────────────┘
```
- Card: `border-2 border-dashed border-zinc-200`
- Icon: `Rocket` from lucide, `text-indigo-500 h-10 w-10`

**AWAITING_MENTOR — Waiting screen:**
```
┌─────────────────────────────────────────────────┐
│  🕐  Waiting for your mentor                   │
│                                                 │
│  Your profile is with your mentor for review.  │
│  Once they submit their observations, you'll   │
│  be able to generate your learning path.       │
│                                                 │
│  We'll have your path ready soon!              │
└─────────────────────────────────────────────────┘
```
- Card: amber left border `border-l-4 border-l-amber-400`
- Icon: `Clock` from lucide, `text-amber-500`

**READY_FOR_GENERATION — Generate screen:**
```
┌─────────────────────────────────────────────────┐
│  ✨  Your mentor has reviewed your profile!    │
│                                                 │
│  {mentorName} has submitted their feedback.    │
│  Your personalised learning path is ready to  │
│  be generated.                                 │
│                                                 │
│  [  ✨ Generate My Learning Path  ]            │
│  This usually takes 5–10 seconds.             │
└─────────────────────────────────────────────────┘
```
- Card: indigo left border `border-l-4 border-l-indigo-500`
- Icon: `Sparkles` from lucide, `text-indigo-500`
- Fetch mentor name server-side to personalise the message

---

### 7. Empty & Error States

**No learning path (edge case):**
If employee has `GENERATED` status but no learning path record (shouldn't happen but guard for it):
- Show error card: "Something went wrong loading your learning path. Please contact support."

**All courses completed:**
If overall progress is 100%, show a celebration banner at the top of the learning path page:
```
┌─────────────────────────────────────────────────┐
│  🏆  You've completed your learning path!      │
│  Fantastic work this quarter. Head to the      │
│  Feedback section to reflect on your journey. │
│  [  Submit Quarterly Feedback →  ]            │
└─────────────────────────────────────────────────┘
```
- `bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-5`
- Button links to `/employee/feedback`

---

## Acceptance Criteria
- [ ] Learning path page displays all stages in correct order
- [ ] Resources within each stage sorted by priority (0 first, mentor courses always at top)
- [ ] Mentor-recommended courses have violet left border + "Mentor Recommended" badge
- [ ] "Open Course" link only shown when URL exists, opens in new tab
- [ ] Employee can click "Start" → status updates to IN_PROGRESS optimistically
- [ ] Employee can click "Mark Complete" → status updates to COMPLETED optimistically
- [ ] If API update fails, status reverts and toast error shown
- [ ] Stage progress bar updates as courses are completed
- [ ] "Stage complete" banner appears when all resources in a stage are done
- [ ] Overall progress bar in the header updates live across all stages
- [ ] Completed courses show strikethrough title, greyed card, no action buttons
- [ ] All four employee status screens are rendered correctly
- [ ] 100% completion triggers the celebration banner with feedback CTA
- [ ] Mentor name is shown in the READY_FOR_GENERATION screen

---

## Test Flow
1. Login as `rahul@mozilor.com` → should see Welcome screen
2. Login as `dev@mozilor.com` → should see Awaiting Mentor screen
3. Login as `priya@mozilor.com` → should see Generate screen with Sarah's name
4. Click Generate → redirect to learning path
5. Click "Start" on first course → badge changes to In Progress
6. Click "Mark Complete" → card greys out, stage progress bar fills
7. Complete all courses in a stage → "Stage complete 🎉" banner appears
8. Login as `meera@mozilor.com` → should land directly on learning path (already generated)
9. Complete all of Meera's courses → celebration banner appears with feedback CTA