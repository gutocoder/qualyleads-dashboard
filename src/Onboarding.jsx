import { useState } from "react";
import { supabase } from "./supabaseClient";

const ACCENT = "#16a34a";
const BG = "#ffffff";
const SURFACE = "#f9fafb";
const BORDER = "#e4e4e7";
const TEXT = "#09090b";
const MUTED = "#71717a";

const INDUSTRIES = [
  { value: "gym",     label: "🏋️  Gym / Fitness" },
  { value: "plumber", label: "🔧  Plumber / Home Services" },
  { value: "agency",  label: "📈  Marketing Agency" },
  { value: "coach",   label: "🧑‍💼  Coach / Creator" },
  { value: "general", label: "🏢  Other Business" },
];

const STEPS = [
  { num: 1, title: "Business details" },
  { num: 2, title: "Contact & booking" },
  { num: 3, title: "Your webhook URL" },
  { num: 4, title: "Send a test lead" },
];

const inp = {
  width: "100%", height: 44,
  background: BG, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "0 14px",
  color: TEXT, fontSize: 14,
  fontFamily: "inherit", outline: "none",
  marginTop: 6, boxSizing: "border-box",
};

const lbl = { fontSize: 13, fontWeight: 500, color: TEXT, display: "block" };

export default function Onboarding() {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry]         = useState("");
  const [ownerName, setOwnerName]       = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [calendlyUrl, setCalendlyUrl]   = useState("");
  const [testPhone, setTestPhone]       = useState("");

  const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://web-production-7ffda.up.railway.app";
  const webhookUrl = `${BACKEND}/zapier/lead`;

  function step1Next() {
    if (!businessName || !industry || !ownerName || !email) {
      setError("Please fill in all fields."); return;
    }
    setError(""); setStep(2);
  }

  function step2Next() {
    if (!phone) { setError("Phone number is required."); return; }
    setError(""); setStep(3);
  }

  async function sendTestLead() {
    if (!testPhone) { setError("Please enter a phone number to test."); return; }
    setError(""); setLoading(true);
    try {
      // Save to Supabase
      await supabase.from("clients").insert({
        business_name: businessName,
        industry,
        owner_name:    ownerName,
        email,
        phone,
        calendly_url:  calendlyUrl || null,
        status:        "active",
      });

      // Send test SMS
      const res = await fetch(`${BACKEND}/webhook/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "qualyleads2025",
        },
        body: JSON.stringify({ name: ownerName, phone: testPhone, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      setDone(true);
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
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+31612345678" style={inp} />
              <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>Leads will receive SMS from this number.</div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={lbl}>Calendly link <span style={{ fontWeight:400, color:MUTED }}>(optional)</span></label>
              <input value={calendlyUrl} onChange={e=>setCalendlyUrl(e.target.value)} placeholder="https://calendly.com/yourname/demo" style={inp} />
            </div>
            {error && <div style={{ fontSize:13, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setError("");setStep(1)}} style={{ flex:1, height:42, background:"transparent", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
              <button onClick={step2Next} style={{ flex:2, height:42, background:ACCENT, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Continue →</button>
            </div>
          </>}

          {/* STEP 3 */}
          {step===3 && <>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Your webhook URL</h2>
            <p style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Paste this into your form tool or Zapier to send leads to QualyLeads.</p>
            <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:11, color:MUTED, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>Your webhook URL</div>
              <code style={{ fontSize:12, wordBreak:"break-all", lineHeight:1.6 }}>{webhookUrl}</code>
              <button onClick={()=>navigator.clipboard.writeText(webhookUrl)} style={{ display:"block", marginTop:10, padding:"6px 14px", background:BG, border:`1px solid ${BORDER}`, borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>📋 Copy URL</button>
            </div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.8, marginBottom:24 }}>
              <strong style={{ color:TEXT }}>How to use it:</strong><br/>
              • <strong>Typeform / Webflow:</strong> Add as webhook in form settings<br/>
              • <strong>Zapier:</strong> Webhooks by Zapier → POST to this URL<br/>
              • <strong>Facebook Lead Ads:</strong> Connect via Zapier → POST to this URL
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setError("");setStep(2)}} style={{ flex:1, height:42, background:"transparent", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
              <button onClick={()=>setStep(4)} style={{ flex:2, height:42, background:ACCENT, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Continue →</button>
            </div>
          </>}

          {/* STEP 4 */}
          {step===4 && <>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Send a test lead</h2>
            <p style={{ fontSize:13, color:MUTED, marginBottom:24 }}>Enter a phone number and we'll send a test SMS to confirm everything works.</p>
            <div style={{ marginBottom:24 }}>
              <label style={lbl}>Test phone number *</label>
              <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="+31612345678" style={inp} />
              <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>You'll receive an AI-generated SMS within 10 seconds.</div>
            </div>
            {error && <div style={{ fontSize:13, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setError("");setStep(3)}} style={{ flex:1, height:42, background:"transparent", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
              <button onClick={sendTestLead} disabled={loading} style={{ flex:2, height:42, background:ACCENT, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
                {loading?"Sending...":"🚀 Send test SMS"}
              </button>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}
