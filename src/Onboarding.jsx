// src/Onboarding.jsx
import { useState } from "react";
import { supabase } from "./supabaseClient";

const T = {
  bg:          "#ffffff",
  bgMuted:     "#f9fafb",
  bgHover:     "#f4f4f5",
  border:      "#e4e4e7",
  borderFocus: "#a1a1aa",
  text:        "#09090b",
  textMuted:   "#71717a",
  textSubtle:  "#a1a1aa",
  accent:      "#16a34a",
  accentFg:    "#ffffff",
  success:     "#16a34a",
  successBg:   "#f0fdf4",
  successBorder:"#bbf7d0",
  error:       "#dc2626",
  errorBg:     "#fef2f2",
  errorBorder: "#fecaca",
};

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

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState(null);

  const [form, setForm] = useState({
    businessName: "",
    industry:     "",
    ownerName:    "",
    email:        "",
    phone:        "",
    calendlyUrl:  "",
    testPhone:    "",
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const inputSx = {
    width: "100%", height: 40,
    background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "0 12px",
    color: T.text, fontSize: 14,
    fontFamily: "inherit", outline: "none",
    marginTop: 6,
  };

  const labelSx = {
    fontSize: 13, fontWeight: 500,
    color: T.text, display: "block",
  };

  // ── Step 1: Save client to Supabase ────────────────────────────────────────
  async function saveClient() {
    if (!form.businessName || !form.industry || !form.ownerName || !form.email) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("clients")
        .insert({
          business_name: form.businessName,
          industry:      form.industry,
          owner_name:    form.ownerName,
          email:         form.email,
          status:        "onboarding",
        })
        .select("id")
        .single();

      if (err) throw new Error(err.message);
      setClientId(data.id);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Save contact & Calendly ────────────────────────────────────────
  async function saveContact() {
    if (!form.phone) {
      setError("Phone number is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await supabase
        .from("clients")
        .update({
          phone:        form.phone,
          calendly_url: form.calendlyUrl || null,
        })
        .eq("id", clientId);

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 4: Send test lead ──────────────────────────────────────────────────
  async function sendTestLead() {
    if (!form.testPhone) {
      setError("Please enter a phone number to test.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/webhook/lead`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": import.meta.env.VITE_WEBHOOK_SECRET || "qualyleads2025",
          },
          body: JSON.stringify({
            name:     form.ownerName || "Test Lead",
            phone:    form.testPhone,
            industry: form.industry,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mark client as active
      await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", clientId);

      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const webhookUrl = `${import.meta.env.VITE_BACKEND_URL || "https://web-production-7ffda.up.railway.app"}/zapier/lead`;

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight:"100vh", background:T.bgMuted, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Geist','Inter',system-ui,sans-serif" }}>
        <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:16, padding:40, maxWidth:480, width:"100%", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:22, fontWeight:600, color:T.text, marginBottom:8 }}>You're all set!</h2>
          <p style={{ fontSize:14, color:T.textMuted, marginBottom:24, lineHeight:1.6 }}>
            <strong>{form.businessName}</strong> is now live on QualyLeads. Every new lead will be texted within 10 seconds.
          </p>
          <div style={{ background:T.successBg, border:`1px solid ${T.successBorder}`, borderRadius:10, padding:16, marginBottom:24, textAlign:"left" }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.success, marginBottom:8 }}>Your webhook URL:</div>
            <code style={{ fontSize:12, color:T.text, wordBreak:"break-all" }}>{webhookUrl}</code>
          </div>
          <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>
            Paste this URL into your form tool, Zapier, or CRM to start sending leads to QualyLeads.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bgMuted, fontFamily:"'Geist','Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:T.bg, borderBottom:`1px solid ${T.border}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:T.accentFg }}>Q</div>
        <span style={{ fontSize:15, fontWeight:600, letterSpacing:"-0.02em" }}>QualyLeads</span>
        <span style={{ fontSize:13, color:T.textMuted, marginLeft:8 }}>— Client Onboarding</span>
      </div>

      <div style={{ maxWidth:560, margin:"40px auto", padding:"0 24px" }}>

        {/* Progress steps */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background: step > s.num ? T.accent : step === s.num ? T.accent : T.border,
                  color: step >= s.num ? T.accentFg : T.textMuted,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:600, flexShrink:0,
                }}>
                  {step > s.num ? "✓" : s.num}
                </div>
                <div style={{ fontSize:10, color: step >= s.num ? T.text : T.textMuted, marginTop:4, whiteSpace:"nowrap" }}>{s.title}</div>
              </div>
              {i < STEPS.length-1 && (
                <div style={{ flex:1, height:2, background: step > s.num ? T.accent : T.border, margin:"0 8px", marginBottom:16 }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:16, padding:32 }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:600, color:T.text, marginBottom:6 }}>Business details</h2>
              <p style={{ fontSize:13, color:T.textMuted, marginBottom:24 }}>Tell us about the business you're setting up.</p>

              <div style={{ marginBottom:16 }}>
                <label style={labelSx}>Business name *</label>
                <input value={form.businessName} onChange={e=>update("businessName",e.target.value)} placeholder="e.g. PeakFit Gym Amsterdam" style={inputSx} />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={labelSx}>Industry *</label>
                <select value={form.industry} onChange={e=>update("industry",e.target.value)} style={{ ...inputSx, cursor:"pointer" }}>
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={labelSx}>Owner / contact name *</label>
                <input value={form.ownerName} onChange={e=>update("ownerName",e.target.value)} placeholder="e.g. Mike Hartley" style={inputSx} />
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={labelSx}>Email address *</label>
                <input type="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="mike@peakfitgym.com" style={inputSx} />
              </div>

              {error && <div style={{ fontSize:13, color:T.error, background:T.errorBg, border:`1px solid ${T.errorBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}

              <button onClick={saveClient} disabled={loading} style={{ width:"100%", height:40, background:T.accent, color:T.accentFg, border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                {loading ? "Saving..." : "Continue →"}
              </button>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:600, color:T.text, marginBottom:6 }}>Contact & booking</h2>
              <p style={{ fontSize:13, color:T.textMuted, marginBottom:24 }}>How should Qualy reach leads and book calls?</p>

              <div style={{ marginBottom:16 }}>
                <label style={labelSx}>Business phone number *</label>
                <input value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="+31612345678" style={inputSx} />
                <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>This is the number leads will receive SMS from.</div>
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={labelSx}>Calendly link <span style={{ color:T.textMuted, fontWeight:400 }}>(optional but recommended)</span></label>
                <input value={form.calendlyUrl} onChange={e=>update("calendlyUrl",e.target.value)} placeholder="https://calendly.com/yourname/demo" style={inputSx} />
                <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Qualy will send this link when a lead is ready to book.</div>
              </div>

              {error && <div style={{ fontSize:13, color:T.error, background:T.errorBg, border:`1px solid ${T.errorBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, height:40, background:"transparent", color:T.text, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
                <button onClick={saveContact} disabled={loading} style={{ flex:2, height:40, background:T.accent, color:T.accentFg, border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  {loading ? "Saving..." : "Continue →"}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:600, color:T.text, marginBottom:6 }}>Your webhook URL</h2>
              <p style={{ fontSize:13, color:T.textMuted, marginBottom:24 }}>Paste this URL into your form tool or Zapier to send leads to QualyLeads.</p>

              <div style={{ background:T.bgMuted, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
                <div style={{ fontSize:11, color:T.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>Your webhook URL</div>
                <code style={{ fontSize:13, color:T.text, wordBreak:"break-all", lineHeight:1.6 }}>{webhookUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  style={{ display:"block", marginTop:10, padding:"6px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:T.text }}>
                  📋 Copy URL
                </button>
              </div>

              <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7, marginBottom:24 }}>
                <strong style={{ color:T.text }}>How to use it:</strong><br />
                • <strong>Typeform/Webflow:</strong> Add it as a webhook in your form settings<br />
                • <strong>Zapier:</strong> Use "Webhooks by Zapier" → POST to this URL<br />
                • <strong>Facebook Lead Ads:</strong> Connect via Zapier → POST to this URL
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(2)} style={{ flex:1, height:40, background:"transparent", color:T.text, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
                <button onClick={()=>setStep(4)} style={{ flex:2, height:40, background:T.accent, color:T.accentFg, border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:600, color:T.text, marginBottom:6 }}>Send a test lead</h2>
              <p style={{ fontSize:13, color:T.textMuted, marginBottom:24 }}>Enter a phone number to receive a test SMS and confirm everything is working.</p>

              <div style={{ marginBottom:24 }}>
                <label style={labelSx}>Test phone number *</label>
                <input value={form.testPhone} onChange={e=>update("testPhone",e.target.value)} placeholder="+31612345678" style={inputSx} />
                <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>You'll receive an AI-generated SMS within 10 seconds.</div>
              </div>

              {error && <div style={{ fontSize:13, color:T.error, background:T.errorBg, border:`1px solid ${T.errorBorder}`, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(3)} style={{ flex:1, height:40, background:"transparent", color:T.text, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
                <button onClick={sendTestLead} disabled={loading} style={{ flex:2, height:40, background:T.accent, color:T.accentFg, border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  {loading ? "Sending..." : "🚀 Send test SMS"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
