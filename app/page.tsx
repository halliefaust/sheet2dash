import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Generator</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Dynamic Dashboard</h2>
          <p className="text-xl text-gray-600 mb-8">
            Generate beautiful, real-time dashboards from your Google Sheets data with just a few clicks.
          </p>
          <Button asChild size="lg">
            <Link href="/create">Create Dashboard</Link>
          </Button>
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

