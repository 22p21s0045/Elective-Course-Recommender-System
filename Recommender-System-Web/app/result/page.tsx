"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// type Course = {
//     rank: number
//     title: string
//     code: string
//     credits: number
//     tags: string[]
//     grade: string
//     gpa: number
// }

// const recommendations: Course[] = [
//     {
//         rank: 1,
//         title: "Introduction to Machine Learning",
//         code: "INT201",
//         credits: 3,
//         tags: ["AI", "Programming"],
//         grade: "A",
//         gpa: 3.85,
//     },
//     {
//         rank: 2,
//         title: "Advanced Database Systems",
//         code: "INT305",
//         credits: 3,
//         tags: ["SQL", "NoSQL", "Performance"],
//         grade: "B+",
//         gpa: 3.62,
//     },
//     {
//         rank: 3,
//         title: "Cloud Computing Architecture",
//         code: "INT410",
//         credits: 3,
//         tags: ["Cloud", "DevOps"],
//         grade: "B+",
//         gpa: 3.41,
//     },
// ]
const getGradeLetter = (gpa: number): string => {
    if (gpa >= 4) return "A"
    if (gpa >= 3.5) return "B+"
    if (gpa >= 3.0) return "B"
    if (gpa >= 2.5) return "C+"
    if (gpa >= 2.0) return "C"
    if (gpa >= 1.5) return "D+"
    if (gpa >= 1.0) return "D"
    return "F"
}

export default function ResultPage() {
    const router = useRouter()

    const [studentId, setStudentId] = useState<string | null>(null)
    useEffect(() => {
        const id = localStorage.getItem("student_id")
        setStudentId(id)
    }, [])

    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const id = localStorage.getItem("student_id")
        setStudentId(id)

        const saved = localStorage.getItem("result")
        if (saved) {
            setData(JSON.parse(saved))
        }
    }, [])

    return (
        <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
            <Card className="w-full max-w-3xl rounded-2xl border border-black/10 shadow-sm">
                <CardContent className="p-8 space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Your Recommendations
                            </h1>
                            <p className="text-sm text-[#615d59]">
                                Ranked by predicted grade based on your academic profile and 175 student records.
                            </p>
                        </div>

                        <div className="text-sm bg-[#eaf4ff] text-[#0075de] px-3 py-1 rounded-full">
                            {studentId || "N/A"}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border rounded-xl p-4 bg-white">
                            <p className="text-xs text-[#615d59]">Records used</p>
                            <p className="text-lg font-semibold">{data?.target_student_records}</p>
                        </div>

                        {/* <div className="border rounded-xl p-4 bg-white">
                            <p className="text-xs text-[#615d59]">Courses analysed</p>
                            <p className="text-lg font-semibold">48</p>
                        </div> */}

                        <div className="border rounded-xl p-4 bg-white">
                            <p className="text-xs text-[#615d59]">Training time</p>
                            <p className="text-lg font-semibold">{data?.processing_time_seconds}s</p>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-6">
                        {data?.recommendations?.map((course: any, index: number) => {
                            const gradeLetter = getGradeLetter(course.predicted_grade)

                            return (
                                <div
                                    key={course.course_id}
                                    className="flex justify-between items-start border-t pt-4"
                                >
                                    {/* Left */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-[#0075de]">
                                                {index + 1}.
                                            </span>
                                            <h2 className="font-medium">
                                                {course.course_name_en}
                                            </h2>
                                        </div>

                                        <p className="text-sm text-[#615d59]">
                                            {course.course_id} • {course.credits} credits • {course.capacity} seats
                                        </p>

                                        <div className="flex gap-2">
                                            {course.topics?.map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="text-xs bg-black/5 px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-base text-[#615d59]">
                                            {course.lecturer_name}
                                        </p>
                                    </div>

                                    {/* Right */}
                                    <div className="text-right">
                                        <p
                                            className={`text-xl font-semibold ${gradeLetter === "A"
                                                ? "text-green-600"
                                                : gradeLetter === "B+" || gradeLetter === "B"
                                                    ? "text-[#0075de]"
                                                    : "text-orange-500"
                                                }`}
                                        >
                                            {gradeLetter}
                                        </p>
                                        <p className="text-sm text-[#615d59]">
                                            {course.predicted_grade.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-xs text-[#a39e98]">
                            Master data: 150 · Target subset: 25
                        </p>

                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                        >
                            ← Start over
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}