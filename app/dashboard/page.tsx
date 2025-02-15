"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Responsive, WidthProvider } from "react-grid-layout"
import { useResizeDetector } from "react-resize-detector"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function Dashboard() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // Prevents hydration mismatch
  }, [])

  const handleSync = () => {
    // Implement sync functionality here
    console.log("Syncing data...")
  }

  if (!dataParam) {
    return <div>Error: No data provided</div>
  }

  const data = JSON.parse(decodeURIComponent(dataParam))

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
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">📊 Dashboard</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
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
                <CardHeader className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{chart.title}</span>
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
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={handleSync} 
          className="rounded-full w-12 h-12 p-0 overflow-hidden transition-all duration-300 ease-in-out hover:w-24 group"
        >
          <span className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 group-hover:opacity-0 transition-opacity duration-300" />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Sync
          </span>
        </Button>
      </div>
    </div>
  )
}

const COLOR_PALETTE = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57"]

function getColor(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length] // Cycles through colors
}

export function ResizableChart({ chart }) {
  const { width, height, ref } = useResizeDetector()

  const chartWidth = width ? width * 0.95 : 300  // Make it slightly smaller than container
  const chartHeight = height ? height * 0.95 : 250

  return (
    <div ref={ref} className="w-full h-full flex justify-center items-center pb-24 overflow-hidden">
      {chart.type === "line" && width && height && (
        <LineChart width={chartWidth} height={chartHeight} data={chart.data}>
          <XAxis dataKey={chart.xAxis} />
          <YAxis />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          {chart.series.map((s, i) => (
            <Line key={i} type="monotone" dataKey={s.key} stroke={getColor(i)} />
          ))}
        </LineChart>
      )}
      {chart.type === "bar" && width && height && (
        <BarChart width={chartWidth} height={chartHeight} data={chart.data}>
          <XAxis dataKey={chart.xAxis} />
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
