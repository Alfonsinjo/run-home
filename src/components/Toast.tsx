import { create } from 'zustand';

type Toast = { id: number; msg: string; tone: 'info' | 'success' | 'error' };
type ToastStore = { toasts: Toast[]; show(msg: string, tone?: Toast['tone']): void; remove(id: number): void };

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  show(msg, tone = 'info') {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, msg, tone }] });
    setTimeout(() => get().remove(id), 3200);
  },
  remove(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>{t.msg}</div>
      ))}
    </div>
  );
}
