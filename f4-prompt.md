# Feature 4 – Mentor Dashboard & Course Management

Build the mentor dashboard and course management feature end-to-end.
Follow the design system and conventions defined in `CLAUDE.md`.
Features 1, 2, and 3 are already complete.

---

## What to build

### 1. Add Zod Schemas — append to `/src/lib/validations.ts`

```ts
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
```

---

### 2. Update API Route — `/src/app/api/courses/route.ts`

Extend the existing PATCH handler to support `promote` and `add` actions for mentors.
Keep the existing `updateStatus` action for employees untouched.

Add the following cases inside the PATCH handler:

```ts
if (action === "promote") {
  if (session.user.role !== "MENTOR")
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const parsed = promoteCourseSchema.safeParse(body)
  if (!parsed.success)
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  // Ownership check: resource must belong to mentor's reportee
  const resource = await prisma.resource.findUnique({
    where: { id: parsed.data.resourceId },
    include: { stage: { include: { learningPath: { include: { user: true } } } } }
  })
  if (!resource || resource.stage.learningPath.user.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const updated = await prisma.resource.update({
    where: { id: parsed.data.resourceId },
    data: { priority: 0, addedByMentor: true }
  })
  return Response.json({ success: true, data: updated })
}

if (action === "add") {
  if (session.user.role !== "MENTOR")
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const parsed = addCourseSchema.safeParse(body)
  if (!parsed.success)
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  // Ownership check: stageId must belong to mentor's reportee
  const stage = await prisma.stage.findUnique({
    where: { id: parsed.data.stageId },
    include: { learningPath: { include: { user: true } } }
  })
  if (!stage || stage.learningPath.user.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const resource = await prisma.resource.create({
    data: {
      stageId: parsed.data.stageId,
      title: parsed.data.title,
      platform: parsed.data.platform,
      type: parsed.data.type,
      url: parsed.data.url || null,
      rationale: parsed.data.rationale,
      priority: 0,
      addedByMentor: true,
      status: "PENDING"
    }
  })
  return Response.json({ success: true, data: resource })
}
```

---

### 3. Mentor Notes API — `/src/app/api/mentor-notes/route.ts`

```ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

// Add a MentorNote model to prisma first (see schema addition below)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "MENTOR")
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { employeeId, note } = body
  if (!employeeId || !note)
    return Response.json({ success: false, error: "Missing fields" }, { status: 400 })

  // Ownership check
  const employee = await prisma.user.findUnique({ where: { id: employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const mentorNote = await prisma.mentorNote.create({
    data: { mentorId: session.user.id, employeeId, note }
  })

  return Response.json({ success: true, data: mentorNote })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employeeId")
  if (!employeeId)
    return Response.json({ success: false, error: "Missing employeeId" }, { status: 400 })

  const employee = await prisma.user.findUnique({ where: { id: employeeId } })
  if (!employee || employee.mentorId !== session.user.id)
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })

  const notes = await prisma.mentorNote.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  })

  return Response.json({ success: true, data: notes })
}
```

---

### 4. Add MentorNote to Prisma Schema

Append to `/prisma/schema.prisma`:

```prisma
model MentorNote {
  id         String   @id @default(cuid())
  mentorId   String
  mentor     User     @relation("NotesByMentor", fields: [mentorId], references: [id])
  employeeId String
  employee   User     @relation("NotesForEmployee", fields: [employeeId], references: [id])
  note       String
  createdAt  DateTime @default(now())
}
```

Also add these relations to the `User` model:
```prisma
notesByMentor    MentorNote[] @relation("NotesByMentor")
notesForEmployee MentorNote[] @relation("NotesForEmployee")
```

After updating schema, run:
```bash
pnpm prisma db push
pnpm prisma generate
```

---

### 5. Update Mentor Employee Profile Page — `/src/app/(dashboard)/mentor/[employeeId]/page.tsx`

Extend the existing page (built in F2) with two new sections, shown only when `status === "GENERATED"`.

**Fetch additional data server-side:**
- Full learning path with stages and resources
- All mentor notes for this employee

---

### 6. Course Management Section (client component)

Create `/src/components/mentor/CourseManager.tsx` as a client component.

**Sub-section A — Promote Existing Course**

- Heading: "Promote a Course to Top"
- Description: "Move an existing AI-recommended course to the top of the list"
- A `Select` dropdown listing all non-mentor resources across all stages:
  - Format: "Stage 1 — {resource title}"
  - Grouped by stage using `optgroup` or section labels
- "Promote to Top" button (indigo outline)
- On submit: PATCH `/api/courses` with `action: "promote"`
- On success: toast "Course promoted! It will appear at the top of the employee's list." + optimistic UI update
- Already-promoted courses should not appear in the dropdown

**Sub-section B — Add a New Course**

Form fields using `react-hook-form` + `zodResolver(addCourseSchema)`:
- Title: `Input`
- Platform: `Input` (e.g. Coursera, YouTube, Udemy)
- Type: `Select` → Video / Article / Course / Book / Project
- Add to Stage: `Select` → lists all stages by title
- URL: `Input` (optional, shows helper: "Leave blank if no direct link")
- Rationale: `Textarea` (why are you recommending this?)
- "Add Course" button (indigo filled)
- On success: toast "Course added! It appears at the top of Stage {n} with a Mentor Recommended badge." + optimistic UI update
- Clear form on success

**Layout of CourseManager:**
```
┌─────────────────────────────────────────────────┐
│  Course Management                              │
│  ─────────────────────────────────────────────  │
│  Promote Existing Course                        │
│  [Select a course ▼]  [Promote to Top]          │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Add a New Course                               │
│  Title      [________________]                  │
│  Platform   [________________]  Type [______▼]  │
│  Add to Stage              [______▼]            │
│  URL (optional) [________________]              │
│  Rationale  [________________________]          │
│                          [  Add Course  ]       │
└─────────────────────────────────────────────────┘
```

---

### 7. Learning Path Read-Only View (Mentor)

Create `/src/components/mentor/MentorLearningPathView.tsx`.

Mirrors the employee's learning path view but:
- No "Start" or "Mark Complete" buttons
- Shows employee's current progress status as a read-only badge per course
- Stage progress bars are visible (read-only)
- Mentor-added courses show the violet "Mentor Recommended" badge
- Overall progress shown in the header

---

### 8. Mentor Notes Section (client component)

Create `/src/components/mentor/MentorNotes.tsx` as a client component.

- Heading: "Your Notes"
- `Textarea` for new note + "Save Note" button
- On save: POST `/api/mentor-notes`, append to list optimistically
- Notes displayed as a timestamped list below the input:
  ```
  ┌──────────────────────────────────────────┐
  │ "Priya is making great progress on React │
  │  — suggest moving to system design next" │
  │                      Apr 7, 2026 · 10:32 │
  └──────────────────────────────────────────┘
  ```
- Each note in a `Card` with `text-sm text-zinc-700` and timestamp `text-xs text-zinc-400`
- Empty state: "No notes yet. Add observations about this employee's progress."

---

### 9. Full Employee Profile Page Layout

The final `/src/app/(dashboard)/mentor/[employeeId]/page.tsx` should render these sections in order:

1. **Profile Summary** (from F2 — already built, read-only)
2. **Initial Feedback Summary** (from F2 — already built, read-only)
3. **Learning Path View** ← new (only if `GENERATED`)
4. **Course Management** ← new (only if `GENERATED`)
5. **Mentor Notes** ← new (always visible)

If status is not `GENERATED`, show an info card between sections 2 and 5:
- "The learning path hasn't been generated yet. Once the employee generates their path, you'll be able to manage courses here."

---

## Acceptance Criteria
- [ ] Mentor can see all reportees with correct status badges on `/mentor`
- [ ] Mentor can view full learning path of a reportee in read-only mode
- [ ] Employee progress (completed/in-progress) is visible to mentor
- [ ] Mentor can promote an existing AI course to top priority
- [ ] Promoted course gets `priority: 0` and `addedByMentor: true`
- [ ] Mentor can add a new course with all required fields validated
- [ ] Added course appears with "Mentor Recommended" violet badge
- [ ] Mentor-added courses appear at the top of the stage (sorted by priority)
- [ ] Mentor notes are saved and displayed with timestamps
- [ ] Course management section is hidden when path not yet generated
- [ ] Mentor cannot access another mentor's reportee (redirect enforced)
- [ ] All mutations show optimistic UI updates + toast confirmations

---

## Test Flow
1. Login as `sarah@mozilor.com` / `hackathon123`
2. Click **Priya Menon** (status: `GENERATED` after F3)
3. See Priya's full learning path in read-only view with her progress
4. In "Promote Existing Course" — select a course → click Promote → verify it moves to top with violet badge
5. In "Add a New Course" — fill all fields → submit → verify it appears at top of selected stage
6. Login as `priya@mozilor.com` → go to `/employee/learning-path` → verify mentor-added course appears with violet "Mentor Recommended" badge at the top
7. Back as Sarah → add a note → verify it saves with timestamp