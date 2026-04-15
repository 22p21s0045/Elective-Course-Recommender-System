import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const topics = [
  "Business & Management",
  "Web Development",
  "Professional Practice & Soft Skills",
  "Data Science & AI",
  "Software Engineering",
  "Cybersecurity",
  "Databases & Data Engineering",
  "Mathematics & Statistics",
  "Networking",
  "DevOps & Architecture",
  "UX/UI Design",
  "IT Fundamentals",
]

export default function TopicSelection() {
  const [selected, setSelected] = useState<string[]>([])

  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      setSelected(selected.filter((t) => t !== topic))
    } else {
      if (selected.length < 3) {
        setSelected([...selected, topic])
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl rounded-2xl border border-black/10 shadow-sm">
        <CardContent className="p-8 space-y-6">

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-black/90">
              What topics are you interested in?
            </h1>
            <p className="text-sm text-[#615d59]">
              Choose up to <span className="text-[#0075de] font-medium">3</span> to help us tailor your learning path
            </p>

            <p className="text-xs text-[#a39e98]">
              {selected.length}/3 selected
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topics.map((topic) => {
              const isSelected = selected.includes(topic)

              return (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "p-4 rounded-xl border text-sm text-left transition-all",
                    "border-black/10 bg-white hover:shadow-sm",
                    isSelected && "border-[#0075de] bg-[#f2f9ff]"
                  )}
                >
                  {topic}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4">
            <p className="text-xs text-[#a39e98]">
              Select at least 1 topic to continue
            </p>

            <Button
              disabled={selected.length === 0}
              className="bg-[#0075de] hover:bg-[#005bab]"
            >
              Continue →
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}