// src/App.jsx — QualyLeads Dashboard v3 (with Clients tab)
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

const G = "#16a34a";
const G2 = "#15803d";
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

const CLIENT_STATUS = {
  active:      { label:"Active",      bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  onboarding:  { label:"Onboarding",  bg:"#fffbeb", color:"#b45309", border:"#fde68a" },
  paused:      { label:"Paused",      bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" },
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

function ClientStatusBadge({ status }) {
  const c = CLIENT_STATUS[status] || CLIENT_STATUS.onboarding;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:9999, fontSize:11, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {c.label}
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

// ── Clients Tab ───────────────────────────────────────────────────────────────
function ClientsView({ leads }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending:false });
      setClients(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Calculate stats per client from leads
  function getClientStats(clientId) {
    const clientLeads = leads.filter(l => l.client_id === clientId);
    const booked = clientLeads.filter(l => l.status === "booked").length;
    const replied = clientLeads.filter(l => l.status === "replied").length;
    const rate = clientLeads.length ? Math.round((booked / clientLeads.length) * 100) : 0;
    return { total: clientLeads.length, booked, replied, rate };
  }

  if (loading) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:MUTED }}>Loading clients...</div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:32 }}>
      <div style={{ marginBottom:28, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.03em", marginBottom:4 }}>Clients</h1>
          <div style={{ fontSize:13, color:MUTED }}>{clients.length} client{clients.length !== 1 ? "s" : ""} on QualyLeads</div>
        </div>
        <a href="/onboarding" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 16px", background:G, color:"#fff", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" }}>
          + Onboard new client
        </a>
      </div>

      {/* Summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
        <StatCard label="Total clients" value={clients.length} sub="All time" />
        <StatCard label="Active" value={clients.filter(c=>c.status==="active").length} sub="Paying clients" accent={G} />
        <StatCard label="Total leads" value={leads.length} sub="Across all clients" />
        <StatCard label="Total booked" value={leads.filter(l=>l.status==="booked").length} sub="Appointments confirmed" accent={G} />
      </div>

      {clients.length === 0 ? (
        <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:48, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🏢</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No clients yet</div>
          <div style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Onboard your first client to get started.</div>
          <a href="/onboarding" style={{ display:"inline-flex", padding:"10px 20px", background:G, color:"#fff", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" }}>
            Onboard first client →
          </a>
        </div>
      ) : (
        <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px", gap:16, padding:"12px 20px", background:SURF, borderBottom:`1px solid ${BORDER}` }}>
            {["Client","Industry","Status","Leads","Booked","Conversion",""].map((h,i) => (
              <div key={i} style={{ fontSize:11, fontWeight:600, color:MUTED, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
            ))}
          </div>

          {clients.map((client, i) => {
            const stats = getClientStats(client.id);
            return (
              <div key={client.id}
                onClick={() => setSelected(selected?.id === client.id ? null : client)}
                style={{
                  display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px",
                  gap:16, padding:"16px 20px", cursor:"pointer",
                  borderBottom: i < clients.length-1 ? `1px solid ${BORDER}` : "none",
                  background: selected?.id === client.id ? SURF : BG,
                  transition:"background 0.1s",
                }}
                onMouseEnter={e=>{ if(selected?.id!==client.id) e.currentTarget.style.background=SURF; }}
                onMouseLeave={e=>{ if(selected?.id!==client.id) e.currentTarget.style.background=BG; }}
              >
                {/* Client name */}
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <Avatar name={client.business_name} size={34} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{client.business_name}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{client.owner_name}</div>
                  </div>
                </div>
                {/* Industry */}
                <div style={{ display:"flex", alignItems:"center" }}>
                  <IndustryBadge industry={client.industry} />
                </div>
                {/* Status */}
                <div style={{ display:"flex", alignItems:"center" }}>
                  <ClientStatusBadge status={client.status} />
                </div>
                {/* Stats */}
                <div style={{ display:"flex", alignItems:"center", fontWeight:600, fontSize:14 }}>{stats.total}</div>
                <div style={{ display:"flex", alignItems:"center", fontWeight:600, fontSize:14, color:G }}>{stats.booked}</div>
                <div style={{ display:"flex", alignItems:"center", fontWeight:600, fontSize:14, color:stats.rate>20?G:TEXT }}>{stats.rate}%</div>
                {/* Actions */}
                <div style={{ display:"flex", alignItems:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED2} strokeWidth="2">
                    <path d={selected?.id === client.id ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded client detail */}
      {selected && (
        <div style={{ marginTop:16, background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Avatar name={selected.business_name} size={44} />
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{selected.business_name}</div>
                <div style={{ fontSize:13, color:MUTED }}>{selected.email} · {selected.phone}</div>
              </div>
            </div>
            <ClientStatusBadge status={selected.status} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
            {[
              { label:"Owner", value: selected.owner_name || "—" },
              { label:"Industry", value: selected.industry || "—" },
              { label:"Calendly", value: selected.calendly_url ? "Connected ✅" : "Not set" },
            ].map((item,i) => (
              <div key={i} style={{ background:SURF, borderRadius:8, padding:"12px 16px" }}>
                <div style={{ fontSize:11, color:MUTED, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Client's webhook URL */}
          <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:8, padding:"12px 16px" }}>
            <div style={{ fontSize:11, color:MUTED, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Webhook URL</div>
            <code style={{ fontSize:12, color:TEXT }}>
              {`${import.meta.env.VITE_BACKEND_URL || "https://web-production-7ffda.up.railway.app"}/zapier/lead`}
            </code>
          </div>

          {/* Recent leads for this client */}
          {leads.filter(l => l.client_id === selected.id).length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Recent leads</div>
              {leads.filter(l => l.client_id === selected.id).slice(0,5).map((lead, i, arr) => (
                <div key={lead.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < arr.length-1 ? `1px solid ${BORDER}` : "none" }}>
                  <Avatar name={lead.name} size={28} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{lead.name}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{lead.phone}</div>
                  </div>
                  <StatusBadge status={lead.status} />
                  <div style={{ fontSize:11, color:MUTED2 }}>{new Date(lead.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App({ session, isAdmin = true, subscription }) {
  const [view, setView]             = useState("leads"); // leads | clients
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
      let query = supabase.from("leads").select("*").order("created_at", { ascending:false });

      // Non-admin clients only see their own leads via client_id
      if (!isAdmin && subscription?.id) {
        // Find the client record linked to this subscriber
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("email", session?.user?.email)
          .single();
        if (clientData?.id) {
          query = query.eq("client_id", clientData.id);
        }
      }

      const { data } = await query;
      setLeads(data || []);
      setLoading(false);
    }
    load();
    const ch = supabase.channel("leads-rt")
      .on("postgres_changes", { event:"*", schema:"public", table:"leads" }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [isAdmin, subscription]);

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
    { key:"all",          label:"All",       count: leads.length },
    { key:"contacted",    label:"Contacted", count: leads.filter(l=>l.status==="contacted").length },
    { key:"replied",      label:"Replied",   count: replied },
    { key:"booked",       label:"Booked",    count: booked },
    { key:"unresponsive", label:"No reply",  count: leads.filter(l=>l.status==="unresponsive").length },
  ];

  const navBtn = (key, icon, label) => (
    <button onClick={()=>{ setView(key); setSelectedId(null); }} style={{
      width:"100%", display:"flex", alignItems:"center", gap:8,
      padding:"8px 10px", borderRadius:7, border:"none", cursor:"pointer",
      background: view===key ? SURF2 : "transparent",
      color: view===key ? TEXT : MUTED,
      fontFamily:"inherit", fontSize:13, fontWeight: view===key ? 600 : 400,
      marginBottom:2,
    }}>
      <span style={{ fontSize:15 }}>{icon}</span> {label}
    </button>
  );

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
              <div style={{ fontSize:11, color:MUTED }}>{isAdmin ? "Admin dashboard" : "Your dashboard"}</div>
            </div>
          </div>

          {/* Nav tabs */}
          <div>
            {navBtn("leads", "💬", "Leads")}
            {isAdmin && navBtn("clients", "🏢", "Clients")}
          </div>
        </div>

        {/* Lead filters — only show on leads view */}
        {view === "leads" && (
          <>
            <div style={{ padding:"12px 12px 4px" }}>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:MUTED2 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads..." style={{ width:"100%", height:34, background:SURF, border:`1px solid ${BORDER}`, borderRadius:8, paddingLeft:30, paddingRight:12, color:TEXT, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>

            <div style={{ padding:"8px 12px 4px" }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={()=>setFilter(f.key)} style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer",
                  background: filter===f.key ? SURF2 : "transparent",
                  color: filter===f.key ? TEXT : MUTED,
                  fontFamily:"inherit", fontSize:13, fontWeight: filter===f.key ? 500 : 400,
                  marginBottom:2,
                }}>
                  <span>{f.label}</span>
                  {f.count > 0 && <span style={{ fontSize:11, fontWeight:600, background: filter===f.key ? BORDER : "transparent", color:MUTED, padding:"1px 7px", borderRadius:9999 }}>{f.count}</span>}
                </button>
              ))}
            </div>

            <div style={{ height:1, background:BORDER, margin:"4px 12px 4px" }} />

            {/* Lead list */}
            <div style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
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
                <div style={{ padding:24, textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>🎯</div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>No leads yet</div>
                  <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Leads will appear here once they come in.</div>
                </div>
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
                      <StatusBadge status={lead.status} />
                      <div style={{ fontSize:11, color:MUTED2, marginTop:4 }}>
                        {new Date(lead.created_at).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Clients view — no lead list in sidebar */}
        {view === "clients" && <div style={{ flex:1 }} />}

        {/* Bottom user bar */}
        <div style={{ padding:12, borderTop:`1px solid ${BORDER}` }}>
          {isAdmin && view === "leads" && (
            <a href="/onboarding" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, height:34, background:G, color:"#fff", borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none", marginBottom:8 }}>
              + Onboard new client
            </a>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 4px" }}>
            <div style={{ fontSize:12, color:MUTED, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>
              {session?.user?.email}
            </div>
            <button onClick={signOut} style={{ fontSize:11, color:MUTED, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Clients view */}
        {view === "clients" && isAdmin && (
          <ClientsView leads={leads} />
        )}

        {/* Leads view */}
        {view === "leads" && (
          !selected ? (
            <div style={{ flex:1, overflowY:"auto", padding:32 }}>
              <div style={{ marginBottom:28 }}>
                <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.03em", marginBottom:4 }}>Overview</h1>
                <div style={{ fontSize:13, color:MUTED }}>Your QualyLeads performance at a glance.</div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
                <StatCard label="Total leads" value={leads.length} sub={leads.length===0?"Waiting for first lead":"All time"} />
                <StatCard label="Booked" value={booked} sub={booked===0?"None yet":"Appointments confirmed"} accent={G} />
                <StatCard label="Replied" value={replied} sub="Engaged with Qualy" />
                <StatCard label="Conversion" value={`${rate}%`} sub="Leads → bookings" accent={rate>20?G:undefined} />
              </div>

              {leads.length > 0 ? (
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
              ) : (
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
                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 8px" }}>
                  <div style={{ flex:1, height:1, background:BORDER }} />
                  <span style={{ fontSize:11, color:MUTED2, whiteSpace:"nowrap", background:SURF, padding:"0 8px" }}>
                    {new Date(selected.created_at).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" })}
                  </span>
                  <div style={{ flex:1, height:1, background:BORDER }} />
                </div>

                {msgLoading ? (
                  [1,2,3].map(i => (
                    <div key={i} style={{ display:"flex", justifyContent:i%2===0?"flex-end":"flex-start" }}>
                      <div style={{ width:200, height:40, background:SURF2, borderRadius:12 }} />
                    </div>
                  ))
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
          )
        )}
      </div>
    </div>
  );
}
