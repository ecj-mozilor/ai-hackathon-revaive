"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

interface Note {
  id: string
  note: string
  createdAt: string | Date
}

interface Props {
  employeeId: string
  initialNotes: Note[]
}

function formatTimestamp(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(date))
}

export function MentorNotes({ employeeId, initialNotes }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    const optimistic: Note = {
      id: `temp-${Date.now()}`,
      note: text,
      createdAt: new Date(),
    }
    setNotes(prev => [optimistic, ...prev])
    const savedText = text
    setText("")

    try {
      const res = await fetch("/api/mentor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, note: savedText }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setNotes(prev => prev.filter(n => n.id !== optimistic.id))
        setText(savedText)
        toast.error(data.error ?? "Failed to save note")
      } else {
        setNotes(prev => prev.map(n => n.id === optimistic.id ? data.data : n))
      }
    } catch {
      setNotes(prev => prev.filter(n => n.id !== optimistic.id))
      setText(savedText)
      toast.error("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-zinc-900">Your Notes</h2>

      <div className="space-y-2">
        <Textarea
          placeholder="Add an observation about this employee's progress…"
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Note"}
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-400">No notes yet. Add observations about this employee&apos;s progress.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">&ldquo;{n.note}&rdquo;</p>
              <p className="mt-2 text-xs text-zinc-400 text-right">{formatTimestamp(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
