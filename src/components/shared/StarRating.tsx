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
