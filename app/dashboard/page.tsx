"use client"

import { useSearchParams } from "next/navigation"

export default function Dashboard() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")

  if (!dataParam) {
    return <div>Error: No data provided</div>
  }

  const data = JSON.parse(decodeURIComponent(dataParam))

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <pre className="whitespace-pre-wrap break-words bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </main>
    </div>
  )
}
