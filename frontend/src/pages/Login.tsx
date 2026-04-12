import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(email, password); navigate("/dashboard"); }
    catch { setError("Invalid email or password."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.bg}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>CISO<span>Lens</span></div>
        <div className={styles.tagline}>// vCISO Command Center</div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.btn} type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In →"}</button>
        <div className={styles.hint}>Demo: khaled@cisolens.io / Demo1234!</div>
      </form>
    </div>
  );
}
