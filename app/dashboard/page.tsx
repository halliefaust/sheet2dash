"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Responsive, WidthProvider } from "react-grid-layout"
import { useResizeDetector } from "react-resize-detector"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Pencil, RefreshCw, Send, X, Download } from "lucide-react"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { toast } from "@/components/ui/use-toast"

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const sheetUrl = searchParams.get("sheet_url")
  const userPrompt = searchParams.get("prompt")

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // Prevents hydration mismatch
  }, [])

  const [data, setChartData] = useState({
    charts: [], // Initialize with an empty string or some default value
  });

  if (!sheetUrl) {
    return <div>Error: No url provided</div>
  }

  const [showChat, setShowChat] = useState(false)
  const [prompt, setPrompt] = useState("")

  // Fetch data when the page loads
  useEffect(() => {
    const fetchData = async () => {
      if (!sheetUrl) {
        toast({
          title: "Error",
          description: "URL or prompt is missing in search parameters.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      console.log("Fetching data... ")
      try {
        const response = await fetch("http://127.0.0.1:5000/analyze-sheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sheet_url: sheetUrl, prompt: userPrompt }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }

        const result = await response.json()
        setChartData(result)
        toast({
          title: "Success",
          description: "Data successfully loaded.",
          variant: "default",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        })
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sheetUrl, userPrompt])

  const handleSync = async () => {
        // Implement sync functionality here
        console.log("Syncing data...")
      
        try {
          // Create a JSON object to send
          // TODO: clear the chart data
        const response = await fetch("http://127.0.0.1:5000/resync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ sheet_url: sheetUrl, data: data })
        });
        
      
          if (!response.ok) {
            throw new Error("Failed to resync data")
          }
      
          const result = await response.json()
      
          toast({
            title: "Success",
            description: "Data successfully resynced.",
            variant: "default",
          })
      
      // Update chart data
      setChartData(result)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to resync data. Please try again.",
            variant: "destructive",
          })
          console.error(error)
        }
      }
  
  const handleRegenerate = async () => {
    if (!sheetUrl) {
      toast({
        title: "Error",
        description: "Sheet URL is missing. Please provide a valid sheet URL.",
        variant: "destructive",
      });
      return;
    }

    console.log("Modifying data...")
    try {
      const response = await fetch("http://127.0.0.1:5000/analyze-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: sheetUrl, prompt: prompt }),
      })

      console.log("Received response!") // TODO: delete later

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const result = await response.json()
      setChartData(result);

      setShowChat(false)
      setPrompt("")
      toast({
        title: "Success",
        description: "Dashboard modified successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dashboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  
  const layouts = data.charts.map((chart, index) => ({
    i: index.toString(),
    x: (index * 2) % 6,
    y: Math.floor(index / 3) * 2,
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
  }))

  if (!mounted) {
    return <div>Loading...</div> // Prevents hydration mismatch
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">📊 Dashboard</h1>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </header>
      <main id="dashboard-content" className="flex-grow container mx-auto px-4 py-8">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layouts }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={150}
          draggableHandle=".drag-handle"
          isResizable={true}
        >
          {data.charts.map((chart, index) => (
            <div key={index} className="p-2">
              <Card className="shadow-lg h-full">
              <CardHeader className="flex items-center justify-between w-full">
                <div className="flex-grow flex justify-center">
                  <input
                    type="text"
                    value={chart.title}
                    onChange={(e) => {
                      const newCharts = [...data.charts];
                      newCharts[index].title = e.target.value;
                      setChartData({ ...data, charts: newCharts });
                    }}
                    className="text-lg font-semibold border-none focus:outline-none bg-transparent text-center w-[90%] max-w-full px-2 py-1"
                    style={{ minWidth: "500px" }} // Ensures a minimum width
                  />
                </div>
                <span className="drag-handle cursor-move text-gray-500">⋮⋮</span>
              </CardHeader>
                <CardContent className="flex justify-center items-center h-full">
                  <ResizableChart chart={chart} />
                </CardContent>
              </Card>
            </div>
          ))}
        </ResponsiveGridLayout>
      </main>
      <div className="fixed bottom-4 right-4 flex flex-col space-y-4">
        <Button
          onClick={() => setShowChat(true)}
          className="rounded-full w-12 h-12 p-0 overflow-hidden transition-all duration-300 ease-in-out hover:w-24 group relative"
        >
          <span className="absolute inset-0 flex items-center justify-center">
            <Pencil className="h-6 w-6 group-hover:opacity-0 transition-opacity duration-300" />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Modify</span>
        </Button>
        <Button
          onClick={handleSync}
          className="rounded-full w-12 h-12 p-0 overflow-hidden transition-all duration-300 ease-in-out hover:w-24 group relative"
        >
          <span className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 group-hover:opacity-0 transition-opacity duration-300" />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sync</span>
        </Button>
      </div>
      {showChat && (
        <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Modify Dashboard</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Enter your preferences for the modified dashboard:</p>
          </div>
          <div className="flex items-center">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., more bar charts, focus on sales data"
              className="flex-grow mr-2"
            />
            <Button onClick={handleRegenerate} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const COLOR_PALETTE = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57"]

function getColor(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length] // Cycles through colors
}

const handleDownloadPDF = async () => {
  const element = document.getElementById('dashboard-content')
  const canvas = await html2canvas(element)
  const data = canvas.toDataURL('image/png')

  const pdf = new jsPDF()
  const imgProperties = pdf.getImageProperties(data)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width

  pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('dashboard.pdf')
}

export function ResizableChart({ chart }) {
  const { width, height, ref } = useResizeDetector()

  const chartWidth = width ? width * 0.95 : 300  // Make it slightly smaller than container
  const chartHeight = height ? height * 0.95 : 250

  return (
    <div ref={ref} className="w-full h-full flex justify-center items-center pb-24 overflow-hidden">
      {chart.type === "line" && width && height && (
        <LineChart width={chartWidth} height={chartHeight} data={chart.data} margin={{ bottom: 24 }}>
          <XAxis dataKey={chart.xAxis} label={{ value: chart.xAxis, position: "bottom" }}  />
          <YAxis />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          {chart.series.map((s, i) => (
            <Line key={i} type="monotone" dataKey={s.key} stroke={getColor(i)} />
          ))}
        </LineChart>
      )}
      {chart.type === "bar" && width && height && (
        <BarChart width={chartWidth} height={chartHeight} data={chart.data} margin={{ bottom: 24 }}>
          <XAxis dataKey={chart.xAxis} label={{ value: chart.xAxis, position: "bottom" }} />
          <YAxis />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          {chart.series.map((s, i) => (
            <Bar key={i} dataKey={s.key} fill={getColor(i)} />
          ))}
        </BarChart>
      )}
      {chart.type === "pie" && width && height && (
        <PieChart width={chartWidth} height={chartHeight}>
          <Pie
            data={chart.data}
            dataKey={chart.series[0].key}
            nameKey={chart.xAxis}
            cx="50%"
            cy="50%"
            outerRadius={Math.min(chartWidth, chartHeight) / 3}
            fill="#8884d8"
          >
            {chart.data.map((_, i) => (
              <Cell key={i} fill={getColor(i)} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      )}
    </div>
  )
}
