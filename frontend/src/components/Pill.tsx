import styles from "./Pill.module.css";
type Variant = "green" | "amber" | "red" | "cyan";
export default function Pill({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  return <span className={`${styles.pill} ${styles[variant]}`}>{children}</span>;
}
