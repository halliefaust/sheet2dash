"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function CreateDashboard() {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: sheetUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const result = await response.json()

      // Pass the received data to the dashboard page
      router.push(`/dashboard?data=${encodeURIComponent(JSON.stringify(result))}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dashboard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

