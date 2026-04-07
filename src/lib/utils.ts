import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return { quarter, year: now.getFullYear() }
}

export function getQuarterLabel(quarter: number, year: number) {
  return `Q${quarter} ${year}`
}
