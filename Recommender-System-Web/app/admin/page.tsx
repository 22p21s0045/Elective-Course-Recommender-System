"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Calendar, Users, BookOpen, Plus, ArrowLeft, GraduationCap } from "lucide-react"

type Course = {
    id: string
    course_id: string
    course_name_th: string
    course_name_en: string
    description_th: string
    description_en: string
    is_elective: boolean
    topics: string[]
    credits: string
    created_at: string
    updated_at: string
    has_embedding: boolean
    academic_year: number
    semester: number
    lecturer_name: string
    capacity: number
    opening_course_id: string
}

const semesterFilters = ["All", "Sem 1", "Sem 2", "Summer"] as const
type SemesterFilter = typeof semesterFilters[number]

const semesterLabel: Record<number, string> = {
    1: "Sem 1",
    2: "Sem 2",
    3: "Summer",
}

const semesterColor: Record<string, string> = {
    "Sem 1": "text-[#0075de] bg-[#eaf4ff]",
    "Sem 2": "text-[#7c3aed] bg-[#f3f0ff]",
    "Summer": "text-[#d97706] bg-[#fffbeb]",
}

export default function AdminPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [activeFilter, setActiveFilter] = useState<SemesterFilter>("All")

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                const res = await fetch("http://127.0.0.1:8000/elective-courses/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                })
                if (!res.ok) throw new Error("Failed to fetch courses")
                const data: Course[] = await res.json()
                setCourses(data)
            } catch (err) {
                console.error(err)
                setError("Failed to load courses. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [])

    const filtered = courses.filter((c) => {
        const label = semesterLabel[c.semester] ?? ""
        const matchSearch =
            c.course_name_en.toLowerCase().includes(search.toLowerCase()) ||
            c.course_id.toLowerCase().includes(search.toLowerCase()) ||
            c.lecturer_name.toLowerCase().includes(search.toLowerCase())
        const matchSem = activeFilter === "All" || label === activeFilter
        return matchSearch && matchSem
    })

    return (
        <div className="min-h-screen bg-[#f6f5f4] px-6 py-12">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-black/90">Elective Courses</h1>
                        <p className="text-base text-[#a39e98] mt-1">Manage elective courses available for student recommendations.</p>
                    </div>
                    <button onClick={() => router.push("/admin/create")}
                        className="flex items-center gap-2 bg-[#0075de] hover:bg-[#005bab] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
                        <Plus size={15} />
                        Add Elective Course
                    </button>
                </div>

                {/* Table card */}
                <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">

                    {/* Search + filter bar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 border border-black/10 rounded-lg px-3 py-2 bg-[#fafafa] w-64">
                                <Search size={14} className="text-[#a39e98]" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, lecturer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent outline-none text-black/70 placeholder:text-[#c0bbb6] w-full text-sm"
                                />
                            </div>
                            <Filter size={14} className="text-[#a39e98]" />
                            <div className="flex items-center gap-1.5">
                                {semesterFilters.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeFilter === f
                                            ? "bg-[#0075de] text-white"
                                            : "bg-[#f0f0f0] text-[#615d59] hover:bg-[#e5e5e5]"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <span className="text-xs text-[#a39e98]">{filtered.length} of {courses.length} courses</span>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_180px_160px] px-5 py-2.5 border-b border-black/6 bg-[#fafafa]">
                        <span className="text-[11px] font-semibold text-[#a39e98] uppercase tracking-wider">Course</span>
                        <span className="text-[11px] font-semibold text-[#a39e98] uppercase tracking-wider">Offering</span>
                        <span className="text-[11px] font-semibold text-[#a39e98] uppercase tracking-wider">Credits &amp; Capacity</span>
                    </div>

                    {/* Scrollable list */}
                    <div className="overflow-y-auto max-h-115">

                        {/* Loading state */}
                        {loading && (
                            <div className="flex flex-col gap-3 p-5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-18 rounded-xl bg-[#f0f0f0] animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div className="py-16 text-center text-sm text-red-400">{error}</div>
                        )}

                        {/* Empty state */}
                        {!loading && !error && filtered.length === 0 && (
                            <div className="py-16 text-center text-sm text-[#a39e98]">No courses found.</div>
                        )}

                        {/* Course rows */}
                        {!loading && !error && filtered.map((course, idx) => {
                            const semLabel = semesterLabel[course.semester] ?? `Sem ${course.semester}`
                            return (
                                <div
                                    key={course.id + idx}
                                    className={`grid grid-cols-[1fr_180px_160px] px-5 py-4 hover:bg-[#fafafa] transition-colors ${idx !== filtered.length - 1 ? "border-b border-black/5" : ""}`}
                                >
                                    {/* Course info */}
                                    <div className="pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold bg-[#f0f0f0] text-[#615d59] px-1.5 py-0.5 rounded font-mono tracking-wide">
                                                {course.course_id}
                                            </span>
                                            <span className="text-sm font-semibold text-black/85 truncate">{course.course_name_en}</span>
                                        </div>
                                        <p className="text-xs text-[#a39e98] mb-2">{course.course_name_th}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {course.topics.map((tag) => (
                                                <span key={tag} className="text-[11px] text-[#0075de] bg-[#eaf4ff] px-2 py-0.5 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Offering */}
                                    <div className="flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center gap-1.5 text-xs text-[#a39e98]">
                                            <Calendar size={12} />
                                            <span>{course.academic_year}</span>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${semesterColor[semLabel] ?? "text-[#615d59] bg-[#f0f0f0]"}`}>
                                            {semLabel}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs text-[#a39e98]">
                                            <GraduationCap size={13} />
                                            <span className="truncate">{course.lecturer_name}</span>
                                        </div>
                                    </div>

                                    {/* Credits & Capacity */}
                                    <div className="flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center gap-1.5 text-xs text-[#615d59]">
                                            <BookOpen size={12} />
                                            <span>{course.credits} credits</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#615d59]">
                                            <Users size={12} />
                                            <span>{course.capacity} seats</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-black/6">
                        <span className="text-xs text-[#a39e98]">
                            {!loading && `${courses.length} elective courses registered`}
                        </span>
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-1.5 text-xs text-[#a39e98] hover:text-[#0075de] transition-colors"
                        >
                            <ArrowLeft size={12} />
                            Back to student view
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}