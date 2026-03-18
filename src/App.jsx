// src/App.jsx — QualyLeads Dashboard (light mode)
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── shadcn/ui light tokens ───────────────────────────────────────────────────
const T = {
  bg:          "#ffffff",
  bgMuted:     "#fafafa",
  bgHover:     "#f4f4f5",
  bgInput:     "#ffffff",
  border:      "#e4e4e7",
  borderFocus: "#a1a1aa",
  ring:        "rgba(0,0,0,0.04)",
  text:        "#09090b",
  textMuted:   "#71717a",
  textSubtle:  "#a1a1aa",
  accent:      "#18181b",   // near-black — primary action colour
  accentFg:    "#ffffff",
  success:     "#16a34a",
  successBg:   "#f0fdf4",
  successBorder:"#bbf7d0",
};

const STATUS = {
  contacted:    { label: "Contacted",  color: "#3b82f6" },
  replied:      { label: "Replied",    color: "#f59e0b" },
  booked:       { label: "Booked",     color: "#22c55e" },
  unresponsive: { label: "No reply",   color: "#d4d4d8" },
};

const INDUSTRY_STYLE = {
  gym:     { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  plumber: { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  agency:  { bg:"#faf5ff", color:"#7e22ce", border:"#e9d5ff" },
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Badge({ industry }) {
  const s = INDUSTRY_STYLE[industry?.toLowerCase()] || { bg:"#f4f4f5", color:"#52525b", border:"#e4e4e7" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"1px 8px", borderRadius:9999, fontSize:10, fontWeight:500, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {industry}
    </span>
  );
}

function StatusDot({ status }) {
  return <span style={{ width:6, height:6, borderRadius:"50%", background:STATUS[status]?.color||T.textSubtle, display:"inline-block", flexShrink:0 }} />;
}

function StatCard({ label, value, green, last }) {
  return (
    <div style={{ background:T.bgMuted, padding:"14px 18px", borderRight: last?"none":`1px solid ${T.border}` }}>
      <div style={{ fontSize:11, color:T.textMuted, marginBottom:5, letterSpacing:"0.03em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:600, color:green?T.success:T.text, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isAI = message.role === "assistant";
  const time = new Date(message.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
  return (
    <div style={{ display:"flex", justifyContent: isAI?"flex-start":"flex-end" }}>
      <div>
        <div style={{
          maxWidth: 380, padding:"9px 13px", fontSize:13, lineHeight:1.55,
          borderRadius: 12,
          borderBottomLeftRadius:  isAI ? 3 : 12,
          borderBottomRightRadius: isAI ? 12 : 3,
          background: isAI ? T.bgHover : T.accent,
          color:      isAI ? T.text    : T.accentFg,
          border:     isAI ? `1px solid ${T.border}` : "none",
          fontWeight: isAI ? 400 : 500,
        }}>
          {message.content}
        </div>
        <div style={{ fontSize:10, color:T.textSubtle, marginTop:3, textAlign: isAI?"left":"right", fontVariantNumeric:"tabular-nums" }}>
          {time}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [leads, setLeads]         = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [draft, setDraft]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending:false });
      if (!error) setLeads(data || []);
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
      const { data, error } = await supabase.from("messages").select("*").eq("lead_id", selectedId).order("created_at", { ascending:true });
      if (!error) setMessages(data || []);
      setMsgLoading(false);
    }
    load();
    const ch = supabase.channel(`msg-${selectedId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`lead_id=eq.${selectedId}` },
        (p) => setMessages(prev => [...prev, p.new]))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [selectedId]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  async function updateStatus(id, status) {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function sendMessage() {
    if (!draft.trim() || !selectedId) return;
    const content = draft.trim();
    setDraft("");
    setMessages(prev => [...prev, { id:"tmp-"+Date.now(), lead_id:selectedId, role:"assistant", content, created_at:new Date().toISOString() }]);
    await supabase.from("messages").insert({ lead_id:selectedId, role:"assistant", content });
  }

  const filtered = leads.filter(l => {
    const fOk = filter === "all" || l.status === filter;
    const sOk = l.name.toLowerCase().includes(search.toLowerCase()) || l.industry?.toLowerCase().includes(search.toLowerCase());
    return fOk && sOk;
  });

  const selected = leads.find(l => l.id === selectedId);
  const booked   = leads.filter(l => l.status === "booked").length;
  const engaged  = leads.filter(l => ["replied","booked"].includes(l.status)).length;
  const rate     = leads.length ? Math.round((booked / leads.length) * 100) : 0;

  const inputSx = {
    height:36, background:T.bgInput, border:`1px solid ${T.border}`,
    borderRadius:6, padding:"0 12px", color:T.text,
    fontSize:13, fontFamily:"inherit", outline:"none",
  };

  const filterLabels = { all:"All", contacted:"Contacted", replied:"Replied", booked:"Booked", unresponsive:"No reply" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", height:"100vh", background:T.bg, fontFamily:"'Geist','Inter',system-ui,sans-serif", fontSize:13, color:T.text }}>

      {/* ── Sidebar ── */}
      <div style={{ background:T.bgMuted, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Logo + search */}
        <div style={{ padding:"16px 16px 14px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ width:26, height:26, borderRadius:6, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.accentFg, flexShrink:0 }}>Q</div>
            <span style={{ fontSize:14, fontWeight:600, letterSpacing:"-0.02em" }}>QualyLeads</span>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ ...inputSx, width:"100%", height:32, fontSize:12 }} />
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:4, padding:"10px 12px 6px", flexWrap:"wrap" }}>
          {["all","contacted","replied","booked","unresponsive"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"3px 10px", borderRadius:9999, cursor:"pointer",
              border:`1px solid ${filter===f ? T.border : "transparent"}`,
              background: filter===f ? T.bg : "transparent",
              color: filter===f ? T.text : T.textMuted,
              fontSize:11, fontWeight: filter===f ? 500 : 400,
              fontFamily:"inherit",
              boxShadow: filter===f ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}>
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {/* Lead list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading
            ? <div style={{ padding:"20px 12px", color:T.textSubtle, fontSize:12 }}>Loading...</div>
            : filtered.length === 0
            ? <div style={{ padding:"20px 12px", color:T.textSubtle, fontSize:12 }}>No leads found</div>
            : filtered.map(lead => (
              <div key={lead.id} onClick={() => setSelectedId(lead.id)} style={{
                padding:"10px 12px", cursor:"pointer",
                borderLeft:`2px solid ${lead.id===selectedId ? T.accent : "transparent"}`,
                background: lead.id===selectedId ? T.bg : "transparent",
                transition:"background 0.1s",
              }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{lead.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                  <StatusDot status={lead.status} />
                  <span style={{ fontSize:11, color:T.textMuted }}>{STATUS[lead.status]?.label}</span>
                  <Badge industry={lead.industry} />
                </div>
                <div style={{ fontSize:11, color:T.textSubtle }}>
                  {new Date(lead.created_at).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:T.bg }}>
        {!selected ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, color:T.textSubtle }}>
            <div style={{ width:44, height:44, borderRadius:10, background:T.bgHover, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💬</div>
            <span style={{ fontSize:13 }}>Select a lead to view conversation</span>
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div style={{ height:56, padding:"0 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600, letterSpacing:"-0.01em" }}>{selected.name}</div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:1 }}>{selected.phone} · {messages.length} messages</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Badge industry={selected.industry} />
                <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)} style={{ height:30, background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, padding:"0 8px", color:T.textMuted, fontSize:12, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                  {Object.entries(STATUS).map(([v,{label}]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <StatCard label="Total leads" value={leads.length} />
              <StatCard label="Booked"      value={booked}   green />
              <StatCard label="Engaged"     value={engaged} />
              <StatCard label="Conversion"  value={`${rate}%`} last />
            </div>

            {/* Chat */}
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
                <div style={{ flex:1, height:1, background:T.border }} />
                <span style={{ fontSize:10, color:T.textSubtle, whiteSpace:"nowrap" }}>
                  {new Date(selected.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
                </span>
                <div style={{ flex:1, height:1, background:T.border }} />
              </div>

              {msgLoading
                ? <div style={{ color:T.textSubtle, fontSize:12 }}>Loading messages...</div>
                : messages.length === 0
                ? <div style={{ color:T.textSubtle, fontSize:12 }}>No messages yet.</div>
                : messages.map(m => <ChatBubble key={m.id} message={m} />)
              }

              {selected.status === "booked" && (
                <div style={{ alignSelf:"center", display:"inline-flex", alignItems:"center", gap:6, background:T.successBg, border:`1px solid ${T.successBorder}`, borderRadius:9999, padding:"5px 14px", fontSize:11, color:T.success, fontWeight:500 }}>
                  ✓ Appointment booked
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding:"14px 16px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexShrink:0 }}>
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="Send a manual message..." style={{ ...inputSx, flex:1 }} />
              <button onClick={sendMessage} style={{ height:36, padding:"0 16px", background:T.accent, color:T.accentFg, border:"none", borderRadius:6, fontSize:13, fontWeight:500, fontFamily:"inherit", cursor:"pointer" }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
