import { createContext, useCallback, useContext, useState } from "react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastContextValue = {
  addToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[`toast${toast.type[0].toUpperCase()}${toast.type.slice(1)}`]}`}>
            <span className={styles.toastIcon}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
            <span className={styles.toastMessage}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue["addToast"] => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context.addToast;
};
