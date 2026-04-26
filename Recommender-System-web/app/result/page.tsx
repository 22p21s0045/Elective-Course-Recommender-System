"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Users, Clock, BookOpen } from "lucide-react"
import AdminTooltip from "@/components/ui/AdminTooltip"

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
                            <h1 className="text-3xl font-bold pb-2">
                                Your Recommendations
                            </h1>
                            <p className="text-base text-[#615d59]">
                                Ranked by predicted grade based on your academic profile
                            </p>
                        </div>

                        <div className="text-sm bg-[#eaf4ff] text-[#0075de] px-3 py-1 rounded-full">
                            {studentId || "N/A"}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border rounded-xl p-4 bg-white space-y-2">
                            <p className="text-xs text-[#615d59] flex items-center gap-2">
                                <BookOpen size={16} className="text-[#0075de]" />
                                Records used
                            </p>

                            <p className="text-lg font-semibold">
                                {data?.target_student_records}
                            </p>
                        </div>

                        {/* <div className="border rounded-xl p-4 bg-white">
                            <p className="text-xs text-[#615d59]">Courses analysed</p>
                            <p className="text-lg font-semibold">48</p>
                        </div> */}

                        <div className="border rounded-xl p-4 bg-white space-y-2">
                            <p className="text-xs text-[#615d59] flex items-center gap-2">
                                <Clock size={16} className="text-[#0075de]" />
                                Training time
                            </p>
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
                                    className="flex items-start justify-between border-t pt-4"
                                >
                                    {/* 1. Index */}
                                    <div className="w-6 text-[#0075de] font-medium">
                                        {index + 1}.
                                    </div>

                                    {/* 2. Course Info */}
                                    <div className="flex-1 space-y-3 px-3">
                                        <h2 className="text-base font-semibold">
                                            {course.course_name_en}
                                        </h2>

                                        <p className="text-sm text-[#615d59] flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-[16px]">
                                                {course.course_id}
                                            </span>

                                            <span className="opacity-40">•</span>

                                            <span className="flex items-center gap-1">
                                                <BookOpen size={13} />
                                                {course.credits} credits
                                            </span>

                                            <span className="flex items-center gap-1">
                                                <Users size={13} />
                                                {course.capacity} seats
                                            </span>
                                        </p>

                                        <div className="flex gap-2 flex-wrap">
                                            {course.topics?.map((tag: String) => (
                                                <span
                                                    key={`${course.course_id}-${tag}-${1}`}
                                                    className="text-xs bg-black/5 px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-sm text-[#615d59] leading-relaxed it">
                                            {course.description_en}
                                        </p>
                                        <p className="text-[15px] font-semibold text-[#615d59]">
                                            {course.lecturer_name}
                                        </p>
                                    </div>

                                    {/* 3. Grade */}
                                    <div className="w-16 text-right">
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

                    <hr />

                    {/* Footer */}
                    <div className="flex justify-center items-center pt-4">
                        {/* <p className="text-xs text-[#a39e98]">
                            Master data: 150 · Target subset: 25
                        </p> */}

                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                        >
                            <ArrowLeft size={16} /> Start over
                        </Button>
                    </div>

                </CardContent>
            </Card>
            <AdminTooltip />
        </div>
    )
}