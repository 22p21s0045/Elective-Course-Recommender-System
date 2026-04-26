"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import FindingElectivesLoading from "@/components/ui/FindingElectivesLoading"
import AdminTooltip from "@/components/ui/AdminTooltip"

type Course = {
  code: string
  name: string
}

const grades = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "S"]

export default function GradesPage() {
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("courses") || "[]")
    setCourses(savedCourses)

    const initialGrades: Record<string, string> = {}
    savedCourses.forEach((c: any) => {
      initialGrades[c.code] = c.grade
    })
    setSelectedGrades(initialGrades)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  const handleSelect = (courseCode: string, grade: string) => {
    setSelectedGrades((prev) => ({ ...prev, [courseCode]: grade }))
  }

  const isComplete = courses.every((c) => selectedGrades[c.code])

  const handleSubmit = async () => {
    if (!isComplete) return

    try {
      setLoading(true)

      const studentId = localStorage.getItem("student_id")
      const raw_grades = Object.entries(selectedGrades).map(([code, grade]) => ({
        course_code: code,
        grade_letter: grade,
      }))
      const topics = JSON.parse(localStorage.getItem("topics") || "[]")

      const payload = {
        student_id: studentId,
        raw_grades,
        topics,
        extra_text: "",
        academic_year: 2026,
        semester: 1,
        svd_weight: 0.5,
        embedding_weight: 0.5,
        limit: 3,
      }

      const res = await fetch("http://127.0.0.1:8000/recommend/hybrid-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to fetch recommendations")

      const result = await res.json()
      localStorage.setItem("result", JSON.stringify(result))
      router.push("/result")

    } catch (err) {
      console.error(err)
      alert("Failed to get recommendations")
      setLoading(false)
    }
  }

  if (loading) return <FindingElectivesLoading />

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl rounded-2xl border border-black/10 shadow-sm">
        <CardContent className="p-8 space-y-6">

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Check Your grade before next step</h1>
            <p className="text-base text-[#615d59]">
              Please verify your grades for accuracy before proceeding to the <br /> next step
            </p>
          </div>

          {/* Course List */}
          <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
            {courses.map((course) => (
              <div
                key={course.code}
                className="flex items-center justify-between border border-black/10 rounded-xl px-5 py-5 bg-[#FAFAFA]"
              >
                {/* LEFT: code + name */}
                <div className="text-sm">
                  <span className="text-[#a39e98] mr-2">{course.code}</span>
                  <span className="text-black/80">{course.name}</span>
                </div>

                {/* RIGHT: grade dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdown((prev) => prev === course.code ? null : course.code)
                    }}
                    className={`text-sm rounded-sm px-3 py-1.25 min-w-25 text-center border
                      ${selectedGrades[course.code]
                        ? "bg-[#0075de] text-white border-[#0075de]"
                        : "bg-white border-black/10 text-black/70"
                      }`}
                  >
                    {selectedGrades[course.code] || "Select Grade"}
                  </button>

                  {openDropdown === course.code && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-md shadow-md z-10 p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {grades.map((g) => (
                          <div
                            key={g}
                            onClick={() => { handleSelect(course.code, g); setOpenDropdown(null) }}
                            className={`py-2 text-sm text-center rounded-md cursor-pointer
                              ${selectedGrades[course.code] === g
                                ? "bg-[#0075de] text-white"
                                : "hover:bg-[#f2f9ff]"
                              }`}
                          >
                            {g}
                          </div>
                        ))}
                        <div
                          onClick={() => { handleSelect(course.code, ""); setOpenDropdown(null) }}
                          className="col-span-4 py-2 text-sm text-center rounded-md cursor-pointer hover:bg-[#f2f9ff] text-[#a39e98]"
                        >
                          Select Grade
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <hr />

          {/* Footer */}
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-[#a39e98]">All data is processed securely.</p>
            <Button
              disabled={!isComplete}
              onClick={handleSubmit}
              className="bg-[#0075de] hover:bg-[#005bab]"
            >
              Find My Electives <ArrowRight size={16} />
            </Button>
          </div>

        </CardContent>
      </Card>
      <AdminTooltip/>
    </div>
  )
}