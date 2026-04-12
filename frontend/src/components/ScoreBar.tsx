import { getScoreColor } from "@/lib/utils";
import styles from "./ScoreBar.module.css";
export default function ScoreBar({ score, width = 80 }: { score: number; width?: number }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar} style={{ width }}>
        <div className={styles.fill} style={{ width: `${score}%`, background: getScoreColor(score) }} />
      </div>
      <span className={styles.num} style={{ color: getScoreColor(score) }}>{score}%</span>
    </div>
  );
}
