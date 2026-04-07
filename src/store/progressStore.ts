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
