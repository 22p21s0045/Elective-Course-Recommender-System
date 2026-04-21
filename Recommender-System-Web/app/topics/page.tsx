"use client"
import { useState, useEffect } from "react"
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
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"

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
  // Fallback icons for dynamic topics
  "Programming": Code,
  "Security": Shield,
  "Default": Brain,
}

const getFallbackIcon = (topic: string) => {
  return topicIcons[topic] ?? topicIcons["Default"]
}

export default function TopicSelection() {
  const [selected, setSelected] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("http://127.0.0.1:8000/elective-courses/topics", {
          method: "POST"
        })
        if (!res.ok) throw new Error(`Failed to fetch topics (${res.status})`)

        const data: { topics: string[] } = await res.json()
        setTopics(data.topics)

        // Restore saved selections (only keep ones that still exist in new list)
        const saved = storage.getTopics()
        if (saved.length > 0) {
          setSelected(saved.filter((t) => data.topics.includes(t)))
        }
      } catch (err: any) {
        setError(err.message ?? "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
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

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((i) => {
                const isActive = i <= selected.length
                return (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isActive
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

          {/* Grid — Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#a39e98]">
              <Loader2 size={28} className="animate-spin text-[#0075de]" />
              <p className="text-sm">Loading topics…</p>
            </div>
          )}

          {/* Grid — Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#a39e98]">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-[#0075de] underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Grid — Topics */}
          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic) => {
                const isSelected = selected.includes(topic)
                const Icon = getFallbackIcon(topic)

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
                    <div className={cn("p-3 bg-[#f2f9ff] rounded-xl", isSelected && "bg-[#4896da]")}>
                      <Icon
                        size={20}
                        className={cn("text-[#0075de]", isSelected && "text-white")}
                      />
                    </div>
                    <span className={cn("mt-2 text-center", isSelected && "text-white")}>
                      {topic}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <hr />

          {/* Footer */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#a39e98]">
              {selected.length === 0
                ? "Select at least 1 topic to continue"
                : 3 - selected.length > 0
                  ? `${3 - selected.length} more topic${3 - selected.length > 1 ? "s" : ""} available`
                  : "Maximum topics selected"}
            </p>

            <Button
              disabled={selected.length === 0 || loading}
              onClick={() => router.push("/upload")}
              className="bg-[#0075de] hover:bg-[#005bab]"
            >
              Continue <ArrowRight size={16} />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}