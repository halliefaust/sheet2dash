import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, BarChart3, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Dashify</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            
            <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent sm:text-5xl">
              Turn your spreadsheets into beautiful dashboards in seconds
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Connect your Google Sheets and create stunning, interactive dashboards without writing a single line of code.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild>
                <Link href="/create" className="flex items-center gap-2">
                  Create Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center">
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Beautiful Charts</h3>
                <p className="text-muted-foreground text-sm">Create stunning visualizations with our pre-built chart library</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
                <p className="text-muted-foreground text-sm">Your dashboards stay in sync with your spreadsheet data</p>
              </div>
              <div className="flex flex-col items-center">
                <Sparkles className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">No-code Builder</h3>
                <p className="text-muted-foreground text-sm">Design professional dashboards with our intuitive builder</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}