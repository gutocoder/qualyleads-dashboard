import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Onboarding from "./Onboarding.jsx";
import Login from "./Login.jsx";
import { supabase } from "./supabaseClient.js";

const ADMIN_EMAIL = "gustavoadade@gmail.com";

function Root() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const path = window.location.pathname;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", color:"#64748b" }}>
        Loading...
      </div>
    );
  }

  // Not logged in → show login (except onboarding which is public)
  if (!session) {
    if (path === "/onboarding") return <Onboarding />;
    return <Login />;
  }

  // Logged in → show correct view
  if (path === "/onboarding") return <Onboarding />;

  const isAdmin = session.user.email === ADMIN_EMAIL;
  return <App session={session} isAdmin={isAdmin} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
