import { useState } from "react";
import { supabase } from "./supabaseClient";

const G = "#16a34a";
const BG = "#ffffff";
const SURF = "#f8fafc";
const BORDER = "#e2e8f0";
const TEXT = "#0f172a";
const MUTED = "#64748b";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [mode, setMode]         = useState("login"); // login | forgot
  const [sent, setSent]         = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!email) { setError("Please enter your email."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://app.qualyleads.com/reset-password",
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  const inp = {
    width: "100%", height: 44, background: SURF,
    border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: "0 14px", color: TEXT, fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight:"100vh", background:SURF, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Geist','Inter',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:G, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" fill="white" />
            </svg>
          </div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.03em", color:TEXT }}>QualyLeads</div>
          <div style={{ fontSize:13, color:MUTED, marginTop:4 }}>
            {mode === "login" ? "Sign in to your dashboard" : "Reset your password"}
          </div>
        </div>

        {/* Card */}
        <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:32 }}>

          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:500, display:"block", marginBottom:6 }}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourbusiness.com" style={inp} />
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ fontSize:13, fontWeight:500 }}>Password</label>
                  <button type="button" onClick={()=>{setMode("forgot");setError("")}} style={{ fontSize:12, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                    Forgot password?
                  </button>
                </div>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inp} />
              </div>

              {error && <div style={{ fontSize:13, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{ width:"100%", height:44, background:G, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>
          )}

          {mode === "forgot" && !sent && (
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:13, fontWeight:500, display:"block", marginBottom:6 }}>Email address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourbusiness.com" style={inp} />
                <div style={{ fontSize:12, color:MUTED, marginTop:6 }}>We'll send you a link to reset your password.</div>
              </div>

              {error && <div style={{ fontSize:13, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{ width:"100%", height:44, background:G, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:12 }}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <button type="button" onClick={()=>{setMode("login");setError("")}} style={{ width:"100%", height:44, background:"transparent", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                Back to sign in
              </button>
            </form>
          )}

          {mode === "forgot" && sent && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Check your email</div>
              <div style={{ fontSize:13, color:MUTED, marginBottom:24, lineHeight:1.6 }}>
                We sent a password reset link to <strong>{email}</strong>
              </div>
              <button onClick={()=>{setMode("login");setSent(false);setError("")}} style={{ fontSize:13, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                Back to sign in
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:MUTED }}>
          Need help? Contact <a href="mailto:hello@qualyleads.com" style={{ color:G }}>hello@qualyleads.com</a>
        </div>
      </div>
    </div>
  );
}
