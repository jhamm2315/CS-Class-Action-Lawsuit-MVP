import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSignIn() {
    setMsg("Signing in…");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    setMsg("Signed in. Redirecting…");
    nav("/settings"); // require MFA/passkey enrollment first
  }

  async function handleSignUp() {
    setMsg("Creating account…");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    setMsg("Account created. Please sign in.");
    setMode("signin");
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <input
        className="w-full border p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />
      <input
        className="w-full border p-2 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e=>setPassword(e.target.value)}
      />
      {mode === "signin" ? (
        <button className="btn" onClick={handleSignIn}>Sign in</button>
      ) : (
        <button className="btn" onClick={handleSignUp}>Create account</button>
      )}
      <div className="text-sm">
        {mode === "signin" ? (
          <button className="underline" onClick={()=>setMode("signup")}>Need an account? Sign up</button>
        ) : (
          <button className="underline" onClick={()=>setMode("signin")}>Have an account? Sign in</button>
        )}
      </div>
      <p className="text-sm text-gray-600">{msg}</p>
    </div>
  );
}