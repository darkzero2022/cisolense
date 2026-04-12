import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import styles from "./Sidebar.module.css";

const NAV = [
  { section: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: "⬡" }, { to: "/clients", label: "Clients", icon: "◈" }] },
  { section: "GRC", items: [{ to: "/actions", label: "Actions", icon: "▷" }] },
  { section: "Analytics", items: [{ to: "/reports", label: "Reports", icon: "📊" }, { to: "/scans", label: "Scanner", icon: "🔍" }] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate("/login"); };
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "??";

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>CISO<span>Lens</span></div>
      {NAV.map((group) => (
        <div key={group.section}>
          <div className={styles.section}>{group.section}</div>
          {group.items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
              <span className={styles.icon}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </div>
      ))}
      <div className={styles.bottom}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{user?.firstName}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}
