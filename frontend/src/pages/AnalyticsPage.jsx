import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0,10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Try to dynamically import chartjs-plugin-datalabels if available
        try {
          const mod = await import('chartjs-plugin-datalabels');
          if (mod && mod.default) ChartJS.register(mod.default);
        } catch (err) {
          // plugin not installed; data labels will be disabled
          console.warn('chartjs-plugin-datalabels not available:', err.message);
        }

        const res = await analyticsAPI.getDashboard({ start: startDate, end: endDate });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      }
      setLoading(false);
    };
    load();
  }, [startDate, endDate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getDashboard({ start: startDate, end: endDate });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
    setLoading(false);
  };

  if (loading || !data) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const { stats, rooms } = data;

  const roomLabels = rooms.map(r => r.name || r.id || r.roomId);
  const occupancyData = rooms.map(r => r.occupancyPercent || 0);

  const barData = {
    labels: roomLabels,
    datasets: [
      {
        label: 'Occupancy %',
        data: occupancyData,
        backgroundColor: roomLabels.map((_, i) => `rgba(59,130,246,${0.6 - Math.min(i * 0.04, 0.3)})`),
        borderColor: roomLabels.map(() => 'rgba(59,130,246,0.9)'),
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(59,130,246,0.85)'
      }
    ]
  };

  // Peak hours data (ensure integer counts)
  const peakLabels = (stats.peakHours || []).map(p => p.hour);
  const peakCounts = (stats.peakHours || []).map(p => Number(p.bookings) || 0);

  const lineData = {
    labels: peakLabels,
    datasets: [
      {
        label: 'Bookings',
        data: peakCounts,
        borderColor: 'rgba(16,185,129,0.9)',
        backgroundColor: 'rgba(16,185,129,0.2)',
        pointBackgroundColor: 'rgba(16,185,129,0.9)',
        tension: 0.2,
        fill: true
      }
    ]
  };

  // Improved chart options for readability
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value) => `${value}%`,
        font: { weight: '600', size: 11 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}% occupied`
        }
      }
    },
    scales: {
      x: {
        ticks: { maxRotation: 40, minRotation: 20, autoSkip: false, font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10, callback: v => `${v}%` }
      }
    }
  };

  const maxPeak = Math.max(...peakCounts, 1);
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      datalabels: {
        align: 'top',
        formatter: (value) => `${value}`,
        font: { weight: '600', size: 11 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} bookings`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 } }
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxPeak,
        ticks: { stepSize: 1, precision: 0 }
      }
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Analytics Dashboard</h2>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-600">Start</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-2 p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm text-gray-600">End</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="ml-2 p-2 border rounded" />
        </div>
        <button onClick={refresh} className="ml-2 bg-blue-600 text-white px-3 py-2 rounded">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Bookings</div>
          <div className="text-2xl font-bold">{stats.totalBookings}</div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Active Bookings</div>
          <div className="text-2xl font-bold">{stats.activeBookings}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow" style={{ minHeight: 320 }}>
          <h3 className="font-medium mb-2">Room Utilization</h3>
          <div style={{ height: 260 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow" style={{ minHeight: 320 }}>
          <h3 className="font-medium mb-2">Peak Hours</h3>
          {peakCounts.length === 0 || peakCounts.every(c => c === 0) ? (
            <div className="p-6 text-center text-gray-500">No booking data for the selected period.</div>
          ) : (
            <div style={{ height: 260 }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">Peak hours shows the top booking hours (by booking creation time). It can be linked to either booking creation (`bookedAt`) or check-in time for more meaningful occupancy analysis.</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mt-6">
        <h3 className="font-medium mb-2">Most Popular Rooms</h3>
        {rooms && rooms.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Room</th>
                <th className="py-2">Occupancy</th>
                <th className="py-2">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {rooms
                .slice()
                .sort((a,b) => (b.occupiedSeats / b.totalSeats || 0) - (a.occupiedSeats / a.totalSeats || 0))
                .slice(0,5)
                .map((r) => (
                  <tr key={r.id || r.roomId} className="border-t">
                    <td className="py-2">{r.name || r.roomId}</td>
                    <td className="py-2">{Math.round((r.occupiedSeats / r.totalSeats) * 100) || 0}%</td>
                    <td className="py-2">{/* bookings unknown per-room in current model; show N/A */}N/A</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div>No data</div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
