import React, { useState, useEffect } from 'react';
import { Activity, Zap, AlertOctagon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  const [data, setData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let interval;
    if (isSimulating) {
        interval = setInterval(async () => {
            const timeStr = new Date().toLocaleTimeString();
            try {
                // Fire multiple requests to trigger rate limit quickly
                const promises = Array(5).fill().map(() => fetch('http://localhost:3000/api/data'));
                const responses = await Promise.all(promises);
                
                let allowed = 0;
                let dropped = 0;
                
                responses.forEach(r => {
                    if (r.status === 200) allowed += 1;
                    if (r.status === 429) dropped += 1;
                });

                setData(prev => {
                    const newData = [...prev, { time: timeStr, allowed, dropped }];
                    if (newData.length > 20) newData.shift();
                    return newData;
                });
            } catch (e) {
                console.error(e);
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Activity className="text-blue-500 w-8 h-8"/>
        Distributed Rate Limiter Visualizer
      </h1>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-300">Algorithm</h2>
            <p className="text-2xl font-mono text-emerald-400">Sliding Window Log</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-300">Max Capacity</h2>
            <p className="text-2xl font-mono text-blue-400">10 Req / 10 Sec</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col justify-center">
            <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`py-3 px-6 rounded font-bold flex items-center justify-center gap-2 ${isSimulating ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
                {isSimulating ? <AlertOctagon /> : <Zap />}
                {isSimulating ? "Stop Traffic Flood" : "Trigger Traffic Flood"}
            </button>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 h-[400px]">
        <h2 className="text-xl font-bold mb-6 text-slate-200">Real-Time Traffic Analysis</h2>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="allowed" stroke="#10b981" strokeWidth={3} name="Allowed (HTTP 200)" />
                <Line type="monotone" dataKey="dropped" stroke="#ef4444" strokeWidth={3} name="Dropped (HTTP 429)" />
            </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
