import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Auth({ mode }) {
  const isSignup = mode === "signup";
  const { user, login, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const [f, setF] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (isSignup && f.password !== f.confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    try {
      if (isSignup) await signup({ name: f.name, email: f.email, password: f.password, confirmPassword: f.confirmPassword });
      else await login(f.email, f.password);
      toast(isSignup ? "Welcome to StyleAI!" : "Welcome back!");
      navigate(from, { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="container auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate={false}>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{isSignup ? "Join StyleAI to save your cart, wishlist and orders." : "Log in to continue shopping."}</p>
        {isSignup && <label className="field">Full name<input value={f.name} onChange={set("name")} autoComplete="name" required minLength={2} /></label>}
        <label className="field">Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
        <label className="field">Password<input type="password" value={f.password} onChange={set("password")} autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 6 : 1} /></label>
        {isSignup && <label className="field">Confirm password<input type="password" value={f.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" required /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}</button>
        <p className="muted center">
          {isSignup ? <>Already have an account? <Link to="/login" state={{ from }}>Log in</Link></> : <>New to StyleAI? <Link to="/signup" state={{ from }}>Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}
