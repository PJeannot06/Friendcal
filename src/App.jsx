import { useState, useEffect } from "react";

const FRIENDS = [
  { id: 1, name: "You", color: "#f97316", avatar: "Y" },
  { id: 2, name: "Alex", color: "#3b82f6", avatar: "A" },
  { id: 3, name: "Jordan", color: "#a855f7", avatar: "J" },
  { id: 4, name: "Sam", color: "#10b981", avatar: "S" },
  { id: 5, name: "Riley", color: "#ec4899", avatar: "R" },
];

const COLORS = ["#f97316","#3b82f6","#a855f7","#10b981","#ec4899","#f59e0b","#06b6d4","#ef4444"];
const PRIVACY = ["Only me", "Free/Busy only", "All friends"];
const DAYS = ["S","M","T","W","T","F","S"];
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

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function formatDate(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function getTodayStr() { const n = new Date(); return formatDate(n.getFullYear(), n.getMonth(), n.getDate()); }
function addDays(dateStr, n) { const d = new Date(dateStr + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); }
function getWeekStart(dateStr) { const d = new Date(dateStr + "T12:00:00"); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0,10); }
function friendlyDate(dateStr) { return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

const RSVP_CONFIG = {
  going: { label: "Going", emoji: "✅", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  maybe: { label: "Maybe", emoji: "🤔", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  no:    { label: "Can't", emoji: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function RsvpButtons({ eventId, rsvps, onRsvp }) {
  const current = rsvps[eventId]?.[1] || null;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      {Object.entries(RSVP_CONFIG).map(([key, cfg]) => {
        const active = current === key;
        return (
          <button key={key} onClick={() => onRsvp(eventId, key)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8,
            border: "1px solid " + (active ? cfg.color : "rgba(255,255,255,0.1)"),
            background: active ? cfg.bg : "rgba(255,255,255,0.04)",
            color: active ? cfg.color : "#666",
            fontSize: 13, fontWeight: active ? 600 : 400,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
          }}>{cfg.emoji} {cfg.label}</button>
        );
      })}
    </div>
  );
}

function RsvpSummary({ eventId, rsvps }) {
  const counts = { going: 0, maybe: 0, no: 0 };
  Object.values(rsvps[eventId] || {}).forEach(v => { if (counts[v] !== undefined) counts[v]++; });
  if (!counts.going && !counts.maybe && !counts.no) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      {Object.entries(counts).map(([key, count]) => count > 0 && (
        <span key={key} style={{ fontSize: 11, color: RSVP_CONFIG[key].color }}>{RSVP_CONFIG[key].emoji} {count}</span>
      ))}
    </div>
  );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────────
function WelcomeScreen({ onEnter }) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [step, setStep] = useState(1);
  const isMobile = useIsMobile();
  const avatar = name.trim() ? name.trim()[0].toUpperCase() : "?";

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'DM Sans', sans-serif", color: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : 24, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .welcome-card { animation: floatUp 0.6s ease forwards; }
        @keyframes floatUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .glow-btn { transition: all 0.2s; border: none; cursor: pointer; }
        .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(249,115,22,0.4); }
        .glow-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; cursor: not-allowed; }
        .color-dot { cursor: pointer; transition: transform 0.15s; border: none; }
        .color-dot:hover { transform: scale(1.15); }
        input { outline: none; }
        input:focus { border-color: #f97316 !important; }
        .float1 { animation: float1 6s ease-in-out infinite; }
        .float2 { animation: float2 8s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" }} className="float1" />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)" }} className="float2" />
      </div>

      <div className="welcome-card" style={{ maxWidth: 480, width: "100%", position: "relative", zIndex: 1 }}>
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 24 }}>
              🚧 DEMO VERSION
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: isMobile ? 42 : 52, height: isMobile ? 42 : 52, borderRadius: 14, background: "linear-gradient(135deg, #f97316, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 22 : 26 }}>📅</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-1px" }}>FriendCal</span>
            </div>

            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.5px" }}>
              The world is going<br />
              <span style={{ background: "linear-gradient(135deg, #f97316, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>a little crazy.</span>
            </h1>

            <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.75, color: "#aaa", marginBottom: 14 }}>
              Jobs, stress, life — it's a lot. But the people who matter most? They're still out there. Still worth showing up for.
            </p>

            <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.75, color: "#aaa", marginBottom: 14 }}>
              <span style={{ color: "#f97316", fontWeight: 600 }}>FriendCal</span> is a simple way to see when your crew is free — so you can stop saying <em>"we should hang soon"</em> and actually make it happen.
            </p>

            <p style={{ fontSize: isMobile ? 13 : 15, lineHeight: 1.75, color: "#666", marginBottom: 28 }}>
              Connection isn't a luxury right now. It's a lifeline. 💛<br />
              <span style={{ color: "#a855f7", fontWeight: 600 }}>PYT Quality Time</span> — let's protect it.
            </p>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 28, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f97316", marginBottom: 6, letterSpacing: "0.05em" }}>📌 HEADS UP — THIS IS A DEMO</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>Events and RSVPs won't save between visits yet. This is just a preview — try it out, share it with your crew, and let us know what you think!</div>
            </div>

            <button className="glow-btn" onClick={() => setStep(2)} style={{
              width: "100%", padding: isMobile ? "16px" : "16px 48px", borderRadius: 16,
              background: "linear-gradient(135deg, #f97316, #ec4899)",
              color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            }}>Let's go 🙌</button>

            <div style={{ marginTop: 12, fontSize: 12, color: "#444" }}>No account needed · No download · Just vibes</div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#555", fontSize: 13, marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>← Back</button>

            <div style={{ width: 72, height: 72, borderRadius: "50%", background: selectedColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 auto 16px", transition: "background 0.2s", boxShadow: `0 0 30px ${selectedColor}60` }}>
              {avatar}
            </div>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 22 : 24, fontWeight: 800, marginBottom: 6 }}>Who are you? 👋</h2>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>Pick your name and a color so your crew knows it's you</p>

            <input
              placeholder="Your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && onEnter({ name: name.trim(), color: selectedColor, avatar })}
              maxLength={20}
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                padding: "14px 18px", color: "#f0ece4", fontSize: 16,
                fontFamily: "'DM Sans', sans-serif", marginBottom: 20, textAlign: "center",
              }}
            />

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 12, fontWeight: 500 }}>PICK YOUR COLOR</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {COLORS.map(c => (
                  <button key={c} className="color-dot" onClick={() => setSelectedColor(c)} style={{
                    width: 38, height: 38, borderRadius: "50%", background: c,
                    border: selectedColor === c ? "3px solid #fff" : "3px solid transparent",
                    boxShadow: selectedColor === c ? `0 0 16px ${c}` : "none",
                    transition: "all 0.15s",
                  }} />
                ))}
              </div>
            </div>

            <button className="glow-btn" onClick={() => name.trim() && onEnter({ name: name.trim(), color: selectedColor, avatar })} disabled={!name.trim()} style={{
              width: "100%", padding: "15px", borderRadius: 14, fontSize: 16, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", color: "#fff",
              background: name.trim() ? "linear-gradient(135deg, #f97316, #ec4899)" : "rgba(255,255,255,0.08)",
            }}>Enter FriendCal ✨</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function FriendCal() {
  const TODAY = getTodayStr();
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [rsvps, setRsvps] = useState(INITIAL_RSVPS);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Alex invited you to Coffee catch-up", time: "2h ago", read: false },
    { id: 2, text: "Hiking trip 🏔️ is in 3 days!", time: "1d ago", read: false },
    { id: 3, text: "Riley invited you to Birthday dinner 🎂", time: "2d ago", read: true },
  ]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", privacy: "All friends", groupEvent: false, invitees: [] });
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("calendar");

  if (!currentUser) return <WelcomeScreen onEnter={setCurrentUser} />;

  const allFriends = [
    { id: 1, name: currentUser.name, color: currentUser.color, avatar: currentUser.avatar },
    ...FRIENDS.slice(1),
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const visibleEvents = (dateStr) => events.filter(e => {
    if (e.date !== dateStr) return false;
    if (e.ownerId === 1) return true;
    if (e.privacy === "Only me") return false;
    if (activeFilter !== "All" && allFriends.find(f => f.name === activeFilter)?.id !== e.ownerId) return false;
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
    const ev = { id: Date.now(), title: newEvent.title, date: selectedDay, ownerId: 1, privacy: newEvent.privacy, groupEvent: newEvent.groupEvent, invitees: newEvent.invitees, color: currentUser.color };
    setEvents(prev => [...prev, ev]);
    if (newEvent.groupEvent && newEvent.invitees.length > 0) {
      const names = newEvent.invitees.map(id => allFriends.find(f => f.id === id)?.name).join(", ");
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
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'DM Sans', sans-serif", color: "#f0ece4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .day-cell:hover { background: rgba(255,255,255,0.06) !important; cursor: pointer; }
        .btn { cursor: pointer; transition: all 0.15s; border: none; }
        .btn:hover { opacity: 0.85; }
        .tab-btn { cursor: pointer; transition: all 0.15s; border: none; }
        input, select { outline: none; }
        input:focus { border-color: #f97316 !important; }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-panel { animation: slideUp 0.25s ease; }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .summary-card { transition: background 0.15s; }
        .summary-card:hover { background: rgba(255,255,255,0.06) !important; }
        .notif-item:hover { background: rgba(255,255,255,0.05); }
      `}</style>

      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 10%, rgba(249,115,22,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* HEADER */}
      <header style={{ padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50, background: "#0f0f13" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isMobile && (
            <button className="btn" onClick={() => setShowSidebar(v => !v)} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", color: "#f0ece4", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
          )}
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #f97316, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📅</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 800, letterSpacing: "-0.5px" }}>FriendCal</span>
        </div>

        {/* Tab switcher — hidden on mobile, shown as bottom nav instead */}
        {!isMobile && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, gap: 2 }}>
            {[["calendar","📅 Calendar"],["summary","📊 Summary"]].map(([tab, label]) => (
              <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
                padding: "7px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                background: activeTab === tab ? "rgba(249,115,22,0.2)" : "transparent",
                color: activeTab === tab ? "#f97316" : "#666",
                border: activeTab === tab ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
              }}>
                {label}
                {tab === "summary" && pendingRsvps.length > 0 && <span style={{ marginLeft: 6, background: "#f97316", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px" }}>{pendingRsvps.length}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User avatar */}
          <div onClick={() => setCurrentUser(null)} title="Change user" style={{ width: 30, height: 30, borderRadius: "50%", background: currentUser.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: `0 0 10px ${currentUser.color}60` }}>
            {currentUser.avatar}
          </div>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setShowNotifs(v => !v)} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#f0ece4", position: "relative" }}>
              🔔
              {unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#f97316" }} className="pulse" />}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute", right: 0, top: 42, width: isMobile ? "calc(100vw - 32px)" : 300, maxWidth: 300, background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                  {unreadCount > 0 && <button className="btn" onClick={markAllRead} style={{ fontSize: 12, color: "#f97316", background: "none", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>Mark all read</button>}
                </div>
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="notif-item" style={{ padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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

      {/* MOBILE: Friend filter bar */}
      {isMobile && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6, overflowX: "auto", background: "#0f0f13" }}>
          {["All", ...allFriends.slice(1).map(f => f.name)].map(name => {
            const friend = allFriends.find(f => f.name === name);
            const active = activeFilter === name;
            return (
              <button key={name} onClick={() => setActiveFilter(name)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, flexShrink: 0,
                background: active ? (friend?.color || "#f97316") : "rgba(255,255,255,0.07)",
                color: active ? "#fff" : "#888", fontFamily: "'DM Sans', sans-serif", border: "none", cursor: "pointer",
              }}>{name === "All" ? "👥 All" : name}</button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", height: isMobile ? "auto" : "calc(100vh - 69px)", position: "relative" }}>

        {/* SIDEBAR — desktop always visible, mobile as overlay */}
        {(!isMobile || showSidebar) && (
          <>
            {isMobile && <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />}
            <aside style={{
              width: isMobile ? 220 : 190,
              padding: "16px 12px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              overflowY: "auto",
              background: "#0f0f13",
              ...(isMobile ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 } : {}),
            }}>
              {isMobile && <div style={{ height: 60 }} />}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Group Members</div>
                {allFriends.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, marginBottom: 2 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{f.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: "#444" }}>{f.id === 1 ? "You" : "Friend"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Privacy</div>
                {[["👁️","Visible","Full details"],["🔒","Free/Busy","Shows as Busy"],["🚫","Private","Hidden"]].map(([icon,label,desc]) => (
                  <div key={label} style={{ padding: "6px 8px", borderRadius: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{icon} {label}</div>
                    <div style={{ fontSize: 10, color: "#444" }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: "10px", borderRadius: 12, background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(168,85,247,0.1))", border: "1px solid rgba(249,115,22,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>💛</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>PYT Quality Time</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Protect your connections</div>
              </div>
            </aside>
          </>
        )}

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: isMobile ? "16px 12px" : "20px 24px", overflow: "auto", paddingBottom: isMobile ? 80 : 20 }}>

          {/* Desktop friend filter */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {["All", ...allFriends.slice(1).map(f => f.name)].map(name => {
                const friend = allFriends.find(f => f.name === name);
                const active = activeFilter === name;
                return (
                  <button key={name} onClick={() => setActiveFilter(name)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: active ? (friend?.color || "#f97316") : "rgba(255,255,255,0.07)",
                    color: active ? "#fff" : "#888", fontFamily: "'DM Sans', sans-serif", border: "none", cursor: "pointer", transition: "all 0.15s",
                  }}>{name === "All" ? "👥 All" : name}</button>
                );
              })}
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === "calendar" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <button className="btn" onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", color: "#f0ece4", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: "-1px" }}>{MONTHS[month]} <span style={{ color: "#f97316" }}>{year}</span></h2>
                <button className="btn" onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", color: "#f0ece4", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 3, marginBottom: isMobile ? 2 : 3 }}>
                {DAYS.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#444", padding: "4px 0" }}>{d}</div>)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 3 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dateStr = formatDate(year, month, day);
                  const dayEvs = visibleEvents(dateStr);
                  const isToday = dateStr === TODAY;
                  const isSelected = dateStr === selectedDay;
                  const hasPending = dayEvs.some(e => e.groupEvent && e.invitees?.includes(1) && !rsvps[e.id]?.[1]);
                  return (
                    <div key={day} className="day-cell" onClick={() => { setSelectedDay(dateStr); setShowModal(true); }} style={{
                      minHeight: isMobile ? 52 : 84,
                      padding: isMobile ? "5px 4px" : "7px 7px 5px",
                      borderRadius: isMobile ? 8 : 10,
                      background: isSelected ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                      border: isToday ? "1.5px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.05)",
                      position: "relative", transition: "background 0.15s", cursor: "pointer",
                    }}>
                      <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#f97316" : "#999", marginBottom: 2, width: 18, height: 18, borderRadius: "50%", background: isToday ? "rgba(249,115,22,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
                      {hasPending && <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "#f97316" }} className="pulse" />}
                      {!isMobile && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {dayEvs.slice(0, 2).map(ev => (
                            <div key={ev.id} style={{ fontSize: 9, fontWeight: 500, padding: "1px 3px", borderRadius: 3, background: (ev.ownerId !== 1 && ev.privacy === "Free/Busy only") ? "rgba(255,255,255,0.06)" : `${ev.color}20`, color: (ev.ownerId !== 1 && ev.privacy === "Free/Busy only") ? "#555" : ev.color, borderLeft: `2px solid ${ev.color}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getEventLabel(ev)}</div>
                          ))}
                          {dayEvs.length > 2 && <div style={{ fontSize: 9, color: "#444" }}>+{dayEvs.length - 2}</div>}
                        </div>
                      )}
                      {isMobile && dayEvs.length > 0 && (
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {dayEvs.slice(0, 3).map(ev => (
                            <div key={ev.id} style={{ width: 5, height: 5, borderRadius: "50%", background: ev.color }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* SUMMARY TAB */}
          {activeTab === "summary" && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: "-1px", marginBottom: 20 }}>Your <span style={{ color: "#f97316" }}>Summary</span></h2>

              {pendingRsvps.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>⏳ Awaiting Your Response ({pendingRsvps.length})</div>
                  {pendingRsvps.map(ev => {
                    const owner = allFriends.find(f => f.id === ev.ownerId);
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

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>📅 This Week</div>
                {thisWeekEvents.length === 0
                  ? <div style={{ fontSize: 14, color: "#444", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>Nothing this week 🎉</div>
                  : thisWeekEvents.map(ev => {
                    const owner = allFriends.find(f => f.id === ev.ownerId);
                    const isBusy = ev.ownerId !== 1 && ev.privacy === "Free/Busy only";
                    return (
                      <div key={ev.id} className="summary-card" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}`, marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isBusy ? "#666" : "#f0ece4" }}>{getEventLabel(ev)}</div>
                        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{friendlyDate(ev.date)} · {owner?.name}</div>
                        {ev.groupEvent && !isBusy && <RsvpSummary eventId={ev.id} rsvps={rsvps} />}
                      </div>
                    );
                  })
                }
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a855f7", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>👥 Upcoming Group Events</div>
                {upcomingGroup.length === 0
                  ? <div style={{ fontSize: 14, color: "#444", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", textAlign: "center" }}>No group events coming up</div>
                  : upcomingGroup.map(ev => {
                    const owner = allFriends.find(f => f.id === ev.ownerId);
                    const myResponse = rsvps[ev.id]?.[1];
                    const counts = { going: 0, maybe: 0, no: 0 };
                    Object.values(rsvps[ev.id] || {}).forEach(v => { if (counts[v] !== undefined) counts[v]++; });
                    return (
                      <div key={ev.id} className="summary-card" style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${ev.color}`, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
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
                            <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: myResponse ? RSVP_CONFIG[myResponse]?.bg : "rgba(249,115,22,0.1)", color: myResponse ? RSVP_CONFIG[myResponse]?.color : "#f97316", border: "1px solid " + (myResponse ? RSVP_CONFIG[myResponse]?.color : "rgba(249,115,22,0.3)") }}>
                              {myResponse ? `${RSVP_CONFIG[myResponse].emoji} ${RSVP_CONFIG[myResponse].label}` : "⏳ Respond"}
                            </div>
                          )}
                        </div>
                        {ev.invitees?.includes(1) && !myResponse && <RsvpButtons eventId={ev.id} rsvps={rsvps} onRsvp={setRsvp} />}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#16161e", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", zIndex: 40, padding: "8px 0" }}>
          {[["calendar","📅","Calendar"],["summary","📊","Summary"]].map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "6px 0",
              color: activeTab === tab ? "#f97316" : "#555",
            }}>
              <span style={{ fontSize: 20, position: "relative" }}>
                {icon}
                {tab === "summary" && pendingRsvps.length > 0 && <span style={{ position: "absolute", top: -2, right: -6, background: "#f97316", color: "#fff", borderRadius: 10, fontSize: 9, padding: "0 4px", fontFamily: "'DM Sans', sans-serif" }}>{pendingRsvps.length}</span>}
              </span>
              <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: activeTab === tab ? 600 : 400 }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* DAY MODAL */}
      {showModal && selectedDay && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setShowEventForm(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{
            width: isMobile ? "100%" : 440,
            background: "#16161e",
            borderRadius: isMobile ? "20px 20px 0 0" : 20,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
            maxHeight: isMobile ? "85vh" : "85vh",
            display: "flex", flexDirection: "column",
          }}>
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "12px auto 0" }} />}

            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800 }}>{new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                {selectedDay === TODAY && <div style={{ fontSize: 12, color: "#f97316", marginTop: 1 }}>Today</div>}
              </div>
              <button className="btn" onClick={() => { setShowModal(false); setShowEventForm(false); }} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.07)", color: "#888", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "12px 20px", overflow: "auto", flex: 1 }}>
              {dayEvents.length === 0 && !showEventForm && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 14, padding: "20px 0" }}>Free day! 🎉</div>
              )}
              {dayEvents.map(ev => {
                const owner = allFriends.find(f => f.id === ev.ownerId);
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
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#666" }}>{isBusy ? "🔒 Busy" : "👁️ Visible"}</span>
                        {ev.groupEvent && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(249,115,22,0.1)", color: "#f97316" }}>👥 Group</span>}
                      </div>
                    </div>
                    {ev.invitees?.length > 0 && !isBusy && (
                      <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
                        {ev.invitees.map(id => { const f = allFriends.find(fr => fr.id === id); return <div key={id} style={{ width: 18, height: 18, borderRadius: "50%", background: f?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{f?.avatar}</div>; })}
                        <RsvpSummary eventId={ev.id} rsvps={rsvps} />
                      </div>
                    )}
                    {canRsvp && <RsvpButtons eventId={ev.id} rsvps={rsvps} onRsvp={setRsvp} />}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              {showEventForm ? (
                <div>
                  <input placeholder="Event title..." value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 13px", color: "#f0ece4", fontSize: 15, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                    <select value={newEvent.privacy} onChange={e => setNewEvent(p => ({ ...p, privacy: e.target.value }))} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 11px", color: "#f0ece4", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                      {PRIVACY.map(p => <option key={p} value={p} style={{ background: "#1a1a24" }}>{p}</option>)}
                    </select>
                    <button className="btn" onClick={() => setNewEvent(p => ({ ...p, groupEvent: !p.groupEvent }))} style={{ padding: "8px 11px", borderRadius: 9, fontSize: 13, background: newEvent.groupEvent ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)", color: newEvent.groupEvent ? "#f97316" : "#777", border: "1px solid " + (newEvent.groupEvent ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.1)"), fontFamily: "'DM Sans', sans-serif" }}>👥 Group</button>
                  </div>
                  {newEvent.groupEvent && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Invite:</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {allFriends.slice(1).map(f => { const inv = newEvent.invitees.includes(f.id); return <button key={f.id} className="btn" onClick={() => setNewEvent(p => ({ ...p, invitees: inv ? p.invitees.filter(id => id !== f.id) : [...p.invitees, f.id] }))} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: inv ? `${f.color}30` : "rgba(255,255,255,0.05)", color: inv ? f.color : "#777", border: "1px solid " + (inv ? f.color : "rgba(255,255,255,0.1)") }}>{f.name}</button>; })}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 7 }}>
                    <button className="btn" onClick={() => setShowEventForm(false)} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(255,255,255,0.05)", color: "#777", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Cancel</button>
                    <button className="btn" onClick={addEvent} style={{ flex: 2, padding: "10px", borderRadius: 9, background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>Add Event ✓</button>
                  </div>
                </div>
              ) : (
                <button className="btn" onClick={() => setShowEventForm(true)} style={{ width: "100%", padding: "13px", borderRadius: 11, background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>+ Add Event</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
