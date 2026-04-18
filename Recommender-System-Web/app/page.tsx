"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const name = "Papangkorn"

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-2xl border border-black/10 shadow-sm">
        <CardContent className="p-10 flex flex-col items-center text-center space-y-6">

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-black/90">
              Hi, {name} 👋
            </h1>
            <p className="text-sm text-[#615d59]">
              Let’s personalize your learning experience
            </p>
          </div>

          {/* Continue Button */}
          <Button
            onClick={() => router.push("/topics")}
            className="w-full bg-[#0075de] hover:bg-[#005bab]"
          >
            Continue →
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}