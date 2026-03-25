// src/App.jsx — QualyLeads Dashboard v2
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const G = "#16a34a";   // green accent
const G2 = "#15803d";  // dark green
const BG = "#ffffff";
const SURF = "#f8fafc";
const SURF2 = "#f1f5f9";
const BORDER = "#e2e8f0";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const MUTED2 = "#94a3b8";

const STATUS_CONFIG = {
  contacted:    { label:"Contacted",  dot:"#3b82f6", bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  replied:      { label:"Replied",    dot:"#f59e0b", bg:"#fffbeb", color:"#b45309", border:"#fde68a" },
  booked:       { label:"Booked",     dot:"#16a34a", bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  unresponsive: { label:"No reply",   dot:"#94a3b8", bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" },
};

const INDUSTRY_CONFIG = {
  gym:     { label:"Gym",     icon:"🏋️", bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  plumber: { label:"Plumber", icon:"🔧", bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  agency:  { label:"Agency",  icon:"📈", bg:"#faf5ff", color:"#7e22ce", border:"#e9d5ff" },
  coach:   { label:"Coach",   icon:"🧑‍💼", bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
  general: { label:"General", icon:"🏢", bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.contacted;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 8px", borderRadius:9999, fontSize:11, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, flexShrink:0 }} />
      {c.label}
    </span>
  );
}

function IndustryBadge({ industry }) {
  const c = INDUSTRY_CONFIG[industry?.toLowerCase()] || INDUSTRY_CONFIG.general;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:9999, fontSize:11, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {c.icon} {c.label}
    </span>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "?";
  const colors = ["#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];
  const color = colors[name?.charCodeAt(0) % colors.length] || G;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:600, color:"#fff", flexShrink:0 }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:"20px 24px" }}>
      <div style={{ fontSize:12, color:MUTED, marginBottom:8, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:accent||TEXT, letterSpacing:"-0.03em", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:MUTED, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ filter }) {
  const msgs = {
    all:          { icon:"🎯", title:"No leads yet", body:"Once leads come in via your webhook, they'll appear here." },
    booked:       { icon:"📅", title:"No bookings yet", body:"Leads that book appointments will show up here." },
    replied:      { icon:"💬", title:"No replies yet", body:"Leads that reply to Qualy's messages will appear here." },
    contacted:    { icon:"📤", title:"No contacted leads", body:"Leads that have been texted will show here." },
    unresponsive: { icon:"🔇", title:"No unresponsive leads", body:"Leads that didn't reply will appear here." },
  };
  const m = msgs[filter] || msgs.all;
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:40, textAlign:"center" }}>
      <div style={{ fontSize:40 }}>{m.icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>{m.title}</div>
      <div style={{ fontSize:13, color:MUTED, maxWidth:260, lineHeight:1.6 }}>{m.body}</div>
    </div>
  );
}

export default function App() {
  const [leads, setLeads]           = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [draft, setDraft]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending]       = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending:false });
      setLeads(data || []);
      setLoading(false);
    }
    load();
    const ch = supabase.channel("leads-rt")
      .on("postgres_changes", { event:"*", schema:"public", table:"leads" }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    async function load() {
      setMsgLoading(true);
      const { data } = await supabase.from("messages").select("*").eq("lead_id", selectedId).order("created_at", { ascending:true });
      setMessages(data || []);
      setMsgLoading(false);
    }
    load();
    const ch = supabase.channel(`msg-${selectedId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`lead_id=eq.${selectedId}` },
        p => setMessages(prev => [...prev, p.new]))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [selectedId]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  async function updateStatus(id, status) {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function sendMessage() {
    if (!draft.trim() || !selectedId || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);
    setMessages(prev => [...prev, { id:"tmp-"+Date.now(), lead_id:selectedId, role:"assistant", content, created_at:new Date().toISOString() }]);
    await supabase.from("messages").insert({ lead_id:selectedId, role:"assistant", content });
    setSending(false);
  }

  const filtered = leads.filter(l => {
    const fOk = filter === "all" || l.status === filter;
    const sOk = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.industry?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search);
    return fOk && sOk;
  });

  const selected = leads.find(l => l.id === selectedId);
  const booked   = leads.filter(l => l.status === "booked").length;
  const replied  = leads.filter(l => l.status === "replied").length;
  const rate     = leads.length ? Math.round((booked / leads.length) * 100) : 0;

  const FILTERS = [
    { key:"all",          label:"All",        count: leads.length },
    { key:"contacted",    label:"Contacted",  count: leads.filter(l=>l.status==="contacted").length },
    { key:"replied",      label:"Replied",    count: replied },
    { key:"booked",       label:"Booked",     count: booked },
    { key:"unresponsive", label:"No reply",   count: leads.filter(l=>l.status==="unresponsive").length },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:SURF, fontFamily:"'Geist','Inter',system-ui,sans-serif", fontSize:13, color:TEXT, overflow:"hidden" }}>

      {/* ══ SIDEBAR ══ */}
      <div style={{ width:280, background:BG, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0 }}>

        {/* Brand */}
        <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:G, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" fill="white" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.02em" }}>QualyLeads</div>
              <div style={{ fontSize:11, color:MUTED }}>Sales dashboard</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position:"relative" }}>
            <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:MUTED2 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads..." style={{ width:"100%", height:34, background:SURF, border:`1px solid ${BORDER}`, borderRadius:8, paddingLeft:30, paddingRight:12, color:TEXT, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ padding:"12px 12px 8px" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer",
              background: filter===f.key ? SURF2 : "transparent",
              color: filter===f.key ? TEXT : MUTED,
              fontFamily:"inherit", fontSize:13, fontWeight: filter===f.key ? 500 : 400,
              marginBottom:2, transition:"all 0.1s",
            }}>
              <span>{f.label}</span>
              {f.count > 0 && (
                <span style={{ fontSize:11, fontWeight:600, background: filter===f.key ? BORDER : "transparent", color:MUTED, padding:"1px 7px", borderRadius:9999 }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ height:1, background:BORDER, margin:"0 12px" }} />

        {/* Lead list */}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
          {loading ? (
            Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:SURF2, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ height:12, background:SURF2, borderRadius:4, marginBottom:6, width:"70%" }} />
                  <div style={{ height:10, background:SURF2, borderRadius:4, width:"50%" }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            filtered.map(lead => (
              <div key={lead.id} onClick={()=>setSelectedId(lead.id)} style={{
                padding:"10px 16px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start",
                background: lead.id===selectedId ? SURF2 : "transparent",
                borderLeft:`3px solid ${lead.id===selectedId ? G : "transparent"}`,
                transition:"all 0.1s",
              }}>
                <Avatar name={lead.name} size={36} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lead.name}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div style={{ fontSize:11, color:MUTED2, marginTop:4 }}>
                    {new Date(lead.created_at).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Onboard CTA */}
        <div style={{ padding:12, borderTop:`1px solid ${BORDER}` }}>
          <a href="/onboarding" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, height:34, background:G, color:"#fff", borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none" }}>
            + Onboard new client
          </a>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {!selected ? (
          /* ── Overview when nothing selected ── */
          <div style={{ flex:1, overflowY:"auto", padding:32 }}>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.03em", marginBottom:4 }}>Overview</h1>
              <div style={{ fontSize:13, color:MUTED }}>Your QualyLeads performance at a glance.</div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
              <StatCard label="Total leads" value={leads.length} sub={leads.length===0?"Waiting for first lead":"All time"} />
              <StatCard label="Booked" value={booked} sub={booked===0?"None yet":"Appointments confirmed"} accent={G} />
              <StatCard label="Replied" value={replied} sub="Engaged with Qualy" />
              <StatCard label="Conversion" value={`${rate}%`} sub="Leads → bookings" accent={rate>20?G:undefined} />
            </div>

            {/* Recent leads */}
            {leads.length > 0 && (
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Recent leads</div>
                <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
                  {leads.slice(0,8).map((lead, i) => (
                    <div key={lead.id} onClick={()=>setSelectedId(lead.id)} style={{
                      display:"flex", alignItems:"center", gap:12, padding:"14px 20px", cursor:"pointer",
                      borderBottom: i < Math.min(leads.length,8)-1 ? `1px solid ${BORDER}` : "none",
                      transition:"background 0.1s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=SURF}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <Avatar name={lead.name} size={36} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, marginBottom:2 }}>{lead.name}</div>
                        <div style={{ fontSize:12, color:MUTED }}>{lead.phone}</div>
                      </div>
                      <IndustryBadge industry={lead.industry} />
                      <StatusBadge status={lead.status} />
                      <div style={{ fontSize:11, color:MUTED2, whiteSpace:"nowrap" }}>
                        {new Date(lead.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED2} strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leads.length === 0 && (
              <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:48, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:16 }}>⚡</div>
                <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Ready to receive leads</div>
                <div style={{ fontSize:13, color:MUTED, maxWidth:360, margin:"0 auto 24px", lineHeight:1.7 }}>
                  Connect your form tool or Zapier to your webhook URL and leads will start appearing here in real time.
                </div>
                <a href="/onboarding" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", background:G, color:"#fff", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  Set up your first client →
                </a>
              </div>
            )}
          </div>
        ) : (
          /* ── Conversation view ── */
          <>
            {/* Header */}
            <div style={{ background:BG, borderBottom:`1px solid ${BORDER}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <button onClick={()=>setSelectedId(null)} style={{ width:32, height:32, borderRadius:7, border:`1px solid ${BORDER}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <Avatar name={selected.name} size={36} />
                <div>
                  <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.01em" }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:MUTED, display:"flex", gap:6, alignItems:"center" }}>
                    {selected.phone}
                    <IndustryBadge industry={selected.industry} />
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <StatusBadge status={selected.status} />
                <select value={selected.status} onChange={e=>updateStatus(selected.id, e.target.value)} style={{ height:32, background:BG, border:`1px solid ${BORDER}`, borderRadius:7, padding:"0 10px", color:MUTED, fontSize:12, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                  {Object.entries(STATUS_CONFIG).map(([v,{label}]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ background:BG, borderBottom:`1px solid ${BORDER}`, display:"flex", padding:"0 24px", flexShrink:0 }}>
              {[
                { label:"Total leads", value:leads.length },
                { label:"Booked", value:booked, green:true },
                { label:"Replied", value:replied },
                { label:"Conversion", value:`${rate}%`, green:rate>20 },
              ].map((s,i) => (
                <div key={i} style={{ padding:"12px 20px 12px 0", marginRight:20, borderRight:i<3?`1px solid ${BORDER}`:"none", paddingRight:20 }}>
                  <div style={{ fontSize:10, color:MUTED2, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:s.green?G:TEXT, letterSpacing:"-0.02em" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:24, display:"flex", flexDirection:"column", gap:10, background:SURF }}>
              {/* Date divider */}
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 8px" }}>
                <div style={{ flex:1, height:1, background:BORDER }} />
                <span style={{ fontSize:11, color:MUTED2, whiteSpace:"nowrap", background:SURF, padding:"0 8px" }}>
                  {new Date(selected.created_at).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" })}
                </span>
                <div style={{ flex:1, height:1, background:BORDER }} />
              </div>

              {msgLoading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display:"flex", justifyContent:i%2===0?"flex-end":"flex-start" }}>
                      <div style={{ width:200, height:40, background:SURF2, borderRadius:12 }} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign:"center", color:MUTED2, fontSize:13, padding:20 }}>No messages yet.</div>
              ) : (
                messages.map(m => {
                  const isAI = m.role === "assistant";
                  const time = new Date(m.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
                  return (
                    <div key={m.id} style={{ display:"flex", justifyContent:isAI?"flex-start":"flex-end" }}>
                      <div>
                        <div style={{
                          maxWidth:400, padding:"10px 14px", fontSize:13, lineHeight:1.6,
                          borderRadius:14,
                          borderBottomLeftRadius:  isAI ? 3 : 14,
                          borderBottomRightRadius: isAI ? 14 : 3,
                          background: isAI ? BG : G,
                          color:      isAI ? TEXT : "#fff",
                          border:     isAI ? `1px solid ${BORDER}` : "none",
                          boxShadow:  isAI ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                        }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize:10, color:MUTED2, marginTop:3, textAlign:isAI?"left":"right" }}>{isAI?"Qualy":"Lead"} · {time}</div>
                      </div>
                    </div>
                  );
                })
              )}

              {selected.status === "booked" && (
                <div style={{ alignSelf:"center", display:"inline-flex", alignItems:"center", gap:6, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9999, padding:"6px 16px", fontSize:12, color:G2, fontWeight:600, marginTop:8 }}>
                  ✅ Appointment booked
                </div>
              )}
            </div>

            {/* Message input */}
            <div style={{ background:BG, borderTop:`1px solid ${BORDER}`, padding:16, display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
              <div style={{ flex:1, background:SURF, border:`1px solid ${BORDER}`, borderRadius:10, display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED2} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <input
                  value={draft}
                  onChange={e=>setDraft(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
                  placeholder="Send a manual message..."
                  style={{ flex:1, height:40, background:"transparent", border:"none", color:TEXT, fontSize:13, fontFamily:"inherit", outline:"none" }}
                />
              </div>
              <button onClick={sendMessage} disabled={!draft.trim()||sending} style={{
                height:40, padding:"0 20px", background:draft.trim()?G:"#e2e8f0", color:draft.trim()?"#fff":MUTED2,
                border:"none", borderRadius:10, fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:draft.trim()?"pointer":"default",
                transition:"all 0.15s", display:"flex", alignItems:"center", gap:6,
              }}>
                {sending ? "..." : "Send"}
                {!sending && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
