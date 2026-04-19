"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Briefcase,
  Globe,
  Code,
  Users,
  Brain,
  Shield,
  Database,
  BarChart,
  Network,
  Cloud,
  Palette,
  Server,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { useEffect } from "react"

const topicIcons: Record<string, any> = {
  "Business & Management": Briefcase,
  "Web Development": Globe,
  "Professional Practice & Soft Skills": Users,
  "Data Science & AI": Brain,
  "Software Engineering": Code,
  "Cybersecurity": Shield,
  "Databases & Data Engineering": Database,
  "Mathematics & Statistics": BarChart,
  "Networking": Network,
  "DevOps & Architecture": Cloud,
  "UX/UI Design": Palette,
  "IT Fundamentals": Server,
}

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
  const router = useRouter()

  useEffect(() => {
    const saved = storage.getTopics()
    if (saved.length > 0) {
      setSelected(saved)
    }
  }, [])

  const toggleTopic = (topic: string) => {
    let updated: string[] = []

    if (selected.includes(topic)) {
      updated = selected.filter((t) => t !== topic)
    } else {
      if (selected.length < 3) {
        updated = [...selected, topic]
      } else {
        return
      }
    }

    setSelected(updated)
    storage.setTopics(updated)
    // console.log(updated)

  }

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4 font-inter">
      <Card className="w-full max-w-2xl rounded-2xl border border-black/10 shadow-sm">
        <CardContent className="p-8 space-y-6">

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-black/90">
              What topics are you interested in?
            </h1>
            <p className="text-base text-[#615d59]">
              Choose up to <span className="text-[#0075de] font-medium">3</span> to help us tailor your learning path
            </p>

            {/* <p className="text-xs text-[#a39e98]">
              {selected.length}/3 selected
            </p> */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((i) => {
                const isActive = i <= selected.length

                return (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
          border
          ${isActive
                        ? "bg-[#0075de] border-[#0075de] text-white"
                        : "bg-white border-black/20 text-transparent"
                      }`}
                  >
                    ✓
                  </div>
                )
              })}

              <span className="text-sm text-[#a39e98] ml-2">
                {selected.length}/3 selected
              </span>
            </div>
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
                    "p-4 rounded-xl border text-sm transition-all flex flex-col items-center justify-between",
                    "border-black/10 bg-white",
                    !isSelected && "hover:shadow-sm hover:border-[#0075de] hover:bg-[#f2f9ff]",
                    isSelected && "border-[#0075de] bg-[#0075de]"
                  )}
                >
                  {/* Icon below text */}
                  <div className={cn("p-3 bg-[#f2f9ff] rounded-xl", isSelected && "bg-[#4896da]")}
                  >
                    {(() => {
                      const Icon = topicIcons[topic]
                      return Icon ? (
                        <Icon
                          size={20}
                          className={cn(
                            "text-[#0075de]",
                            isSelected && "text-white"
                          )}
                        />
                      ) : null
                    })()}
                  </div>

                  <span className={cn("mt-2 text-center", isSelected && "text-white")}>{topic}</span>
                </button>
              )
            })}
          </div>

          <hr />

          {/* Footer */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#a39e98]">
              {selected.length === 0
                ? "Select at least 1 topic to continue"
                : (3 - selected.length > 0
                  ? `${3 - selected.length} more topic${3 - selected.length > 1 ? "s" : ""} available`
                  : "Maximum topics selected"
                )
              }
            </p>

            <Button
              disabled={selected.length === 0}
              onClick={() => router.push("/upload")}
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
