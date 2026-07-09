import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from "recharts";
import {
  X, Award, CheckCircle, Clock, Percent, ShieldCheck, Target,
  BookOpen, TrendingUp, Calendar, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, Award as Ribbon, GraduationCap
} from "lucide-react";

// Local cache to store analytics data per userId to prevent repeated fetches
const analyticsCache = {};

const UserAnalyticsPanel = ({ userId, onClose, orgId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Pagination & Sorting States for Assessment History
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  const [sortField, setSortField] = useState("dateAttempted");
  const [sortDirection, setSortDirection] = useState("desc");

  const panelRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Accessibility: ESC key keydown handler
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const fetchUserAnalytics = async () => {
    // Return cached data immediately if exists
    if (analyticsCache[userId]) {
      setData(analyticsCache[userId]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getRequest({
        url: `/leaderboard/analytics/user/${userId}`,
        params: `?org_id=${orgId}`,
        token: getCookie("token")
      });
      if (response.data?.status) {
        analyticsCache[userId] = response.data.data;
        setData(response.data.data);
      } else {
        toast.error("Failed to load analytics data.");
      }
    } catch (error) {
      toast.error("Error fetching analytics data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserAnalytics();
    }
  }, [userId]);

  // Click outside drawer handler
  const handleBackdropClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Render loading skeleton
  if (isLoading) {
    if (!mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-[2px]">
        <div className="w-full sm:w-[50%] lg:w-[38%] xl:w-[35%] h-screen bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col gap-6 animate-pulse">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-slate-800 rounded-xl" />
            <div className="h-16 bg-slate-800 rounded-xl" />
            <div className="h-16 bg-slate-800 rounded-xl" />
            <div className="h-16 bg-slate-800 rounded-xl" />
          </div>
          <div className="h-[200px] bg-slate-800 rounded-xl" />
          <div className="h-[150px] bg-slate-850 rounded-xl" />
        </div>
      </div>,
      document.body
    );
  }

  if (!data) {
    if (!mounted) return null;
    return createPortal(
      <div 
        className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div ref={panelRef} className="w-full sm:w-[50%] lg:w-[38%] xl:w-[35%] h-screen bg-slate-950 border-l border-slate-800 shadow-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-rose-950/50 rounded-full flex items-center justify-center text-rose-500 mb-2">
            <X size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-200">Unable to Load Profile</h3>
          <p className="text-sm text-slate-400 max-w-xs">There was an error retrieving the analytics data for this user. Please try again later.</p>
          <button 
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const { userInfo, summary, history } = data;

  // Chart Data Calculations
  const scoreTrendData = [...history].reverse().map((h, index) => ({
    name: `Q${index + 1}`,
    score: h.scoreObtained ?? 0,
    total: h.totalMarks ?? 10,
    percentage: parseFloat(Number(h.percentage ?? 0).toFixed(1))
  }));

  // Topic comparisons
  const topicDataMap = {};
  history.forEach(h => {
    const tName = h.topic || h.subject || "General";
    if (!topicDataMap[tName]) {
      topicDataMap[tName] = { topic: tName, totalScore: 0, count: 0 };
    }
    topicDataMap[tName].totalScore += h.scoreObtained ?? 0;
    topicDataMap[tName].count += 1;
  });
  const topicChartData = Object.values(topicDataMap).map(t => ({
    subject: t.topic,
    A: parseFloat(Number((t.totalScore / (t.count || 1)) ?? 0).toFixed(1)),
    fullMark: 100
  })).slice(0, 7);

  // Dynamic Topic Analytics Calculations
  const computedTopicAnalytics = (() => {
    const map = {};
    history.forEach(h => {
      const t = h.topic || h.subject || "General";
      if (!map[t]) {
        map[t] = { topic: t, attempts: 0, totalScore: 0, maxScore: 0, correct: 0, totalQuestions: 0 };
      }
      map[t].attempts += 1;
      map[t].totalScore += h.scoreObtained ?? 0;
      map[t].maxScore = Math.max(map[t].maxScore, h.scoreObtained ?? 0);
      map[t].correct += h.correct ?? 0;
      map[t].totalQuestions += h.totalMarks ?? 10;
    });
    return Object.values(map).map(item => {
      const avgScore = item.attempts > 0 ? (item.totalScore / item.attempts) : 0;
      const accuracy = item.totalQuestions > 0 ? (item.correct / item.totalQuestions) * 100 : 0;
      return {
        topic: item.topic,
        attempts: item.attempts,
        avgScore: avgScore,
        highestScore: item.maxScore,
        accuracy: accuracy,
        strength: accuracy >= 75 ? "Strong" : accuracy >= 50 ? "Moderate" : "Needs Practice"
      };
    });
  })();

  // Sorting & Filtration of Assessment History
  const filteredHistory = history.filter(h => {
    const search = historySearch.toLowerCase();
    const nameMatch = (h.assessmentName || "").toLowerCase().includes(search);
    const topicMatch = (h.topic || h.subject || "General").toLowerCase().includes(search);
    return nameMatch || topicMatch;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Fallbacks
    if (sortField === "topic") {
      valA = a.topic || a.subject || "General";
      valB = b.topic || b.subject || "General";
    }

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === "string") {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
  });

  // Pagination bounds
  const pageSize = 5;
  const totalPages = Math.ceil(sortedHistory.length / pageSize) || 1;
  const paginatedHistory = sortedHistory.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="inline ml-1 text-slate-500" />;
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="inline ml-1 text-blue-400" />
      : <ArrowDown size={12} className="inline ml-1 text-blue-400" />;
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="User Detailed Analytics Panel"
    >
      <motion.div
        ref={panelRef}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="w-full sm:w-[50%] lg:w-[38%] xl:w-[35%] h-screen bg-slate-950 text-slate-100 flex flex-col shadow-2xl relative border-l border-slate-800"
      >
        
        {/* Sticky Drawer Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 sticky top-0 z-[101]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
              {userInfo.image ? (
                <img src={userInfo.image} alt={userInfo.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-white text-md uppercase">{userInfo.name ? userInfo.name[0] : "U"}</span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-snug flex items-center gap-1.5">
                {userInfo.name || userInfo.username}
                <span className="text-[10px] text-slate-400 font-normal">({userInfo.username})</span>
              </h2>
              <p className="text-[10px] text-slate-450 mt-0.5">
                Rank: <strong className="text-blue-400">#{summary.currentRank || "—"}</strong> | Level: <strong className="text-purple-400">{summary.performanceLevel || "Bronze"}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-450 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close analytics drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">

          {/* Section: Overview Metrics Cards */}
          <div>
            <h3 className="text-[10px] font-bold tracking-wider text-slate-450 uppercase mb-3 flex items-center gap-1.5">
              <Ribbon size={12} className="text-blue-400" /> Assessment Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Total Attempts</span>
                <p className="text-lg font-black text-white mt-0.5">{summary.completedAttempts ?? 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Avg Accuracy</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">{Number(summary.avgAccuracy ?? 0).toFixed(1)}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                <span className="text-slate-500 text-[9px] uppercase font-bold">High / Low Score</span>
                <p className="text-lg font-black text-white mt-0.5">{summary.highestScore ?? 0} / {summary.lowestScore ?? 0}</p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Streak Index</span>
                <p className="text-lg font-black text-orange-400 mt-0.5">{userInfo.currentStreak ?? 0}d / {userInfo.longestStreak ?? 0}d</p>
              </div>
            </div>
          </div>

          {/* Section: Charts Visualizations */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-450 uppercase flex items-center gap-1.5">
              <TrendingUp size={12} className="text-blue-400" /> Performance Metrics
            </h3>

            {/* Score Trend Area Chart */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 mb-3">Score Trend Chart</h4>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrendData}>
                    <defs>
                      <linearGradient id="drawerScoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#fff", fontSize: 10 }} />
                    <Area type="monotone" dataKey="percentage" name="Score %" stroke="#3b82f6" fillOpacity={1} fill="url(#drawerScoreColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Comparison Radar Chart */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 mb-3">Topic Strengths Chart</h4>
              <div className="h-[180px] w-full flex justify-center items-center">
                {topicChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicChartData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={8} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                      <Radar name={userInfo.name} dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[10px] text-slate-500">Not enough data to calculate topic comparisons.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Topic Analytics Grid */}
          <div>
            <h3 className="text-[10px] font-bold tracking-wider text-slate-450 uppercase mb-3 flex items-center gap-1.5">
              <BookOpen size={12} className="text-blue-400" /> Topic Analytics
            </h3>
            <div className="space-y-2">
              {computedTopicAnalytics.map((item, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white">{item.topic}</h4>
                    <span className="text-[10px] text-slate-450 mt-0.5 block">Attempts: {item.attempts} | Accuracy: {Number(item.accuracy).toFixed(0)}%</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      item.strength === "Strong" ? "bg-green-950/60 text-green-400 border-green-900" :
                      item.strength === "Moderate" ? "bg-blue-950/60 text-blue-400 border-blue-900" :
                      "bg-rose-950/60 text-rose-400 border-rose-900"
                    }`}>
                      {item.strength}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Avg Score: {Number(item.avgScore).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Assessment History table with Sort & Pagination */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold tracking-wider text-slate-450 uppercase flex items-center gap-1.5">
                <Target size={12} className="text-blue-400" /> Attempt Logs
              </h3>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 transition w-36"
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                />
              </div>
            </div>

            <div className="overflow-x-auto border-t border-slate-850">
              <table className="w-full text-left text-[10px] border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-1 cursor-pointer select-none" onClick={() => toggleSort("assessmentName")}>
                      Name {renderSortIcon("assessmentName")}
                    </th>
                    <th className="py-2.5 px-1 cursor-pointer select-none" onClick={() => toggleSort("topic")}>
                      Topic {renderSortIcon("topic")}
                    </th>
                    <th className="py-2.5 px-1 cursor-pointer select-none" onClick={() => toggleSort("dateAttempted")}>
                      Date {renderSortIcon("dateAttempted")}
                    </th>
                    <th className="py-2.5 px-1 text-right cursor-pointer select-none" onClick={() => toggleSort("scoreObtained")}>
                      Score {renderSortIcon("scoreObtained")}
                    </th>
                    <th className="py-2.5 px-1 text-right cursor-pointer select-none" onClick={() => toggleSort("accuracy")}>
                      Acc {renderSortIcon("accuracy")}
                    </th>
                    <th className="py-2.5 px-1 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/40 text-slate-300 transition">
                        <td className="py-2.5 px-1 font-bold text-white max-w-[120px] truncate">{h.assessmentName}</td>
                        <td className="py-2.5 px-1 text-slate-400">{h.topic || h.subject || "General"}</td>
                        <td className="py-2.5 px-1">{new Date(h.dateAttempted).toLocaleDateString()}</td>
                        <td className="py-2.5 px-1 text-right font-mono text-white">{h.scoreObtained} / {h.totalMarks}</td>
                        <td className="py-2.5 px-1 text-right font-mono text-blue-400">{Number(h.accuracy ?? 0).toFixed(0)}%</td>
                        <td className="py-2.5 px-1 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            h.result === "Pass" ? "bg-green-950 text-green-400 border border-green-900" : "bg-rose-950 text-rose-400 border border-rose-900"
                          }`}>
                            {h.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">No matching logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                <span>Showing {Math.min((historyPage - 1) * pageSize + 1, sortedHistory.length)}-{Math.min(historyPage * pageSize, sortedHistory.length)} of {sortedHistory.length}</span>
                <div className="flex gap-1.5">
                  <button
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => p - 1)}
                    className="p-1 border border-slate-800 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    disabled={historyPage === totalPages}
                    onClick={() => setHistoryPage(p => p + 1)}
                    className="p-1 border border-slate-800 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Achievements & Badges */}
          <div>
            <h3 className="text-[10px] font-bold tracking-wider text-slate-450 uppercase mb-3 flex items-center gap-1.5">
              <Ribbon size={12} className="text-blue-400" /> Badges & Certificates
            </h3>
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-4">
              
              {/* Badges list */}
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-bold">Earned Badges</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(userInfo.badges ?? []).length > 0 ? (
                    userInfo.badges.map((badge, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-blue-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-200">{badge}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500">No badges unlocked yet. Keep testing!</span>
                  )}
                </div>
              </div>

              {/* Verified Certificate Simulation */}
              {summary.completedAttempts > 0 && (
                <div className="border-t border-slate-850 pt-3">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block mb-2">Verified Certificates</span>
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-950/40 text-blue-400 rounded-lg shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold text-white truncate">Platform Mastery Diploma</h4>
                      <p className="text-[9px] text-slate-500 truncate">Average Accuracy: {Number(summary.avgAccuracy).toFixed(0)}%</p>
                    </div>
                    <button
                      onClick={() => toast.success("Certificate is verified and active in candidate vault!")}
                      className="px-2.5 py-1 bg-slate-850 border border-slate-800 text-[9px] font-bold rounded-lg hover:bg-slate-800 hover:text-white transition shrink-0"
                    >
                      View
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default UserAnalyticsPanel;
