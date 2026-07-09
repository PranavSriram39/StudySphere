import React from "react";
import {
  Activity, Building, Hash, BookOpen, Clock, User, Award,
  CheckCircle, ArrowUpRight, Compass, ShieldAlert, Sparkles
} from "lucide-react";

const Schedule = ({ activities = [], upcoming = [] }) => {

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case "org": return <Building size={16} className="text-blue-400" />;
      case "channel": return <Hash size={16} className="text-purple-400" />;
      case "quiz": return <BookOpen size={16} className="text-emerald-400" />;
      case "profile": return <User size={16} className="text-cyan-400" />;
      case "rank": return <Award size={16} className="text-amber-400" />;
      case "deadline": return <Clock size={16} className="text-rose-400" />;
      default: return <Activity size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-slate-200">
      
      {/* Recent Activities Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Activity size={16} className="text-blue-500 animate-pulse" /> Recent Activities
        </h3>

        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
          {activities.length > 0 ? (
            activities.map((act, i) => {
              const dt = new Date(act.timestamp);
              return (
                <div key={i} className="flex gap-4 p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                  <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg shrink-0 flex items-center justify-center h-9 w-9">
                    {getActivityIcon(act.icon)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-white leading-snug">{act.title}</h4>
                    <p className="text-[10px] text-slate-400">{act.description}</p>
                    <span className="text-[9px] text-slate-500 block pt-0.5">
                      {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No recent activities logged on this profile.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Activities / Schedule Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Clock size={16} className="text-purple-500" /> Upcoming & Deadlines
        </h3>

        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
          {upcoming.length > 0 ? (
            upcoming.map((item, i) => {
              const dt = new Date(item.date);
              return (
                <div key={i} className="flex gap-4 p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                  <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg shrink-0 flex items-center justify-center h-9 w-9">
                    {getActivityIcon(item.icon)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                    <p className="text-[10px] text-slate-400">{item.description}</p>
                    <span className="text-[9px] text-purple-400 font-semibold block pt-0.5">
                      Due: {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Sparkles size={24} className="text-slate-600 animate-bounce" />
              <span>No upcoming activities or scheduled quizzes active.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Schedule;
