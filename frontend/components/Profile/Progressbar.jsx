"use client";
import React, { useEffect, useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Award, BookOpen, Clock, Target, CheckCircle, XCircle, Building, Layers, Activity, Filter, Calendar, Sparkles 
} from "lucide-react";
import { getCookie } from "cookies-next";
import { getRequest } from "@/config/axiosInterceptor";
import { profileProgressApi } from "@/components/Constants/apiEndpoints";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl space-y-1.5 text-[11px]">
        {data.quizName && <p className="font-bold text-white text-xs border-b border-slate-800 pb-1 mb-1">{data.quizName}</p>}
        {data.topic && <p className="text-slate-350"><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Topic:</span> {data.topic}</p>}
        {data.date && <p className="text-slate-355"><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Date:</span> {data.date}</p>}
        {data.score !== undefined && <p className="text-blue-400 font-mono"><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Score:</span> {Number(data.score).toFixed(1)}%</p>}
        {data.accuracy !== undefined && <p className="text-emerald-400 font-mono"><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Accuracy:</span> {Number(data.accuracy).toFixed(1)}%</p>}
        {data.timeTaken !== undefined && <p className="text-amber-500 font-mono"><span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Time Spent:</span> {data.timeTaken}s</p>}
      </div>
    );
  }
  return null;
};

const Progressbar = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [dateRange, setDateRange] = useState("All Time");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);

  const fetchProgressReport = async () => {
    try {
      setLoading(true);
      const token = getCookie("token");
      const org = getCookie("org");

      let query = `?dateRange=${encodeURIComponent(dateRange)}`;
      if (org) query += `&org_id=${org}`;
      if (topic) query += `&topic=${encodeURIComponent(topic)}`;
      if (difficulty) query += `&difficulty=${difficulty}`;

      const response = await getRequest({
        url: `${profileProgressApi}${query}`,
        token
      });

      if (response.data?.status) {
        setData(response.data.data);
        
        // Populate unique topics from scoreProgress list dynamically
        if (response.data.data.scoreProgress) {
          const topics = Array.from(new Set(response.data.data.scoreProgress.map(x => x.topic).filter(Boolean)));
          setAvailableTopics(topics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch progress report analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressReport();
  }, [dateRange, topic, difficulty]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl h-[280px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 text-slate-200">
      
      {/* Interactive Filter Row */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
          <Filter size={14} className="text-blue-500" /> FILTERS:
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
        >
          <option value="All Time">All Time</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last 90 Days">Last 90 Days</option>
        </select>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
        >
          <option value="">All Topics</option>
          {availableTopics.map((t, idx) => (
            <option key={idx} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Metrics Scorecards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/60 text-blue-450 rounded-xl shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Attempted</span>
            <p className="text-base font-black text-white">{data.totalAttempted}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/60 text-emerald-450 rounded-xl shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Passed</span>
            <p className="text-base font-black text-emerald-400">{data.passedCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-rose-955/60 text-rose-450 rounded-xl shrink-0">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Failed</span>
            <p className="text-base font-black text-rose-500">{data.failedCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/60 text-purple-400 rounded-xl shrink-0">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Avg Score</span>
            <p className="text-base font-black text-purple-300 font-mono">{Number(data.avgScore).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-amber-955/60 text-amber-500 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Peak Score</span>
            <p className="text-base font-black text-amber-400 font-mono">{Number(data.highestScore).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 text-slate-400 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Lowest Score</span>
            <p className="text-base font-black text-slate-350 font-mono">{Number(data.lowestScore).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/60 text-cyan-400 rounded-xl shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Time Spent</span>
            <p className="text-xs font-black text-cyan-300 truncate max-w-[100px]">
              {data.totalTime > 0 ? `${Math.floor(data.totalTime / 60)}m ${Math.floor(data.totalTime % 60)}s` : "—"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/60 text-indigo-400 rounded-xl shrink-0">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Current Rank</span>
            <p className="text-base font-black text-indigo-300 font-mono">#{data.currentRank}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-teal-950/60 text-teal-400 rounded-xl shrink-0">
            <Building size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Org</span>
            <p className="text-xs font-black text-teal-300 truncate max-w-[100px]">{data.organization}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 text-slate-400 rounded-xl shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Channel</span>
            <p className="text-xs font-black text-slate-350 truncate max-w-[100px]">{data.channel}</p>
          </div>
        </div>

      </div>

      {data.totalAttempted > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Score Progress (Line Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="text-blue-500" size={14} /> Score Progress
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Topic Performance (Vertical Bar Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="text-purple-400" size={14} /> Topic Performance
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topicPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="topic" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="avgScore" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Difficulty Performance (Grouped Bar Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="text-amber-500" size={14} /> Difficulty Diagnostics
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.difficultyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="difficulty" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Legend fontSize={9} />
                  <Bar dataKey="avgScore" name="Avg Score %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attempts" name="Attempts Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Weekly Activity (Area Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="text-teal-400" size={14} /> Daily Activity (Last 30 Days)
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Area type="monotone" dataKey="count" name="Quizzes Attempted" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Accuracy Trend (Line Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="text-emerald-400" size={14} /> Accuracy Trend
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Time Analysis (Bar Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="text-cyan-400" size={14} /> Average Time Taken
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={8} tick={false} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgTime" name="Time Taken (seconds)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl py-20 text-center text-slate-500 text-sm">
          <Sparkles className="mx-auto mb-3 text-slate-650 animate-bounce" size={32} />
          No assessment history found matching these filters. Complete an assessment to unlock these graph performance analytics!
        </div>
      )}

    </div>
  );
};

export default Progressbar;
