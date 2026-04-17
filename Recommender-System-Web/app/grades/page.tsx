"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
// import { api } from "@/lib/api"

type Course = {
  code: string
  name: string
}


// const courses: Course[] = [
//   { code: "INT101", name: "Intro to Logic" },
//   { code: "INT222", name: "Foundations of Ethics" },
//   { code: "INT333", name: "Web Programming" },
//   { code: "CSC215", name: "Data Structures" },
//   { code: "MTH201", name: "Calculus I" },
// ]

const grades = ["A", "B+", "B", "C+", "C", "D+", "D", "F"]

export default function GradesPage() {
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedGrades, setSelectedGrades] = useState<Record<string, string>>({})

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("courses") || "[]")

    setCourses(savedCourses)

    // ✅ pre-fill grades from upload
    const initialGrades: Record<string, string> = {}

    savedCourses.forEach((c: any) => {
      initialGrades[c.code] = c.grade
    })

    setSelectedGrades(initialGrades)
  }, [])

  const handleSelect = (courseCode: string, grade: string) => {
    setSelectedGrades((prev) => ({
      ...prev,
      [courseCode]: grade,
    }))
  }

  const isComplete = courses.every((c) => selectedGrades[c.code])

  const handleSubmit = async () => {
    try {
      const studentId = localStorage.getItem("student_id")

      const raw_grades = Object.entries(selectedGrades).map(
        ([code, grade]) => ({
          course_code: code,
          grade_letter: grade,
        })
      )

      const topics = JSON.parse(localStorage.getItem("topics") || "[]")

      const payload = {
        student_id: studentId,
        raw_grades,
        topics,
        extra_text: "",
        academic_year: 2568,
        semester: 1,
        svd_weight: 0.5,
        embedding_weight: 0.5,
        limit: 3,
      }

      const res = await fetch("http://127.0.0.1:8000/recommend/hybrid-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch recommendations")
      }

      const result = await res.json()

      console.log("Result:", result)

      // ✅ save for result page
      localStorage.setItem("result", JSON.stringify(result))

      router.push("/result")

    } catch (err) {
      console.error(err)
      alert("Failed to get recommendations")
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl rounded-2xl border border-black/10 shadow-sm">
        <CardContent className="p-8 space-y-6">

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Welcome</h1>
            <p className="text-sm text-[#615d59]">
              To tailor your elective recommendations, please provide your
              current standing in these mandatory core disciplines.
            </p>
          </div>

          {/* Course List */}
          <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
            {courses.map((course) => (
              <div
                key={course.code}
                className="flex items-center justify-between border border-black/10 rounded-xl px-4 py-3 bg-white"
              >
                {/* LEFT: code + name */}
                <div className="text-sm">
                  <span className="text-[#a39e98] mr-2">
                    {course.code}
                  </span>
                  <span className="text-black/80">
                    {course.name}
                  </span>
                </div>

                {/* RIGHT: grade dropdown */}
                <select
                  value={selectedGrades[course.code] || ""}
                  onChange={(e) =>
                    handleSelect(course.code, e.target.value)
                  }
                  className={`text-sm border rounded-md px-2 py-1 bg-white ${selectedGrades[course.code]
                    ? "border-[#0075de]"
                    : "border-black/10"
                    }`}
                >
                  <option value="">Select Grade</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-[#a39e98]">
              All data is processed securely.
            </p>

            <Button
              disabled={!isComplete}
              onClick={handleSubmit}
              className="bg-[#0075de] hover:bg-[#005bab]"
            >
              Find My Electives →
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}