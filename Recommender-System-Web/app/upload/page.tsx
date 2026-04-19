"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud } from "lucide-react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"


export default function UploadTranscriptPage() {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const handleFile = (f: File) => {
        if (f.type !== "application/pdf") {
            alert("Only PDF allowed")
            return
        }

        if (f.size > 5 * 1024 * 1024) {
            alert("Max file size is 5MB")
            return
        }

        setFile(f)
    }

    const [loading, setLoading] = useState(false)

    const handleUpload = async () => {
        if (!file) return

        try {
            setLoading(true)

            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("http://127.0.0.1:8000/ocr/extract-data", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                throw new Error("Upload failed")
            }

            const data = await res.json()
            console.log("Upload success:", data)

            localStorage.setItem("student_id", data.student_id)

            // ✅ Transform raw_grades
            const mappedCourses = data.raw_grades.map((item: any) => {
                const [code, ...nameParts] = item.course_code.split(" ")

                return {
                    code,
                    name: nameParts.join(" "),
                    grade: item.grade_letter,
                }
            })

            // ✅ Save mapped courses
            localStorage.setItem("courses", JSON.stringify(mappedCourses))

            router.push("/grades")

            // 👉 go next page after success
            router.push("/grades")

        } catch (err) {
            console.error(err)
            alert("Upload failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
            <Card className="w-full max-w-150 rounded-2xl border border-black/10 shadow-sm">
                <CardContent className="p-8 space-y-10">

                    {/* Title */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-black/90">
                            Upload your transcript
                        </h1>
                        <p className="text-base text-[#615d59]">
                            Share your academic transcript so we can personalise <br />
                            your learning recommendations
                        </p>
                    </div>

                    {/* Upload Box */}
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault()
                            const dropped = e.dataTransfer.files[0]
                            if (dropped) handleFile(dropped)
                        }}
                        className="border border-dashed border-black/20 rounded-xl p-10 text-center cursor-pointer hover:bg-black/5 transition"
                    >
                        <div className="flex flex-col items-center gap-3">

                            <div className="p-3 bg-[#eaf4ff] rounded-lg">
                                <UploadCloud className="text-[#0075de]" size={24} />
                            </div>

                            <p className="text-base font-semibold text-black/80">
                                Drag & drop your PDF here
                            </p>

                            <p className="text-sm">
                                <span className="text-[#a39e98]">or{" "}</span>
                                <span className="text-[#0075de] font-semibold underline">
                                    browse to upload
                                </span>
                            </p>

                            <p className="text-sm text-[#a39e98]">
                                PDF only · Max 5 MB
                            </p>

                            {file && (
                                <p className="text-xs text-green-600 mt-2">
                                    ✅ {file.name}
                                </p>
                            )}
                        </div>

                        <input
                            ref={inputRef}
                            type="file"
                            hidden
                            accept="application/pdf"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleFile(f)
                            }}
                        />
                    </div>

                    <p className="text-sm text-center text-[#a39e98]">
                        Supported Only King Mongkut's University of Technology Thonburi transcript
                    </p>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="ghost"
                            onClick={() => router.push("/topics")}
                        >
                            ← Back
                        </Button>

                        <Button
                            disabled={!file || loading}
                            onClick={handleUpload}
                            className="bg-[#0075de] hover:bg-[#005bab]"
                        >
                            {loading ? "Uploading..." : "Submit →"}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}