"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Settings } from "lucide-react"

export default function AdminTooltip() {
    const router = useRouter()
    const [hovered, setHovered] = useState(false)

    return (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
            {/* Tooltip label */}
            {hovered && (
                <div className="bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                    Admin Panel
                </div>
            )}

            {/* Button */}
            <button
                onClick={() => router.push("/admin")}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="w-9 h-9 rounded-full bg-white border border-black/10 shadow-md flex items-center justify-center text-[#a39e98] hover:text-[#0075de] hover:border-[#0075de] transition-colors"
            >
                <Settings size={16} />
            </button>
        </div>
    )
}
