import React from "react";
import { User, Phone, Mail, Building, Hash, Calendar, Clock, Award, ShieldAlert, BookOpen, Linkedin, Github, Globe } from "lucide-react";

const Info = ({ profileData }) => {
  if (!profileData) return null;

  const { user, organization, channels, leaderboard, roleData } = profileData;

  const detailGroups = [
    {
      title: "Core Profile Identity",
      items: [
        { label: "Full Name", value: user.name, Icon: User },
        { label: "Username", value: `@${user.username}`, Icon: User, highlight: true },
        { label: "E-mail Address", value: user.email, Icon: Mail },
        { label: "Phone Number", value: user.phone || "—", Icon: Phone }
      ]
    },
    {
      title: "Platform & Organization Details",
      items: [
        { label: "Assigned Role", value: roleData.role || "Member", Icon: ShieldAlert, badge: true },
        { label: "Current Organization", value: organization?.name || "StudySphere (Lobby)", Icon: Building },
        { label: "Joined Channels", value: channels.map(c => `#${c.name}`).join(", ") || "No joined channels", Icon: Hash },
        { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString(), Icon: Calendar },
        { label: "Last Active", value: new Date(user.lastLogin || Date.now()).toLocaleString(), Icon: Clock }
      ]
    }
  ];

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Bio and About section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">About Me</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {user.bio || "No biography added yet. Click 'Edit Profile' to customize your bio profile!"}
        </p>

        {/* Social Links Row */}
        {(user.linkedin || user.github || user.portfolio) && (
          <div className="flex gap-4 pt-2">
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {user.github && (
              <a href={user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-350 hover:underline">
                <Github size={14} /> GitHub
              </a>
            )}
            {user.portfolio && (
              <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                <Globe size={14} /> Portfolio
              </a>
            )}
          </div>
        )}

        {/* Skills Tag Section */}
        {user.skills?.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1.5">Expertise Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[10px] font-bold text-slate-300">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid of detail list items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {detailGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.title}</h3>
            
            <div className="space-y-3.5">
              {group.items.map((item, itemIdx) => {
                const ItemIcon = item.Icon;
                return (
                  <div key={itemIdx} className="flex justify-between items-center border-b border-slate-850/50 pb-2 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ItemIcon size={14} className="text-slate-500" />
                      {item.label}
                    </span>
                    <span className={`font-semibold text-right ${
                      item.highlight ? "text-blue-400 font-mono" : 
                      item.badge ? "px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold uppercase" : 
                      "text-white"
                    }`}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Info;
