import React, { useEffect, useState } from "react";
import { getRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { 
  Medal, Search, Filter, Download, ArrowUp, ArrowDown, User, Award, 
  Clock, Activity, Calendar, Compass, RefreshCw, Layers, Users, ChevronLeft, ChevronRight, ArrowUpDown, ShieldAlert, Sparkles, BookOpen
} from "lucide-react";
import UserAnalyticsPanel from "../../LeaderBoard/UserAnalyticsPanel";
import { userDetailsStore } from "@/store/userStore";
import { channelStore } from "@/store/channelStore";

const LeaderBoardSection = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Overall, 1: Topic, 3: Org Metrics, 4: Comparison, 5: Feed, 6: Channel Members, 7: Org Members
  const [overallData, setOverallData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [activeUserAnalyticsId, setActiveUserAnalyticsId] = useState(null);
  
  // Logged in user details for auth check
  const userDetails = userDetailsStore((state) => state.userDetails);
  const channelDetails = channelStore((state) => state.channelDetails);
  const currentChannelId = channelDetails?._id;

  // Filters
  const [usernameFilter, setUsernameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  
  // Selector Values for sub-leaderboards
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  
  // Dropdown lists
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);

  // Sub leaderboards data
  const [subLeaderboardData, setSubLeaderboardData] = useState([]);

  // Org Metrics
  const [orgMetrics, setOrgMetrics] = useState(null);

  // Recent Activity Feed
  const [recentActivities, setRecentActivities] = useState([]);

  // Comparison
  const [compareUser1, setCompareUser1] = useState("");
  const [compareUser2, setCompareUser2] = useState("");
  const [comparisonChartData, setComparisonChartData] = useState([]);

  // Members Directory State
  const [membersData, setMembersData] = useState([]);
  const [directoryStats, setDirectoryStats] = useState(null);
  const [dirSearch, setDirSearch] = useState("");
  const [dirRole, setDirRole] = useState("");
  const [dirLevel, setDirLevel] = useState("");
  const [dirStatus, setDirStatus] = useState("");
  const [dirSortBy, setDirSortBy] = useState("rank");
  const [dirPage, setDirPage] = useState(1);
  const [dirTotalPages, setDirTotalPages] = useState(1);
  const [dirTotalCount, setDirTotalCount] = useState(0);

  const orgId = getCookie("org") || "";

  // Fetch overall leaderboard with filters
  const fetchOverallLeaderboard = async () => {
    try {
      setLoading(true);
      let queryStr = `?org_id=${orgId}`;
      if (usernameFilter) queryStr += `&username=${usernameFilter}`;
      if (dateFilter) queryStr += `&dateFilter=${dateFilter}`;
      if (difficultyFilter) queryStr += `&difficulty=${difficultyFilter}`;

      const response = await getRequest({
        url: "/leaderboard/overall",
        params: queryStr,
        token: getCookie("token")
      });

      if (response.data?.status) {
        const data = response.data.data;
        setOverallData(data);
      }
    } catch (error) {
      toast.error("Failed to load overall leaderboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique topics dynamically from MongoDB
  const fetchTopics = async () => {
    if (!orgId) return;
    try {
      const response = await getRequest({
        url: "/leaderboard/topics",
        params: `?org_id=${orgId}`,
        token: getCookie("token")
      });
      if (response.data?.status) {
        setAvailableTopics(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  // Fetch sub-leaderboard data (Topic / Assessment)
  const fetchSubLeaderboard = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      let url = "";
      if (activeTab === 1 && selectedTopic) {
        url = `/leaderboard/subject/${selectedTopic}`;
      } else if (activeTab === 2 && selectedAssessmentId) {
        url = `/leaderboard/assessment/${selectedAssessmentId}`;
      }

      if (!url) {
        setSubLeaderboardData([]);
        setLoading(false);
        return;
      }

      const response = await getRequest({
        url,
        params: `?org_id=${orgId}`,
        token: getCookie("token")
      });

      if (response.data?.status) {
        setSubLeaderboardData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load sub-leaderboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Organization aggregation metrics
  const fetchOrgMetrics = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await getRequest({
        url: `/leaderboard/organization/${orgId}`,
        token: getCookie("token")
      });
      if (response.data?.status) {
        setOrgMetrics(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch organization stats");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity feed
  const fetchRecentActivity = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await getRequest({
        url: "/leaderboard/recent-activity",
        params: `?org_id=${orgId}`,
        token: getCookie("token")
      });
      if (response.data?.status) {
        setRecentActivities(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dynamic directory members (Channel or Org Members)
  const fetchDirectoryMembers = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const isChannelTab = activeTab === 6;
      let url = isChannelTab
        ? "/leaderboard/channel-members"
        : "/leaderboard/organization-members";

      let queryStr = `?org_id=${orgId}&page=${dirPage}&limit=12&sortBy=${dirSortBy}`;
      
      if (isChannelTab) {
        if (!currentChannelId) {
          setMembersData([]);
          setLoading(false);
          return;
        }
        queryStr += `&channel_id=${currentChannelId}`;
      }

      if (dirSearch) queryStr += `&search=${encodeURIComponent(dirSearch)}`;
      if (dirRole) queryStr += `&role=${encodeURIComponent(dirRole)}`;
      if (dirLevel) queryStr += `&level=${encodeURIComponent(dirLevel)}`;
      if (dirStatus) queryStr += `&status=${encodeURIComponent(dirStatus)}`;

      const response = await getRequest({
        url,
        params: queryStr,
        token: getCookie("token")
      });

      if (response.data?.status) {
        setMembersData(response.data.data.members);
        setDirTotalPages(response.data.data.pagination.totalPages);
        setDirTotalCount(response.data.data.pagination.totalCount);
        setDirectoryStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error("Failed to load directory members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger tab fetching
  useEffect(() => {
    if (activeTab === 0) {
      fetchOverallLeaderboard();
      fetchTopics();
    } else if (activeTab === 3) {
      fetchOrgMetrics();
    } else if (activeTab === 5) {
      fetchRecentActivity();
    } else if (activeTab === 6 || activeTab === 7) {
      fetchDirectoryMembers();
    } else {
      fetchSubLeaderboard();
    }
  }, [activeTab, selectedTopic, selectedAssessmentId]);

  // Fetch overall when filters change
  useEffect(() => {
    if (activeTab === 0) {
      fetchOverallLeaderboard();
    }
  }, [usernameFilter, dateFilter, difficultyFilter]);

  // Fetch directory members on filters change
  useEffect(() => {
    if (activeTab === 6 || activeTab === 7) {
      fetchDirectoryMembers();
    }
  }, [dirPage, dirSortBy, dirRole, dirLevel, dirStatus, currentChannelId]);

  // Debounced search for Directory Members
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeTab === 6 || activeTab === 7) {
        setDirPage(1);
        fetchDirectoryMembers();
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [dirSearch]);

  // Handle Comparison Logic
  useEffect(() => {
    if (compareUser1 && compareUser2) {
      const u1 = overallData.find(u => u.userId === compareUser1);
      const u2 = overallData.find(u => u.userId === compareUser2);
      if (u1 && u2) {
        setComparisonChartData([
          { metric: "Rank Points", [u1.name]: parseFloat(Number(u1.rankScore).toFixed(1)), [u2.name]: parseFloat(Number(u2.rankScore).toFixed(1)) },
          { metric: "Accuracy %", [u1.name]: parseFloat(Number(u1.overallAccuracy).toFixed(1)), [u2.name]: parseFloat(Number(u2.overallAccuracy).toFixed(1)) },
          { metric: "Completed Quizzes", [u1.name]: u1.completedAssessments * 5, [u2.name]: u2.completedAssessments * 5 },
          { metric: "Streak Days", [u1.name]: u1.currentStreak * 2, [u2.name]: u2.currentStreak * 2 }
        ]);
      }
    }
  }, [compareUser1, compareUser2, overallData]);

  // Medal renderer
  const renderMedal = (rank) => {
    if (rank === 1) return <Medal className="text-yellow-400" size={18} />;
    if (rank === 2) return <Medal className="text-slate-400" size={18} />;
    if (rank === 3) return <Medal className="text-amber-600" size={18} />;
    return <span className="font-mono text-slate-400 text-xs font-bold">{rank}</span>;
  };

  // Initials Avatar generator
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const exportToCSV = () => {
    if (overallData.length === 0) return;
    const headers = ["Rank", "Username", "Completed Assessments", "Overall Marks", "Accuracy", "Streak", "Rank Score", "Level"];
    const rows = overallData.map(u => [
      u.rank,
      u.name || u.username,
      u.completedAssessments,
      u.overallMarks,
      `${Number(u.overallAccuracy).toFixed(1)}%`,
      `${u.currentStreak}d`,
      Number(u.rankScore).toFixed(1),
      u.performanceLevel
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leaderboard_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renders the Directory Grid view
  const renderMembersDirectory = () => {
    return (
      <div className="space-y-6">
        
        {/* Directory Summary Stats Cards */}
        {directoryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
              <div className="p-2.5 bg-blue-900/40 text-blue-400 rounded-lg">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-bold">Total Members</span>
                <p className="text-lg font-black text-white">{directoryStats.totalMembers}</p>
              </div>
            </div>

            {activeTab === 7 ? (
              <>
                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
                  <div className="p-2.5 bg-green-900/40 text-green-400 rounded-lg">
                    <Activity size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Active Today</span>
                    <p className="text-lg font-black text-white">{directoryStats.activeToday}</p>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
                  <div className="p-2.5 bg-cyan-900/40 text-cyan-400 rounded-lg">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Online Now</span>
                    <p className="text-lg font-black text-emerald-400">{directoryStats.onlineNow}</p>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
                  <div className="p-2.5 bg-purple-900/40 text-purple-400 rounded-lg">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Avg Accuracy</span>
                    <p className="text-lg font-black text-purple-300">{Number(directoryStats.avgAccuracy).toFixed(1)}%</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
                  <div className="p-2.5 bg-purple-900/40 text-purple-400 rounded-lg">
                    <Compass size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Avg Score</span>
                    <p className="text-lg font-black text-white">{Number(directoryStats.avgScore).toFixed(1)}</p>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow">
                  <div className="p-2.5 bg-emerald-900/40 text-emerald-400 rounded-lg">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Avg Accuracy</span>
                    <p className="text-lg font-black text-emerald-400">{Number(directoryStats.avgAccuracy).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shadow col-span-2 md:col-span-1">
                  <div className="p-2.5 bg-amber-900/40 text-amber-500 rounded-lg">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 uppercase block font-bold">Top Performer</span>
                    <p className="text-sm font-black text-amber-400 truncate max-w-[120px]">{directoryStats.topPerformer}</p>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* Directory Search & Filters Panel */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, email..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
            />
          </div>

          <select
            value={dirRole}
            onChange={(e) => { setDirRole(e.target.value); setDirPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">Role: All</option>
            <option value="Organization Creator">Organization Creator</option>
            <option value="Channel Creator">Channel Creator</option>
            <option value="Member">Member</option>
          </select>

          <select
            value={dirLevel}
            onChange={(e) => { setDirLevel(e.target.value); setDirPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">Level: All</option>
            <option value="Grandmaster">Grandmaster</option>
            <option value="Master">Master</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>

          <select
            value={dirStatus}
            onChange={(e) => { setDirStatus(e.target.value); setDirPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="Online">Online</option>
            <option value="Away">Away</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            value={dirSortBy}
            onChange={(e) => { setDirSortBy(e.target.value); setDirPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="rank">Sort By: Rank</option>
            <option value="highestScore">Sort By: Highest Score</option>
            <option value="accuracy">Sort By: Accuracy</option>
            <option value="newest">Sort By: Newest Member</option>
            <option value="oldest">Sort By: Oldest Member</option>
            <option value="alphabetical">Sort By: Alphabetical</option>
          </select>

        </div>

        {/* Member cards grid */}
        {membersData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {membersData.map((m, idx) => (
              <div 
                key={idx}
                className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative flex flex-col justify-between hover:border-slate-500 hover:-translate-y-1 transition duration-300 group"
              >
                {/* Header Row: Avatar and basic details */}
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900 flex items-center justify-center text-lg font-black text-white uppercase">
                      {m.image ? (
                        <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(m.name || m.username)}</span>
                      )}
                    </div>
                    {/* Status dot */}
                    <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-2 border-slate-800 rounded-full ${
                      m.onlineStatus === "Online" ? "bg-emerald-500" :
                      m.onlineStatus === "Away" ? "bg-amber-500" : "bg-slate-500"
                    }`} title={m.onlineStatus} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="font-bold text-white text-sm truncate leading-snug group-hover:text-blue-400 transition">
                      {m.name || m.username}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-mono truncate">@{m.username}</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase border mt-1.5 ${
                      m.role === "Organization Creator" ? "bg-purple-950/60 text-purple-300 border-purple-900" :
                      m.role === "Channel Creator" ? "bg-rose-950/60 text-rose-300 border-rose-900" :
                      "bg-blue-950/60 text-blue-300 border-blue-900"
                    }`}>
                      {m.role}
                    </span>
                  </div>
                </div>

                {/* Body Row: Organization, channel, rank tags */}
                <div className="border-t border-b border-slate-700/60 my-4 py-3 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 text-[10px] uppercase font-bold">Organization</span>
                    <span className="truncate max-w-[120px] font-medium">{m.organization || "StudySphere"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-slate-450 text-[10px] uppercase font-bold">Joined Channels</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                      {m.channels?.length > 0 ? (
                        m.channels.map((ch, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] rounded text-slate-400">
                            #{ch.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-555 italic">None</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 text-[10px] uppercase font-bold">Rank / Level</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-900 text-[9px] rounded font-bold uppercase">
                        #{m.rank}
                      </span>
                      <span className="px-1.5 py-0.5 bg-purple-950/60 text-purple-300 border-purple-900 text-[9px] rounded font-bold uppercase">
                        {m.performanceLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Metrics Row: Score progress and button */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/40 p-2 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[8px] uppercase block font-bold">Score</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5 block">{Number(m.rankScore).toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] uppercase block font-bold">Accuracy</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">{Number(m.overallAccuracy).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] uppercase block font-bold">Streak</span>
                      <span className="text-xs font-mono font-bold text-orange-400 mt-0.5 block">{m.currentStreak}d</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveUserAnalyticsId(m.userId)}
                    className="w-full py-2 bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-200 border border-slate-650 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                  >
                    View Profile
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl py-16 text-center text-slate-500 text-sm">
            <Sparkles className="mx-auto mb-3 text-slate-600 animate-bounce" size={28} />
            No members found matching these search criteria.
          </div>
        )}

        {/* Directory Pagination Controls */}
        {dirTotalPages > 1 && (
          <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-slate-700">
            <span>Showing {Math.min((dirPage - 1) * 12 + 1, dirTotalCount)}-{Math.min(dirPage * 12, dirTotalCount)} of {dirTotalCount} members</span>
            <div className="flex gap-2">
              <button
                disabled={dirPage === 1}
                onClick={() => setDirPage(p => p - 1)}
                className="p-1.5 border border-slate-700 rounded bg-slate-900 text-slate-355 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={dirPage === dirTotalPages}
                onClick={() => setDirPage(p => p + 1)}
                className="p-1.5 border border-slate-700 rounded bg-slate-900 text-slate-355 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 p-4 md:p-8">
      
      {/* Top Header Card */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-slate-800 via-slate-850 to-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Award className="text-blue-500" size={26} /> Platform Leaderboard
          </h1>
          <p className="text-xs text-slate-400">Review rankings, subjects, activity, and browse organization directory members</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeTab === 6 || activeTab === 7) fetchDirectoryMembers();
              else if (activeTab === 0) fetchOverallLeaderboard();
              else if (activeTab === 3) fetchOrgMetrics();
              else if (activeTab === 5) fetchRecentActivity();
              else fetchSubLeaderboard();
            }}
            className="p-2 border border-slate-600 hover:bg-slate-700 rounded-lg text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-semibold text-sm transition"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-3 mb-6">
        {[
          { label: "Overall Rankings", tabIndex: 0, icon: Award },
          { label: "Topic Rankings", tabIndex: 1, icon: Compass },
          { label: "Org Metrics", tabIndex: 3, icon: Users },
          { label: "User Comparison", tabIndex: 4, icon: RefreshCw },
          { label: "Recent Activity", tabIndex: 5, icon: Activity },
          { label: "Channel Members", tabIndex: 6, icon: Layers },
          { label: "Org Members", tabIndex: 7, icon: Users }
        ].map((tab, idx) => {
          const isActive = activeTab === tab.tabIndex;
          const Icon = tab.icon;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(tab.tabIndex)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Primary Dashboard Body */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 0: OVERALL LEADERBOARD */}
          {activeTab === 0 && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                  />
                </div>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="">Filter Date: All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="">Filter Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] min-w-[1600px]">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/80 text-slate-300 font-bold uppercase">
                        <th className="py-4 px-3 text-center w-14">Rank</th>
                        <th className="py-4 px-3 text-center w-16">Profile</th>
                        <th className="py-4 px-3">Username</th>
                        <th className="py-4 px-3">Organization</th>
                        <th className="py-4 px-3 text-center">Total Assessments</th>
                        <th className="py-4 px-3 text-center">Completed</th>
                        <th className="py-4 px-3 text-center">Pending</th>
                        <th className="py-4 px-3 text-center">Attempts</th>
                        <th className="py-4 px-3 text-right">Overall Marks</th>
                        <th className="py-4 px-3 text-right">Overall Score</th>
                        <th className="py-4 px-3 text-right">Average Score</th>
                        <th className="py-4 px-3 text-right">Average Accuracy</th>
                        <th className="py-4 px-3 text-right">Avg Time</th>
                        <th className="py-4 px-3 text-center">Current Streak</th>
                        <th className="py-4 px-3 text-center">Longest Streak</th>
                        <th className="py-4 px-3 text-right">Weighted Rank</th>
                        <th className="py-4 px-3 text-center">Level</th>
                        <th className="py-4 px-3">Last Attempt</th>
                        <th className="py-4 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {overallData.length > 0 ? (
                        overallData.map((item, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => {
                              if (item.userId === userDetails?._id) {
                                setActiveUserAnalyticsId(item.userId);
                              } else {
                                toast.error("You are only authorized to view your own detailed analytics dashboard.");
                              }
                            }}
                            className="hover:bg-slate-700/30 cursor-pointer text-slate-200 transition"
                          >
                            <td className="py-3 px-3 text-center flex items-center justify-center gap-1.5 h-12">
                              {renderMedal(item.rank)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                                  {item.image ? (
                                    <img src={item.image} alt={item.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-white text-xs">{item.name ? item.name[0].toUpperCase() : "U"}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-white max-w-[150px] truncate">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{item.name || item.username}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate">
                              {item.organization || "StudySphere"}
                            </td>
                            <td className="py-3 px-3 text-center font-mono">{item.totalAssessments ?? 0}</td>
                            <td className="py-3 px-3 text-center font-mono text-green-400">{item.completedAssessments ?? 0}</td>
                            <td className="py-3 px-3 text-center font-mono text-amber-500">{item.pendingAssessments ?? 0}</td>
                            <td className="py-3 px-3 text-center font-mono">{item.totalAttempts}</td>
                            <td className="py-3 px-3 text-right font-mono">{item.overallMarks ?? 0}</td>
                            <td className="py-3 px-3 text-right font-mono">{item.overallScore}</td>
                            <td className="py-3 px-3 text-right font-mono">{Number(item.avgScore ?? 0).toFixed(1)}</td>
                            <td className="py-3 px-3 text-right font-semibold font-mono text-emerald-400">{Number(item.overallAccuracy ?? 0).toFixed(1)}%</td>
                            <td className="py-3 px-3 text-right font-mono">{item.totalAttempts > 0 ? `${Number(item.avgTimeTaken ?? 0).toFixed(0)}s` : "—"}</td>
                            <td className="py-3 px-3 text-center font-bold text-orange-400 font-mono">{item.currentStreak}d</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-400">{item.longestStreak}d</td>
                            <td className="py-3 px-3 text-right font-bold font-mono text-blue-400 text-sm">{Number(item.rankScore ?? 0).toFixed(1)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                                item.performanceLevel === "Grandmaster" ? "bg-purple-950 text-purple-300 border-purple-800" :
                                item.performanceLevel === "Master" ? "bg-rose-950 text-rose-300 border-rose-800" :
                                item.performanceLevel === "Gold" ? "bg-amber-950 text-amber-300 border-amber-800" :
                                "bg-slate-700 text-slate-300 border-slate-600"
                              }`}>
                                {item.performanceLevel}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                              {item.lastAssessmentDate ? new Date(item.lastAssessmentDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                                item.status === "Active" ? "bg-green-950 text-green-400 border border-green-800" : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}>
                                {item.status || "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="19" className="py-12 text-center text-slate-500 font-medium text-sm">No leaderboard rankings available currently.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: TOPIC-WISE LEADERBOARD */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4">
                <label className="text-sm font-semibold text-slate-300 shrink-0">Select Topic:</label>
                 <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none"
                  disabled={availableTopics.length === 0}
                >
                  {availableTopics.length > 0 ? (
                    <>
                      <option value="">-- Choose Topic --</option>
                      {availableTopics.map((sub, i) => (
                        <option key={i} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">No Topics Available</option>
                  )}
                </select>
              </div>

              {selectedTopic ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                    <h3 className="font-bold text-white text-sm">RANKINGS FOR {selectedTopic.toUpperCase()}</h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-300 font-bold uppercase bg-slate-850">
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4 text-center">Attempts</th>
                        <th className="py-3 px-4 text-right">Avg Score</th>
                        <th className="py-3 px-4 text-right">Accuracy</th>
                        <th className="py-3 px-4 text-right">Weighted Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {subLeaderboardData.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-700/30 text-slate-200">
                          <td className="py-3 px-4 text-center">{renderMedal(item.rank)}</td>
                          <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                          <td className="py-3 px-4 text-center font-mono">{item.totalAttempts}</td>
                          <td className="py-3 px-4 text-right font-mono">{Number(item.avgScore ?? 0).toFixed(1)}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">{Number(item.overallAccuracy ?? 0).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-blue-400">{Number(item.rankScore ?? 0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12 text-sm font-medium">Please select a topic from the dropdown menu to view rankings.</p>
              )}
            </div>
          )}

          {/* TAB 3: ORG LEADERBOARD */}
          {activeTab === 3 && orgMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm mb-4">ORGANIZATION SCORECARD</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 text-xs block mb-1">Top Performer</span>
                      <strong className="text-base text-white">{orgMetrics.topPerformer}</strong>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 text-xs block mb-1">Most Active User</span>
                      <strong className="text-base text-white">{orgMetrics.mostActiveUser}</strong>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 text-xs block mb-1">Average Accuracy</span>
                      <strong className="text-lg text-emerald-400 font-bold font-mono">{Number(orgMetrics.avgAccuracy ?? 0).toFixed(1)}%</strong>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-405 text-xs block mb-1">Total Members</span>
                      <strong className="text-lg text-white font-bold font-mono">{orgMetrics.totalMembers}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm mb-4">ACTIVITY STATS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-405 text-xs block mb-1">Created Quizzes</span>
                      <strong className="text-lg text-white font-bold font-mono">{orgMetrics.totalAssessments}</strong>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                      <span className="text-slate-455 text-xs block mb-1">Total Attempts</span>
                      <strong className="text-lg text-white font-bold font-mono">{orgMetrics.totalAttempts}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USER COMPARISON */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 flex flex-wrap items-center gap-6 shadow-md">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs text-slate-400 uppercase font-bold">User 1</label>
                  <select
                    value={compareUser1}
                    onChange={(e) => setCompareUser1(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Select First User --</option>
                    {overallData.map(u => <option key={u.userId} value={u.userId}>{u.name || u.username}</option>)}
                  </select>
                </div>

                <div className="text-slate-500 font-bold self-end py-3">VS</div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs text-slate-400 uppercase font-bold">User 2</label>
                  <select
                    value={compareUser2}
                    onChange={(e) => setCompareUser2(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Select Second User --</option>
                    {overallData.map(u => <option key={u.userId} value={u.userId}>{u.name || u.username}</option>)}
                  </select>
                </div>
              </div>

              {compareUser1 && compareUser2 && comparisonChartData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                  {/* Chart Comparison */}
                  <div>
                    <h3 className="font-bold text-white text-sm mb-6">METRICS SIDE-BY-SIDE</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                          <Legend />
                          <Bar dataKey={overallData.find(u => u.userId === compareUser1)?.name} fill="#0088FE" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={overallData.find(u => u.userId === compareUser2)?.name} fill="#FFBB28" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Radar Comparison */}
                  <div>
                    <h3 className="font-bold text-white text-sm mb-6">COMPREHENSIVE MAP</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonChartData}>
                          <PolarGrid stroke="#475569" />
                          <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
                          <Radar name={overallData.find(u => u.userId === compareUser1)?.name} dataKey={overallData.find(u => u.userId === compareUser1)?.name} stroke="#0088FE" fill="#0088FE" fillOpacity={0.4} />
                          <Radar name={overallData.find(u => u.userId === compareUser2)?.name} dataKey={overallData.find(u => u.userId === compareUser2)?.name} stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.4} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12 text-sm font-medium">Select two users from the dropdown selectors to display comparison stats.</p>
              )}
            </div>
          )}

          {/* TAB 5: RECENT ACTIVITY */}
          {activeTab === 5 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
                <Activity className="text-blue-500 animate-pulse" /> Live Activity Feed
              </h3>
              
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-4 bg-slate-900 border border-slate-700/50 p-4 rounded-xl hover:border-slate-600 transition">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                        {act.user.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200">{act.message}</p>
                        <span className="text-[10px] text-slate-500">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No recent activity logged for this organization.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6 & 7: DIRECTORY MEMBERS */}
          {(activeTab === 6 || activeTab === 7) && renderMembersDirectory()}

        </div>
      )}

      {/* Render Expanded User Analytics Panel */}
      <AnimatePresence>
        {activeUserAnalyticsId && (
          <UserAnalyticsPanel
            userId={activeUserAnalyticsId}
            orgId={orgId}
            onClose={() => setActiveUserAnalyticsId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderBoardSection;
