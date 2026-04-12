import styles from "./Card.module.css";
interface Props { children: React.ReactNode; className?: string; accent?: string; onClick?: () => void; }
export default function Card({ children, className = "", accent, onClick }: Props) {
  return (
    <div className={`${styles.card} ${className} ${onClick ? styles.clickable : ""}`} onClick={onClick} style={accent ? { "--accent": accent } as React.CSSProperties : undefined}>
      {accent && <div className={styles.accentBar} />}
      {children}
    </div>
  );
}
