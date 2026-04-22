"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Sparkles, Monitor, Check } from "lucide-react"

const TOPICS = [
    { label: "Business & Management", icon: "💼" },
    { label: "Web Development", icon: "🌐" },
    { label: "Professional Practice & Soft Skills", icon: "🤝" },
    { label: "Data Science & AI", icon: "🧠" },
    { label: "Software Engineering", icon: "<>" },
    { label: "Cybersecurity", icon: "○" },
    { label: "Databases & Data Engineering", icon: "🗄" },
    { label: "Mathematics & Statistics", icon: "∑" },
    { label: "Networking", icon: "👥" },
    { label: "DevOps & Architecture", icon: "🏗" },
    { label: "UX/UI Design", icon: "✦" },
    { label: "IT Fundamentals", icon: "🖥" },
]

const CURRENT_YEAR = 2569
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i)

export default function AdminCreatePage() {
    const router = useRouter()

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

    const set = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
    }

    const toggleTopic = (label: string) => {
        setForm((prev) => ({
            ...prev,
            topics: prev.topics.includes(label)
                ? prev.topics.filter((t) => t !== label)
                : [...prev.topics, label],
        }))
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
            const res = await fetch("http://127.0.0.1:8000/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    is_elective: true,
                }),
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
        `w-full border rounded-lg px-3 py-2.5 text-sm text-black/80 placeholder:text-[#c0bbb6] outline-none focus:border-[#0075de] transition-colors ${
            key && errors[key] ? "border-red-300 bg-red-50" : "border-black/10 bg-white"
        }`

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
                                <input className={inputClass()} placeholder="e.g.3(3-0-6)" value={form.credits} onChange={(e) => set("credits", e.target.value)} />
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
                            <Label text="Topics" />
                            <p className="text-xs text-[#a39e98] mb-2">Select all that apply — helps match this course to student interests.</p>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map(({ label, icon }) => {
                                    const active = form.topics.includes(label)
                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => toggleTopic(label)}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                                active
                                                    ? "bg-[#0075de] text-white border-[#0075de]"
                                                    : "bg-white text-[#615d59] border-black/10 hover:border-[#0075de] hover:text-[#0075de]"
                                            }`}
                                        >
                                            <span>{icon}</span>
                                            {label}
                                            {active && <Check size={11} strokeWidth={2.5} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </Section>

                    {/* ── Description ── */}
                    <Section icon={<Sparkles size={16} className="text-[#0075de]" />} title="Description" subtitle="Provide context to help students understand the course scope.">

                        <div>
                            <Label text="Description (English)" />
                            <textarea
                                className={`${inputClass()} resize-none h-24`}
                                placeholder="Describe the course content, objectives, and learning outcomes in English..."
                                value={form.description_en}
                                onChange={(e) => set("description_en", e.target.value)}
                            />
                        </div>

                        <div>
                            <Label text="Description (Thai)" />
                            <textarea
                                className={`${inputClass()} resize-none h-24`}
                                placeholder="อธิบายเนื้อหา วัตถุประสงค์ และผลลัพธ์การเรียนรู้ภาษาไทย..."
                                value={form.description_th}
                                onChange={(e) => set("description_th", e.target.value)}
                            />
                        </div>
                    </Section>

                    {/* ── Offering Details ── */}
                    <Section icon={<Monitor size={16} className="text-[#0075de]" />} title="Offering Details" subtitle="Specify when and how this course will be offered.">

                        <div className="grid grid-cols-2 gap-3">
                            {/* Academic Year */}
                            <div>
                                <Label text="Academic Year" required />
                                <select
                                    className={inputClass("academic_year")}
                                    value={form.academic_year}
                                    onChange={(e) => set("academic_year", Number(e.target.value))}
                                >
                                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            {/* Capacity */}
                            <div>
                                <Label text="Capacity (Max Seats)" />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => set("capacity", Math.max(1, form.capacity - 1))}
                                        className="w-8 h-9 border border-black/10 rounded-lg text-[#615d59] hover:bg-[#f0f0f0] transition-colors text-lg leading-none"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        className="border border-black/10 rounded-lg px-3 py-2 text-sm text-center w-16 outline-none focus:border-[#0075de]"
                                        value={form.capacity}
                                        min={1}
                                        onChange={(e) => set("capacity", Number(e.target.value))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => set("capacity", form.capacity + 1)}
                                        className="w-8 h-9 border border-black/10 rounded-lg text-[#615d59] hover:bg-[#f0f0f0] transition-colors text-lg leading-none"
                                    >
                                        +
                                    </button>
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
                                            className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-colors ${
                                                form.semester === value
                                                    ? "bg-[#0075de] text-white border-[#0075de]"
                                                    : "bg-white text-[#615d59] border-black/10 hover:border-[#0075de]"
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
                                <input
                                    className={inputClass()}
                                    placeholder="e.g. Assoc. Prof. Somchai Jaidee"
                                    value={form.lecturer_name}
                                    onChange={(e) => set("lecturer_name", e.target.value)}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between pt-1 pb-6">
                        <p className="text-xs text-[#a39e98]">
                            {Object.keys(errors).length > 0 ? "All required fields must be filled." : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push("/admin")}
                                className="text-sm px-4 py-2 rounded-lg border border-black/10 bg-white text-[#615d59] hover:bg-[#f0f0f0] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white font-semibold transition-colors disabled:opacity-50"
                            >
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
