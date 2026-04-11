import { useState } from "react";
import { supabase } from "./supabaseClient";

const ACCENT = "#16a34a";
const BG = "#ffffff";
const SURFACE = "#f9fafb";
const BORDER = "#e4e4e7";
const TEXT = "#09090b";
const MUTED = "#71717a";

const INDUSTRIES = [
  { value: "gym", label: "🏋️ Gym / Fitness" },
  { value: "plumber", label: "🔧 Plumber / Home Services" },
  { value: "agency", label: "📈 Marketing Agency" },
  { value: "coach", label: "🧑‍💼 Coach / Creator" },
  { value: "hvac", label: "🌡️ HVAC / Heating & Cooling" },
  { value: "solar", label: "☀️ Solar / Renewable Energy" },
  { value: "general", label: "🏢 Other Business" },
];

const LANGUAGES = [
  { value: "en", label: "🇺🇸 English (US)" },
  { value: "nl", label: "🇳🇱 Nederlands (NL)" },
];

const BOOKING_TOOLS = [
  { value: "calendly", label: "Calendly" },
  { value: "google", label: "Google Calendar" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { num: 1, title: "Business details" },
  { num: 2, title: "Contact & booking" },
  { num: 3, title: "Your webhook URL" },
  { num: 4, title: "Send a test lead" },
];

const inp = {
  width: "100%",
  height: 44,
  background: BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: "0 14px",
  color: TEXT,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  marginTop: 6,
  boxSizing: "border-box",
};

const lbl = { fontSize: 13, fontWeight: 500, color: TEXT, display: "block" };

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("en");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2
  const [phone, setPhone] = useState("");
  const [bookingTool, setBookingTool] = useState("calendly");
  const [bookingUrl, setBookingUrl] = useState("");

  // Step 4
  const [testPhone, setTestPhone] = useState("");
  const [clientId, setClientId] = useState(null);

  const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://web-production-7ffda.up.railway.app";
  const webhookUrl = clientId
    ? `${BACKEND}/zapier/lead?client=${clientId}`
    : `${BACKEND}/zapier/lead`;

  const bookingPlaceholder =
    bookingTool === "calendly"
      ? "https://calendly.com/yourname/demo"
      : bookingTool === "google"
      ? "https://calendar.google.com/calendar/appointments/..."
      : "https://your-booking-link.com";

  function step1Next() {
    if (!businessName || !industry || !ownerName || !email) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setStep(2);
  }

  function step2Next() {
    if (!phone) {
      setError("Phone number is required.");
      return;
    }
    setError("");
    setStep(3);
  }

  async function sendTestLead() {
    if (!testPhone) {
      setError("Please enter a phone number to test.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .insert({
          business_name: businessName,
          industry,
          language,
          owner_name: ownerName,
          email,
          phone,
          booking_url: bookingUrl || null,
          status: "active",
        })
        .select("id")
        .single();

      if (clientErr) throw new Error(clientErr.message);

      const newClientId = clientData.id;
      setClientId(newClientId);

      const res = await fetch(`${BACKEND}/zapier/lead?client=${newClientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ownerName, phone: testPhone, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDone(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ minHeight:"100vh", background:SURFACE, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Geist','Inter',sans-serif" }}>
      <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:40, maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:600, marginBottom:8 }}>You're all set!</h2>
        <p style={{ fontSize:14, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
          <strong>{businessName}</strong> is now live on QualyLeads. Every new lead will be texted within 10 seconds.
        </p>
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:16, marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:13, fontWeight:600, color:ACCENT, marginBottom:8 }}>Your webhook URL:</div>
          <code style={{ fontSize:12, wordBreak:"break-all" }}>{webhookUrl}</code>
        </div>
        <div style={{ fontSize:13, color:MUTED }}>Redirecting you to your dashboard...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:SURFACE, fontFamily:"'Geist','Inter',sans-serif" }}>
      <div style={{ background:BG, borderBottom:`1px solid ${BORDER}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>Q</div>
        <span style={{ fontSize:15, fontWeight:600 }}>QualyLeads</span>
        <span style={{ fontSize:13, color:MUTED, marginLeft:8 }}>— Client Onboarding</span>
      </div>

      <div style={{ maxWidth:540, margin:"40px auto", padding:"0 24px" }}>
        {/* Progress */}
        <div style={{ display:"flex", alignItems:"flex-start", marginBottom:32 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:step>=s.num?ACCENT:BORDER, color:step>=s.num?"#fff":MUTED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600 }}>
                  {step>s.num?"✓":s.num}
                </div>
                <div style={{ fontSize:10, color:step>=s.num?TEXT:MUTED, marginTop:4, whiteSpace:"nowrap" }}>{s.title}</div>
              </div>
              {i < STEPS.length-1 && <div style={{ flex:1, height:2, background:step>s.num?ACCENT:BORDER, margin:"0 6px", marginBottom:16 }} />}
            </div>
          ))}
        </div>

        <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:32 }}>

          {/* STEP 1 */}
          {step===1 && <>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Business details</h2>
            <p style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Tell us about the business you're setting up.</p>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Business name *</label>
              <input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="e.g. PeakFit Gym Amsterdam" style={inp} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Industry *</label>
              <select value={industry} onChange={e=>setIndustry(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i=><option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Language & Market *</label>
              <select value={language} onChange={e=>setLanguage(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {LANGUAGES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>
                {language === "nl"
                  ? "🇳🇱 Qualy will text leads in Dutch via your NL number"
                  : "🇺🇸 Qualy will text leads in English via your US number"}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Owner / contact name *</label>
              <input value={ownerName} onChange={e=>setOwnerName(e.target.value)} placeholder="e.g. Mike Hartley" style={inp} />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={lbl}>Email address *</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="mike@peakfitgym.com" style={inp} />
            </div>

            {error && <div style={{ fontSize:13, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}
            <button onClick={step1Next} style={{ width:"100%", height:42, background:ACCENT, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Continue →</button>
          </>}

          {/* STEP 2 */}
          {step===2 && <>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Contact & booking</h2>
            <p style={{ fontSize:13, color:MUTED, marginBottom:24 }}>How should Qualy reach leads and book calls?</p>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Business phone number *</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={language === "nl" ? "+31612345678" : "+16125551234"} style={inp} />
              <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>For your records only — Qualy sends SMS from your QualyLeads number.</div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Booking tool</label>
              <div style={{ display:"flex", gap:8, marginTop:6 }}>
                {BOOKING_TOOLS.map(t => (
                  <button key={t.value} onClick={()=>setBookingTool(t.value)} style={{ flex:1, height:38, borderRadius:8, border:`1.5px solid ${bookingTool===t.value?ACCENT:BORDER}`, background:bookingTool===t.value?"#f0fdf4":BG, color:bookingTool===t.value?ACCENT:TEXT, fontSize:13, fontWeight:bookingTool===t.value?600:400, curs
