"use client";
import React, { useEffect, useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Award, TrendingUp, Compass, Target, HelpCircle, Layers, Calendar, ChevronRight, Filter, BookOpen, AlertCircle, ShieldCheck, Zap
} from "lucide-react";
import { getCookie } from "cookies-next";
import { getRequest } from "@/config/axiosInterceptor";
import { profileLeaderboardAnalyticsApi } from "@/components/Constants/apiEndpoints";

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

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const LeadInfo = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [dateRange, setDateRange] = useState("All Time");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);

  const fetchLeaderboardAnalytics = async () => {
    try {
      setLoading(true);
      const token = getCookie("token");
      const org = getCookie("org");

      let query = `?dateRange=${encodeURIComponent(dateRange)}`;
      if (org) query += `&org_id=${org}`;
      if (topic) query += `&topic=${encodeURIComponent(topic)}`;
      if (difficulty) query += `&difficulty=${difficulty}`;

      const response = await getRequest({
        url: `${profileLeaderboardAnalyticsApi}${query}`,
        token
      });

      if (response.data?.status) {
        setData(response.data.data);
        if (response.data.data.rankHistory) {
          const topics = Array.from(new Set(response.data.data.rankHistory.map(x => x.topic).filter(Boolean)));
          setAvailableTopics(topics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardAnalytics();
  }, [dateRange, topic, difficulty]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
      
      {/* Filters row */}
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

      {/* Metrics Scorecards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-955/60 text-amber-500 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Current Rank</span>
            <p className="text-base font-black text-white">#{data.currentRank}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/60 text-blue-450 rounded-xl shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Percentile</span>
            <p className="text-base font-black text-blue-400 font-mono">{Number(data.overallPercentile).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/60 text-emerald-450 rounded-xl shrink-0">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Total Score</span>
            <p className="text-base font-black text-emerald-400 font-mono">{Number(data.totalScore).toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/60 text-purple-400 rounded-xl shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Total Points</span>
            <p className="text-base font-black text-purple-300 font-mono">{Number(data.totalPoints).toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-cyan-950/60 text-cyan-400 rounded-xl shrink-0">
            <Compass size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Org Rank</span>
            <p className="text-base font-black text-cyan-300">#{data.orgRank}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-teal-950/60 text-teal-400 rounded-xl shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Channel Rank</span>
            <p className="text-base font-black text-teal-300">#{data.channelRank}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 text-slate-400 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Topic Rank</span>
            <p className="text-base font-black text-white">#{data.topicRank}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-amber-955/60 text-amber-500 rounded-xl shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Best Topic</span>
            <p className="text-xs font-black text-amber-400 truncate max-w-[100px]">{data.bestTopic}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-slate-950 text-slate-450 rounded-xl shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Weakest Topic</span>
            <p className="text-xs font-black text-slate-400 truncate max-w-[100px]">{data.weakestTopic}</p>
          </div>
        </div>

      </div>

      {data.rankHistory?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Rank History (Line Graph) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="text-amber-500" size={14} /> Rank Standing History
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.rankHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rankScore" name="Standing Points" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Topic Comparison (Horizontal Bar Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Compass className="text-blue-500" size={14} /> Topic Standings Comparison
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topicComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={9} domain={[0, 100]} />
                  <YAxis dataKey="topic" type="category" stroke="#64748b" fontSize={9} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="avgScore" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Score Distribution (Pie Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg flex flex-col justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="text-emerald-400" size={14} /> Score Distribution Categories
            </h4>
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.scoreDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-[10px] text-slate-400">
              {data.scoreDistribution.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Performance Radar (Radar Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="text-purple-400" size={14} /> Radar Performance Map
            </h4>
            <div className="h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.performanceRadar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                  <Radar name="Performance" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Streak Activity (Area Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="text-teal-400" size={14} /> Activity Activity Index (Last 30 Days)
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.streakGraph}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Area type="monotone" dataKey="count" name="Submissions" stroke="#0d9488" fill="#0d9488" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Monthly Performance (Area Chart) */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={14} /> Monthly Performance Trends
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Area type="monotone" dataKey="avgScore" name="Avg Score %" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7. Quiz Completion Timeline */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4 shadow-lg col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="text-cyan-400" size={14} /> Quiz Completion Timeline
            </h4>
            <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3.5 custom-scrollbar">
              {data.quizTimeline?.map((item, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {/* Timeline bar */}
                  {idx !== data.quizTimeline.length - 1 && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-slate-800" />
                  )}
                  
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.result === "Passed" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900" : "bg-rose-955/60 text-rose-500 border border-rose-900"
                  }`}>
                    {item.result === "Passed" ? "P" : "F"}
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex-1 flex flex-wrap justify-between items-center gap-4 hover:border-slate-700 transition">
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs leading-none">{item.assessmentName}</h5>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">{item.topic} • {item.completedTime}</span>
                    </div>

                    <div className="flex gap-6 text-center text-[10px]">
                      <div>
                        <span className="text-slate-500 block font-bold uppercase text-[8px]">Score</span>
                        <span className="font-mono font-bold text-white mt-0.5 block">{Number(item.score).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold uppercase text-[8px]">Accuracy</span>
                        <span className="font-mono font-bold text-emerald-400 mt-0.5 block">{Number(item.accuracy).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold uppercase text-[8px]">Time</span>
                        <span className="font-mono font-bold text-cyan-400 mt-0.5 block">{item.timeTaken}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl py-20 text-center text-slate-500 text-sm">
          <BookOpen className="mx-auto mb-3 text-slate-650 animate-bounce" size={32} />
          No leaderboard history found matching these filters. Submit your first assessment to unlock detailed standing history!
        </div>
      )}

    </div>
  );
};

export default LeadInfo;
