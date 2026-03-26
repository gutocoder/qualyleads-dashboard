import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Onboarding from "./Onboarding.jsx";
import Login from "./Login.jsx";
import { supabase } from "./supabaseClient.js";

const ADMIN_EMAIL = "gustavoadade@gmail.com";

function Root() {
  const [session, setSession]         = useState(undefined);
  const [subscription, setSubscription] = useState(null);
  const path = window.location.pathname;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadSubscription(data.session.user.email);
    });
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadSubscription(session.user.email);
      else setSubscription(null);
    });
    return () => sub.unsubscribe();
  }, []);

  async function loadSubscription(email) {
    if (email === ADMIN_EMAIL) return; // admin doesn't need subscription check
    const { data } = await supabase.from("subscribers").select("*").eq("email", email).single();
    setSubscription(data);
  }

  // Loading
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", color:"#64748b" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"#16a34a", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" fill="white"/></svg>
          </div>
          Loading...
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    if (path === "/onboarding") return <Onboarding />;
    return <Login />;
  }

  // Onboarding is always accessible when logged in
  if (path === "/onboarding") return <Onboarding />;

  const isAdmin = session.user.email === ADMIN_EMAIL;

  // Non-admin: check subscription
  if (!isAdmin && subscription === null && session.user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Geist','Inter',sans-serif", padding:24, background:"#f8fafc" }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, padding:40, maxWidth:400, width:"100%", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>No active subscription</div>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:24, lineHeight:1.6 }}>
            It looks like you don't have an active QualyLeads subscription yet.
          </div>
          <a href="https://qualyleads.com/#pricing" style={{ display:"inline-flex", padding:"10px 20px", background:"#16a34a", color:"#fff", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" }}>
            View plans →
          </a>
        </div>
      </div>
    );
  }

  return <App session={session} isAdmin={isAdmin} subscription={subscription} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
