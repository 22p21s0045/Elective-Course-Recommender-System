"use client"

import { X, Check } from "lucide-react"
import { useEffect, useState } from "react"

interface FilePreviewCardProps {
    file: File
    onRemove: () => void
    onComplete: () => void
}

export default function FilePreviewCard({ file, onRemove, onComplete }: FilePreviewCardProps) {
    const [loadedBytes, setLoadedBytes] = useState(0)
    const [complete, setComplete] = useState(false)

    const fileSizeMB = file.size / (1024 * 1024)
    const loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2)
    const progressPct = file.size > 0 ? Math.min((loadedBytes / file.size) * 100, 100) : 0

    useEffect(() => {
        setLoadedBytes(0)
        setComplete(false)

        // Use FileReader to track real local read progress
        const reader = new FileReader()

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                setLoadedBytes(e.loaded)
            }
        }

        reader.onload = () => {
            setLoadedBytes(file.size) // ensure full
            setTimeout(() => {
                setComplete(true)
                onComplete()
            }, 200)
        }

        reader.onerror = () => {
            console.error("Failed to read file")
        }

        reader.readAsArrayBuffer(file)

        return () => reader.abort()
    }, [file])

    return (
        <div className="border border-black/10 rounded-xl p-4">
            {/* File row */}
            <div className="flex items-center gap-3 mb-3">
                {/* PDF Icon */}
                <div className="relative w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                        width="22" height="22" viewBox="0 0 24 24"
                        fill="none" stroke="#ef4444"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[6px] font-bold text-red-500 tracking-tight">
                        PDF
                    </span>
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">
                        {file.name.replace(/\.pdf$/i, "")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{fileSizeMB.toFixed(2)} MB</p>
                </div>

                {/* Remove button */}
                <button
                    onClick={onRemove}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                    <X size={12} className="text-gray-500" />
                </button>
            </div>

            {/* Progress — visible while reading, hidden once complete */}
            {!complete && (
                <>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>File size</span>
                        <span className="text-[#0075de] font-semibold">
                            {loadedMB} MB / {fileSizeMB.toFixed(2)} MB
                        </span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#0075de] rounded-full transition-all duration-100"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </>
            )}

            {/* Completed */}
            {complete && (
                <div className="flex items-center gap-1.5 mt-1 text-green-500 text-sm font-medium">
                    <Check size={14} strokeWidth={2.5} />
                    Completed
                </div>
            )}
        </div>
    )
}