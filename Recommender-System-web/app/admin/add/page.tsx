"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Sparkles, Monitor, Check, X, ChevronUp, ChevronDown } from "lucide-react"
import {
    Briefcase, Globe, Code, Users, Brain,
    Shield, Database, BarChart, Network, Cloud, Palette, Server,
} from "lucide-react"

const TOPIC_ICONS: Record<string, React.ReactNode> = {
    "Business & Management": <Briefcase size={12} />,
    "Web Development": <Globe size={12} />,
    "Professional Practice & Soft Skills": <Users size={12} />,
    "Data Science & AI": <Brain size={12} />,
    "Software Engineering": <Code size={12} />,
    "Cybersecurity": <Shield size={12} />,
    "Databases & Data Engineering": <Database size={12} />,
    "Mathematics & Statistics": <BarChart size={12} />,
    "Networking": <Network size={12} />,
    "DevOps & Architecture": <Cloud size={12} />,
    "UX/UI Design": <Palette size={12} />,
    "IT Fundamentals": <Server size={12} />,
}

const MAX_TOPICS = 3
const CURRENT_YEAR = 2569
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i).reverse()

export default function AdminCreatePage() {
    const router = useRouter()
    const [yearOpen, setYearOpen] = useState(false)
    const yearRef = useRef<HTMLDivElement>(null)

    // Topics fetch state
    const [availableTopics, setAvailableTopics] = useState<string[]>([])
    const [topicsLoading, setTopicsLoading] = useState(true)
    const [topicsError, setTopicsError] = useState<string | null>(null)

    const [form, setForm] = useState({
        course_id: "",
        credits: "",
        course_name_en: "",
        course_name_th: "",
        topics: [] as string[],
        description_en: "",
        description_th: "",
        academic_year: CURRENT_YEAR,
        capacity: 29,
        semester: 2,
        lecturer_name: "",
    })

    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Fetch topics from backend
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                setTopicsLoading(true)
                setTopicsError(null)

                const res = await fetch("http://127.0.0.1:8000/elective-courses/topics", {
                    method: "POST",
                })
                if (!res.ok) throw new Error(`Failed to fetch topics (${res.status})`)

                const data: { topics: string[] } = await res.json()
                setAvailableTopics(data.topics)
            } catch (err: any) {
                setTopicsError(err.message ?? "Something went wrong")
            } finally {
                setTopicsLoading(false)
            }
        }

        fetchTopics()
    }, [])

    // Close year dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
                setYearOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const set = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
    }

    const toggleTopic = (label: string) => {
        setForm((prev) => {
            const selected = prev.topics
            if (selected.includes(label)) {
                return { ...prev, topics: selected.filter((t) => t !== label) }
            }
            if (selected.length >= MAX_TOPICS) return prev
            return { ...prev, topics: [...selected, label] }
        })
    }

    const validate = () => {
        const e: Record<string, string> = {}
        if (!form.course_id.trim()) e.course_id = "Required"
        if (!form.course_name_en.trim()) e.course_name_en = "Required"
        if (!form.academic_year) e.academic_year = "Required"
        if (!form.semester) e.semester = "Required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async () => {
        if (!validate()) return
        try {
            setSaving(true)
            const payload = {
                course_id: form.course_id,
                course_name_th: form.course_name_th,
                course_name_en: form.course_name_en,
                is_elective: true,
                topics: form.topics,
                credits: form.credits,
                description_th: form.description_th,
                description_en: form.description_en,
                academic_year: form.academic_year,
                semester: form.semester,
                lecturer_name: form.lecturer_name,
                capacity: form.capacity,
            }
            const res = await fetch("http://127.0.0.1:8000/elective-courses/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to save")
            router.push("/admin")
        } catch (err) {
            console.error(err)
            alert("Failed to save course")
        } finally {
            setSaving(false)
        }
    }

    const inputClass = (key?: string) =>
        `w-full border rounded-md px-3 py-2.5 text-sm text-black/80 placeholder:text-[#c0bbb6] outline-none focus:border-[#0075de] transition-colors ${key && errors[key] ? "border-red-300 bg-red-50" : "border-black/10 bg-white"
        }`

    const atMax = form.topics.length >= MAX_TOPICS

    return (
        <div className="min-h-screen bg-[#f6f5f4] px-6 py-10">
            <div className="max-w-2xl mx-auto">

                {/* Page header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push("/admin")}
                        className="flex items-center gap-1.5 text-xs text-[#615d59] border border-black/10 bg-white rounded-lg px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors"
                    >
                        <ArrowLeft size={12} /> Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-black/90">Add New Elective Course</h1>
                        <p className="text-xs text-[#a39e98] mt-0.5">Fields marked with <span className="text-red-400">*</span> are required.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">

                    {/* ── Course Details ── */}
                    <Section icon={<BookOpen size={16} className="text-[#0075de]" />} title="Course Details" subtitle="Basic identification and classification of the elective.">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label text="Course ID" required />
                                <input className={inputClass("course_id")} placeholder="e.g. INT201" value={form.course_id} onChange={(e) => set("course_id", e.target.value)} />
                                {errors.course_id && <p className="text-xs text-red-400 mt-1">{errors.course_id}</p>}
                            </div>
                            <div>
                                <Label text="Credits" />
                                <input className={inputClass()} placeholder="e.g. 3(3-0-6)" value={form.credits} onChange={(e) => set("credits", e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <Label text="Course Name (English)" required />
                            <input className={inputClass("course_name_en")} placeholder="e.g. Introduction to Machine Learning" value={form.course_name_en} onChange={(e) => set("course_name_en", e.target.value)} />
                            {errors.course_name_en && <p className="text-xs text-red-400 mt-1">{errors.course_name_en}</p>}
                        </div>

                        <div>
                            <Label text="Course Name (Thai)" />
                            <input className={inputClass()} placeholder="e.g. การเรียนรู้ของเครื่อง" value={form.course_name_th} onChange={(e) => set("course_name_th", e.target.value)} />
                        </div>

                        {/* Topics */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label text="Topics" />
                                <span className={`text-xs font-medium ${atMax ? "text-[#0075de]" : "text-[#a39e98]"}`}>
                                    {form.topics.length} / {MAX_TOPICS} selected
                                </span>
                            </div>
                            <p className="text-xs text-[#a39e98] mb-2">Select up to {MAX_TOPICS} — helps match this course to student interests.</p>

                            {/* Loading */}
                            {topicsLoading && (
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-7 w-28 rounded-full bg-[#f0f0f0] animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
                                    ))}
                                </div>
                            )}

                            {/* Error */}
                            {!topicsLoading && topicsError && (
                                <p className="text-xs text-red-400">{topicsError}</p>
                            )}

                            {/* Topic pills */}
                            {!topicsLoading && !topicsError && (
                                <div className="flex flex-wrap gap-2">
                                    {availableTopics.map((label) => {
                                        const active = form.topics.includes(label)
                                        const disabled = !active && atMax
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => toggleTopic(label)}
                                                disabled={disabled}
                                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${active
                                                        ? "bg-[#0075de] text-white border-[#0075de]"
                                                        : disabled
                                                            ? "bg-[#f8f8f8] text-[#c0bbb6] border-black/5 cursor-not-allowed"
                                                            : "bg-white text-[#615d59] border-black/10 hover:border-[#0075de] hover:bg-[#eaf4ff] hover:text-[#0075de]"
                                                    }`}
                                            >
                                                <span>{TOPIC_ICONS[label] ?? <Server size={12} />}</span>
                                                {label}
                                                {active && <X size={11} strokeWidth={2.5} />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* ── Description ── */}
                    <Section icon={<Sparkles size={16} className="text-[#0075de]" />} title="Description" subtitle="Provide context to help students understand the course scope.">
                        <div>
                            <Label text="Description (English)" />
                            <textarea className={`${inputClass()} resize-none h-24`} placeholder="Describe the course content, objectives, and learning outcomes in English..." value={form.description_en} onChange={(e) => set("description_en", e.target.value)} />
                        </div>
                        <div>
                            <Label text="Description (Thai)" />
                            <textarea className={`${inputClass()} resize-none h-24`} placeholder="อธิบายเนื้อหา วัตถุประสงค์ และผลลัพธ์การเรียนรู้ภาษาไทย..." value={form.description_th} onChange={(e) => set("description_th", e.target.value)} />
                        </div>
                    </Section>

                    {/* ── Offering Details ── */}
                    <Section icon={<Monitor size={16} className="text-[#0075de]" />} title="Offering Details" subtitle="Specify when and how this course will be offered.">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Academic Year */}
                            <div>
                                <Label text="Academic Year" required />
                                <div className="relative" ref={yearRef}>
                                    <button
                                        type="button"
                                        onClick={() => setYearOpen((o) => !o)}
                                        className={`w-full flex items-center justify-between border rounded-md px-3 py-2.5 text-sm transition-colors outline-none ${yearOpen ? "border-[#0075de]" : "border-black/10"
                                            } bg-white text-black/80`}
                                    >
                                        <span>{form.academic_year}</span>
                                        {yearOpen
                                            ? <ChevronUp size={14} className="text-[#a39e98]" />
                                            : <ChevronDown size={14} className="text-[#a39e98]" />
                                        }
                                    </button>
                                    {yearOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-20 overflow-hidden">
                                            <div className="overflow-y-auto max-h-46.25">
                                                {YEARS.map((y) => (
                                                    <button
                                                        key={y}
                                                        type="button"
                                                        onClick={() => { set("academic_year", y); setYearOpen(false) }}
                                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[#f5f5f5] ${form.academic_year === y
                                                                ? "text-[#0075de] font-semibold bg-[#eaf4ff]"
                                                                : "text-black/70"
                                                            }`}
                                                    >
                                                        <span>{y}</span>
                                                        {form.academic_year === y && <Check size={14} className="text-[#0075de]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capacity */}
                            <div>
                                <Label text="Capacity (Max Seats)" />
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => set("capacity", Math.max(1, form.capacity - 1))} className="w-8 h-9 border border-black/10 rounded-lg text-[#615d59] hover:bg-[#eaf4ff] transition-colors text-lg leading-none shrink-0">−</button>
                                    <input
                                        type="number"
                                        className="border border-black/10 rounded-lg px-3 py-2 text-sm text-center w-16 outline-none focus:border-[#0075de] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={form.capacity}
                                        min={1}
                                        onChange={(e) => set("capacity", Number(e.target.value))}
                                    />
                                    <button type="button" onClick={() => set("capacity", form.capacity + 1)} className="w-8 h-9 border border-black/10 rounded-lg text-[#615d59] hover:bg-[#eaf4ff] transition-colors text-lg leading-none shrink-0">+</button>
                                    <span className="text-xs text-[#a39e98]">students max</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Semester */}
                            <div>
                                <Label text="Semester" required />
                                <div className="flex gap-2">
                                    {[{ label: "Semester 1", value: 1 }, { label: "Semester 2", value: 2 }, { label: "Summer", value: 3 }].map(({ label, value }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => set("semester", value)}
                                            className={`flex-1 text-xs py-2 rounded-md border font-medium transition-colors ${form.semester === value
                                                    ? "bg-[#0075de] text-white border-[#0075de]"
                                                    : "bg-white text-[#615d59] border-black/10 hover:border-[#0075de] hover:bg-[#eaf4ff] hover:text-[#0075de]"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lecturer */}
                            <div>
                                <Label text="Lecturer Name" />
                                <input className={inputClass()} placeholder="e.g. Assoc. Prof. Somchai Jaidee" value={form.lecturer_name} onChange={(e) => set("lecturer_name", e.target.value)} />
                            </div>
                        </div>
                    </Section>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 pb-6">
                        <p className="text-xs text-[#a39e98]">
                            {Object.keys(errors).length > 0 ? "All required fields must be filled." : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => router.push("/admin")} className="text-sm px-4 py-2 rounded-lg border border-black/10 bg-white text-[#615d59] hover:bg-[#f0f0f0] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white font-semibold transition-colors disabled:opacity-50">
                                <Check size={14} />
                                {saving ? "Saving..." : "Save Course"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function Section({ icon, title, subtitle, children }: {
    icon: React.ReactNode
    title: string
    subtitle: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ff] flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-bold text-black/90">{title}</p>
                    <p className="text-xs text-[#a39e98]">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    )
}

function Label({ text, required }: { text: string; required?: boolean }) {
    return (
        <p className="text-xs font-semibold text-black/70 mb-1.5">
            {text}{required && <span className="text-red-400 ml-0.5">*</span>}
        </p>
    )
}