import { useState } from "react";

const FRIENDS = [
  { id: 1, name: "You", color: "#f97316", avatar: "Y" },
  { id: 2, name: "Alex", color: "#3b82f6", avatar: "A" },
  { id: 3, name: "Jordan", color: "#a855f7", avatar: "J" },
  { id: 4, name: "Sam", color: "#10b981", avatar: "S" },
  { id: 5, name: "Riley", color: "#ec4899", avatar: "R" },
];

const PRIVACY = ["Only me", "Free/Busy only", "All friends"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const INITIAL_RSVPS = {
  1: { 1: "going", 3: "maybe" },
  3: { 2: "going", 3: "going", 4: "maybe", 5: "going" },
  4: { 1: "maybe", 2: "going", 4: "going" },
  6: { 2: "going", 3: "going", 4: "no" },
};

const INITIAL_EVENTS = [
  { id: 1, title: "Coffee catch-up", date: "2026-04-07", ownerId: 2, privacy: "All friends", groupEvent: true, invitees: [1, 3], color: "#3b82f6" },
  { id: 2, title: "Doctor appt", date: "2026-04-10", ownerId: 1, privacy: "Free/Busy only", groupEvent: false, invitees: [], color: "#f97316" },
  { id: 3, title: "Movie night 🎬", date: "2026-04-15", ownerId: 1, privacy: "All friends", groupEvent: true, invitees: [2, 3, 4, 5], color: "#f97316" },
  { id: 4, title: "Hiking trip 🏔️", date: "2026-04-19", ownerId: 3, privacy: "All friends", groupEvent: true, invitees: [1, 2, 4], color: "#a855f7" },
  { id: 5, title: "Private", date: "2026-04-22", ownerId: 4, privacy: "Free/Busy only", groupEvent: false, invitees: [], color: "#10b981" },
  { id: 6, title: "Birthday dinner 🎂", date: "2026-04-26", ownerId: 5, privacy: "All friends", groupEvent: true, invitees: [1, 2, 3, 4], color: "#ec4899" },
];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year, month) { return new Date(year, month, 1).getDay(); }
function formatDate(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function getTodayStr() { const n = new Date(); return formatDate(n.getFullYear(), n.getMonth(), n.getDate()); }
function addDays(dateStr, n) { const d = new Date(dateStr + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); }
function getWeekStart(dateStr) { const d = new Date(dateStr + "T12:00:00"); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0,10); }
function friendlyDate(dateStr) { return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

const RSVP_CONFIG = {
  going: { label: "Going",  emoji: "✅", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  maybe: { label: "Maybe",  emoji: "🤔", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  no:    { label: "Can't",  emoji: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

function RsvpButtons({ eventId, rsvps, onRsvp }) {
  const current = rsvps[eventId]?.[1] || null;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      {Object.entries(RSVP_CONFIG).map(([key, cfg]) => {
        const active = current === key;
        return (
          <button key={key} onClick={() => onRsvp(eventId, key)} style={{
            flex: 1, padding: "6px 4px", borderRadius: 8, border: "1px solid " + (active ? cfg.color : "rgba(255,255,255,0.1)"),
            background: active ? cfg.bg : "rgba(255,255,255,0.04)", color: active ? cfg.color : "#666",
            fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}>{cfg.emoji} {cfg.label}</button>
        );
      })}
    </div>
  );
}

function RsvpSummary({ eventId, rsvps }) {
  const counts = { going: 0, maybe: 0, no: 0 };
  const r = rsvps[eventId] || {};
  Object.values(r).forEach(v => { if (counts[v] !== undefined) counts[v]++; });
  if (!counts.going && !counts.maybe && !counts.no) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      {Object.entries(counts).map(([key, count]) => count > 0 && (
        <span key={key} style={{ fontSize: 11, color: RSVP_CONFIG[key].color }}>
          {RSVP_CONFIG[key].emoji} {count}
        </span>
      ))}
    </div>
  );
}

export default function FriendCal() {
  const TODAY = getTodayStr();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [rsvps, setRsvps] = useState(INITIAL_RSVPS);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Alex invited you to Coffee catch-up", time: "2h ago", read: false },
    { id: 2, text: "Hiking trip 🏔️ is in 3 days!", time: "1d ago", read: false },
    { id: 3, text: "Riley invited you to Birthday dinner 🎂", time: "2d ago", read: true },
  ]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", privacy: "All friends", groupEvent: false, invitees: [] });
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("calendar");

  const unreadCount = notifications.filter(n => !n.read).length;
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const visibleEvents = (dateStr) => events.filter(e => {
    if (e.date !== dateStr) return false;
    if (e.ownerId === 1) return true;
    if (e.privacy === "Only me") return false;
    if (activeFilter !== "All" && FRIENDS.find(f => f.name === activeFilter)?.id !== e.ownerId) return false;
    return true;
  });

  const dayEvents = selectedDay ? visibleEvents(selectedDay) : [];
  const myInvites = events.filter(e => e.groupEvent && e.ownerId !== 1 && e.invitees.includes(1));
  const weekStart = getWeekStart(TODAY);
  const thisWeekEvents = events.filter(e => {
    if (e.privacy === "Only me" && e.ownerId !== 1) return false;
    return e.date >= weekStart && e.date <= addDays(weekStart, 6);
  }).sort((a,b) => a.date.localeCompare(b.date));

  const upcomingGroup = events.filter(e => {
    if (!e.groupEvent || e.privacy === "Only me") return false;
    return e.date >= TODAY && e.date <= addDays(TODAY, 30);
  }).sort((a,b) => a.date.localeCompare(b.date));

  const pendingRsvps = myInvites.filter(e => !rsvps[e.id]?.[1] && e.date >= TODAY);

  const setRsvp = (eventId, status) => {
    setRsvps(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), 1: status } }));
    const ev = events.find(e => e.id === eventId);
    const cfg = RSVP_CONFIG[status];
    setNotifications(prev => [{ id: Date.now(), text: `You responded ${cfg.emoji} "${cfg.label}" to "${ev?.title}"`, time: "Just now", read: true }, ...prev]);
  };

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDay) return;
    const ev = { id: Date.now(), title: newEvent.title, date: selectedDay, ownerId: 1, privacy: newEvent.privacy, groupEvent: newEvent.groupEvent, invitees: newEvent.invitees, color: "#f97316" };
    setEvents(prev => [...prev, ev]);
    if (newEvent.groupEvent && newEvent.invitees.length > 0) {
      const names = newEvent.invitees.map(id => FRIENDS.find(f => f.id === id)?.name).join(", ");
      setNotifications(prev => [{ id: Date.now(), text: `You invited ${names} to "${newEvent.title}"`, time: "Just now", read: true }, ...prev]);
    }
    setNewEvent({ title: "", privacy: "All friends", groupEvent: false, invitees: [] });
    setShowEventForm(false);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const getEventLabel = (ev) => (ev.ownerId !== 1 && ev.privacy === "Free/Busy only") ? "Busy" : ev.title;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'DM Sans', sans-serif", color: "#f0ece4", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1a1a22; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .day-cell:hover { background: rgba(255,255,255,0.05) !important; cursor: pointer; }
        .btn { cursor: pointer; transition: all 0.15s; border: none; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .tab-btn { cursor: pointer; transition: all 0.15s; border: none; }
        input, select { outline: none; }
        input:focus { border-color: #f97316 !important; }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .modal-panel { animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .notif-item:hover { background: rgba(255,255,255,0.05); }
        .friend-pill { cursor: pointer; transition: all 0.15s; border: none; }
        .friend-pill:hover { transform: translateY(-1px); }
        .summary-card { transition: background 0.15s; }
        .summary-card:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 10%, rgba(249,115,22,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>FriendCal</span>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, gap: 2 }}>
          {[["calendar","📅 Calendar"],["summary","📊 Summary"]].map(([tab, label]) => (
            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              padding: "7px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              background: activeTab === tab ? "rgba(249,115,22,0.2)" : "transparent",
              color: activeTab === tab ? "#f97316" : "#666",
              border: activeTab === tab ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
            }}>
              {label}
              {tab === "summary" && pendingRsvps.length > 0 && (
                <span style={{ marginLeft: 6, background: "#f97316", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px" }}>{pendingRsvps.length}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", ...FRIENDS.slice(1).map(f => f.name)].map(name => {
              const friend = FRIENDS.find(f => f.name === name);
              const active = activeFilter === name;
              return (
                <button key={name} className="friend-pill" onClick={() => setActiveFilter(name)} style={{
                  padding: "5px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: active ? (friend?.color || "#f97316") : "rgba(255,255,255,0.07)",
                  color: active ? "#fff" : "#888", fontFamily: "'DM Sans', sans-serif",
                }}>{name === "All" ? "👥 All" : name}</button>
              );
            })}
          </div>

          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setShowNotifs(v => !v)} style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#f0ece4", position: "relative" }}>
              🔔
              {unreadCount > 0 && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#f97316" }} className="pulse" />}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute", right: 0, top: 46, width: 300, background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                  {unreadCount > 0 && <button className="btn" onClick={markAllRead} style={{ fontSize: 12, color: "#f97316", background: "none", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>Mark all read</button>}
                </div>
                {notifications.slice(0, 6).map(n => (
                  <div key={n.id} className="notif-item" style={{ padding: "11px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.read ? "transparent" : "#f97316", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: n.read ? "#777" : "#f0ece4" }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 69px)" }}>
        <aside style={{ width: 200, padding: "20px 14px", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Group Members</div>
            {FRIENDS.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 9, marginBottom: 2 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{f.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>{f.id === 1 ? "You" : "Friend"}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Privacy</div>
            {[["👁️","Visible","Full details shown"],["🔒","Free/Busy","Shows as Busy"],["🚫","Private","Hidden"]].map(([icon,label,desc]) => (
              <div key={label} style={{ padding: "7px 8px", borderRadius: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{icon} {label}</div>
                <div style={{ fontSize: 10, color: "#444" }}>{desc}</div>
              </div>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          {activeTab === "calendar" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button className="btn" onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", color: "#f0ece4", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-1px" }}>{MONTHS[month]} <span style={{ color: "#f97316" }}>{year}</span></h2>
                <button className="btn" onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", color: "#f0ece4", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 0" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dateStr = formatDate(year, month, day);
                  const dayEvs = visibleEvents(dateStr);
                  const isToday = dateStr === TODAY;
                  const isSelected = dateStr === selectedDay;
                  const hasPending = dayEvs.some(e => e.groupEvent && e.invitees?.includes(1) && !rsvps[e.id]?.[1]);
                  return (
                    <div key={day} className="day-cell" onClick={() => { setSelectedDay(dateStr); setShowModal(true); }} style={{
                      minHeight: 84, padding: "7px 7px 5px", borderRadius: 10,
                      background: isSelected ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                      border: isToday ? "1.5px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.05)",
                      position: "relative", transition: "background 0.15s", cursor: "pointer",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#f97316" : "#999", marginBottom: 3, width: 20, height: 20, borderRadius: "50%", background: isToday ? "rgba(249,115,22,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
                      {hasPending && <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} className="pulse" />}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayEvs.slice(0, 3).map(ev => (
                          <div key={ev.id} style={{ fontSize: 10, fontWeight: 500, padding: "2px 4px", borderRadius: 3, background: (ev.ownerId !== 1 && ev.privacy === "Free/Busy only") ? "rgba(255,255,255,0.06)" : `${ev.color}20`, color: (ev.ownerId !== 1 && ev.privacy === "Free/Busy only") ? "#555" : ev.color, borderLeft: `2px solid ${ev.color}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getEventLabel(ev)}</div>
                        ))}
                        {dayEvs.length > 3 && <div style={{ fontSize: 10, color: "#444" }}>+{dayEvs.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "summary" && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-1px", marginBottom: 24 }}>Your <span style={{ color: "#f97316" }}>Summary</span></h2>

              {pendingRsvps.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>⏳ Awaiting Your Response ({pendingRsvps.length})</div>
                  {pendingRsvps.map(ev => {
                    const owner = FRIENDS.find(f => f.id === ev.ownerId);
                    return (
                      <div key={ev.id} className="summary-card" style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}`, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>{ev.title}</div>
                            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{friendlyDate(ev.date)} · by {owner?.name}</div>
                          </div>
                          <RsvpSummary eventId={ev.id} rsvps={rsvps} />
                        </div>
                        <RsvpButtons eventId={ev.id} rsvps={rsvps} onRsvp={setRsvp} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>📅 This Week</div>
                {thisWeekEvents.length === 0
                  ? <div style={{ fontSize: 14, color: "#444", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>Nothing on the schedule this week 🎉</div>
                  : thisWeekEvents.map(ev => {
                    const owner = FRIENDS.find(f => f.id === ev.ownerId);
                    const isBusy = ev.ownerId !== 1 && ev.privacy === "Free/Busy only";
                    return (
                      <div key={ev.id} className="summary-card" style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: isBusy ? "#666" : "#f0ece4" }}>{getEventLabel(ev)}</div>
                          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{friendlyDate(ev.date)} · {owner?.name}</div>
                          {ev.groupEvent && !isBusy && <RsvpSummary eventId={ev.id} rsvps={rsvps} />}
                        </div>
                        {ev.groupEvent && ev.invitees?.includes(1) && !isBusy && (
                          <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: rsvps[ev.id]?.[1] ? RSVP_CONFIG[rsvps[ev.id][1]]?.bg : "rgba(255,255,255,0.06)", color: rsvps[ev.id]?.[1] ? RSVP_CONFIG[rsvps[ev.id][1]]?.color : "#666", flexShrink: 0 }}>
                            {rsvps[ev.id]?.[1] ? `${RSVP_CONFIG[rsvps[ev.id][1]].emoji} ${RSVP_CONFIG[rsvps[ev.id][1]].label}` : "No response"}
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a855f7", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>👥 Upcoming Group Events (30 days)</div>
                {upcomingGroup.length === 0
                  ? <div style={{ fontSize: 14, color: "#444", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>No group events coming up</div>
                  : upcomingGroup.map(ev => {
                    const owner = FRIENDS.find(f => f.id === ev.ownerId);
                    const myResponse = rsvps[ev.id]?.[1];
                    const counts = { going: 0, maybe: 0, no: 0 };
                    Object.values(rsvps[ev.id] || {}).forEach(v => { if (counts[v] !== undefined) counts[v]++; });
                    return (
                      <div key={ev.id} className="summary-card" style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}`, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</div>
                            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{friendlyDate(ev.date)} · by {owner?.name}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                              {Object.entries(counts).map(([key, count]) => count > 0 && (
                                <span key={key} style={{ fontSize: 11, color: RSVP_CONFIG[key].color }}>{RSVP_CONFIG[key].emoji} {count}</span>
                              ))}
                            </div>
                          </div>
                          {ev.invitees?.includes(1) && (
                            <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: myResponse ? RSVP_CONFIG[myResponse]?.bg : "rgba(249,115,22,0.1)", color: myResponse ? RSVP_CONFIG[myResponse]?.color : "#f97316", flexShrink: 0, border: "1px solid " + (myResponse ? RSVP_CONFIG[myResponse]?.color : "rgba(249,115,22,0.3)") }}>
                              {myResponse ? `${RSVP_CONFIG[myResponse].emoji} ${RSVP_CONFIG[myResponse].label}` : "⏳ Respond"}
                            </div>
                          )}
                        </div>
                        {ev.invitees?.includes(1) && !myResponse && (
                          <RsvpButtons eventId={ev.id} rsvps={rsvps} onRsvp={setRsvp} />
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
        </main>
      </div>

      {showModal && selectedDay && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setShowEventForm(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ width: 440, background: "#16161e", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800 }}>{new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                {selectedDay === TODAY && <div style={{ fontSize: 12, color: "#f97316", marginTop: 1 }}>Today</div>}
              </div>
              <button className="btn" onClick={() => { setShowModal(false); setShowEventForm(false); }} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.07)", color: "#888", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "14px 22px", overflow: "auto", flex: 1 }}>
              {dayEvents.length === 0 && !showEventForm && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 14, padding: "20px 0" }}>Free day! 🎉</div>
              )}
              {dayEvents.map(ev => {
                const owner = FRIENDS.find(f => f.id === ev.ownerId);
                const isBusy = ev.ownerId !== 1 && ev.privacy === "Free/Busy only";
                const canRsvp = ev.groupEvent && ev.invitees?.includes(1) && !isBusy;
                return (
                  <div key={ev.id} style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isBusy ? "#777" : "#f0ece4" }}>{getEventLabel(ev)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: owner?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{owner?.avatar}</div>
                          <span style={{ fontSize: 11, color: "#555" }}>{owner?.name}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#666" }}>{isBusy ? "🔒 Busy" : ev.privacy === "All friends" ? "👁️ Visible" : "🔒 Busy"}</span>
                        {ev.groupEvent && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(249,115,22,0.1)", color: "#f97316" }}>👥 Group</span>}
                      </div>
                    </div>
                    {ev.invitees?.length > 0 && !isBusy && (
                      <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
                        {ev.invitees.map(id => { const f = FRIENDS.find(fr => fr.id === id); return <div key={id} style={{ width: 18, height: 18, borderRadius: "50%", background: f?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{f?.avatar}</div>; })}
                        <RsvpSummary eventId={ev.id} rsvps={rsvps} />
                      </div>
                    )}
                    {canRsvp && <RsvpButtons eventId={ev.id} rsvps={rsvps} onRsvp={setRsvp} />}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              {showEventForm ? (
                <div>
                  <input placeholder="Event title..." value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 13px", color: "#f0ece4", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                    <select value={newEvent.privacy} onChange={e => setNewEvent(p => ({ ...p, privacy: e.target.value }))} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "7px 11px", color: "#f0ece4", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                      {PRIVACY.map(p => <option key={p} value={p} style={{ background: "#1a1a24" }}>{p}</option>)}
                    </select>
                    <button className="btn" onClick={() => setNewEvent(p => ({ ...p, groupEvent: !p.groupEvent }))} style={{ padding: "7px 11px", borderRadius: 9, fontSize: 13, background: newEvent.groupEvent ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)", color: newEvent.groupEvent ? "#f97316" : "#777", border: "1px solid " + (newEvent.groupEvent ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.1)"), fontFamily: "'DM Sans', sans-serif" }}>👥 Group</button>
                  </div>
                  {newEvent.groupEvent && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Invite:</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {FRIENDS.slice(1).map(f => { const inv = newEvent.invitees.includes(f.id); return <button key={f.id} className="btn" onClick={() => setNewEvent(p => ({ ...p, invitees: inv ? p.invitees.filter(id => id !== f.id) : [...p.invitees, f.id] }))} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", background: inv ? `${f.color}30` : "rgba(255,255,255,0.05)", color: inv ? f.color : "#777", border: "1px solid " + (inv ? f.color : "rgba(255,255,255,0.1)") }}>{f.name}</button>; })}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 7 }}>
                    <button className="btn" onClick={() => setShowEventForm(false)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(255,255,255,0.05)", color: "#777", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Cancel</button>
                    <button className="btn" onClick={addEvent} style={{ flex: 2, padding: "9px", borderRadius: 9, background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>Add Event ✓</button>
                  </div>
                </div>
              ) : (
                <button className="btn" onClick={() => setShowEventForm(true)} style={{ width: "100%", padding: "11px", borderRadius: 11, background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>+ Add Event</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
