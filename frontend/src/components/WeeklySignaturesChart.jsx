// WeeklySignaturesChart.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from 'recharts'

function WeeklySignaturesChart() {
  const [weeklyData, setWeeklyData] = useState([])

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const { data, error } = await supabase.rpc("get_weekly_signature_counts")
      if (error) {
        console.error("Weekly chart error:", error)
      } else {
        const formatted = data.map(entry => ({
          week: entry.week_start,           // Rename if needed
          count: entry.signature_count      // Rename if needed
        }))
        setWeeklyData(formatted)
      }
    }

    fetchWeeklyData()
  }, [])

  return (
    <div className="card shadow p-4 rounded bg-white">
      <h2 className="text-xl font-semibold mb-4">📈 Weekly Signature Submissions</h2>

      {weeklyData.length === 0 ? (
        <p className="text-gray-500">No signature data available yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default WeeklySignaturesChart