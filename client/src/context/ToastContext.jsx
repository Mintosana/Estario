import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const toastIcons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, title, type = "info" }) => {
      if (!message) {
        return null;
      }

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const toast = { id, message, title, type };
      setToasts((current) => [toast, ...current].slice(0, 4));
      window.setTimeout(() => dismissToast(id), type === "error" ? 6000 : 4200);
      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-label="Notificari">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] ?? Info;

          return (
            <div className={`toast toast-${toast.type}`} key={toast.id}>
              <Icon size={18} aria-hidden="true" />
              <div>
                {toast.title ? <strong>{toast.title}</strong> : null}
                <p>{toast.message}</p>
              </div>
              <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Inchide notificarea">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
