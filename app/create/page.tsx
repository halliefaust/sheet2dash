"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function CreateDashboard() {
  const [sheetUrl, setSheetUrl] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Redirect to the dashboard page with the sheet URL and prompt as query parameters
    router.push(`/dashboard?sheet_url=${encodeURIComponent(sheetUrl)}&prompt=${encodeURIComponent(prompt)}`);
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Create New Dashboard</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sheet-url">Google Sheet URL</Label>
              <Input
                id="sheet-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="prompt">Dashboard Preferences (Optional)</Label>
              <Textarea
                id="prompt"
                placeholder="Enter any specific requirements for your dashboard (e.g., types of charts, color schemes, etc.)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Dashboard"}
            </Button>
          </form>
        </div>
      </main>
      <footer className="bg-gray-100">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600">
          © 2023 Dashboard Generator. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

