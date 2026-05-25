import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ─── Toast ───────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    exiting: boolean;
}

// ─── Confirm ─────────────────────────────────────────────
interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
    message: string;
    resolve: (value: boolean) => void;
}

// ─── Context ─────────────────────────────────────────────
interface UIContextValue {
    toasts: ToastItem[];
    removeToast: (id: string) => void;
    addToast: (type: ToastType, message: string) => void;
    confirmState: ConfirmState | null;
    showConfirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────
export function UIProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const removeToast = useCallback((id: string) => {
        // Trigger exit animation first
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, []);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2, 9);
        setToasts(prev => [...prev, { id, type, message, exiting: false }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    const showConfirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({ message, ...options, resolve });
        });
    }, []);

    const handleConfirmResolve = (value: boolean) => {
        confirmState?.resolve(value);
        setConfirmState(null);
    };

    return (
        <UIContext.Provider value={{ toasts, removeToast, addToast, confirmState, showConfirm }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
            {/* Confirm modal */}
            {confirmState && (
                <ConfirmModalInner
                    state={confirmState}
                    onResolve={handleConfirmResolve}
                />
            )}
        </UIContext.Provider>
    );
}

// ─── Toast Item Component ─────────────────────────────────
const TOAST_STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
    success: { bg: 'bg-white', border: 'border-l-4 border-emerald-500', icon: '✅' },
    error:   { bg: 'bg-white', border: 'border-l-4 border-red-500', icon: '❌' },
    info:    { bg: 'bg-white', border: 'border-l-4 border-blue-500', icon: 'ℹ️' },
};

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
    const style = TOAST_STYLES[toast.type];
    return (
        <div
            className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg
                ${style.bg} ${style.border}
                transition-all duration-350 ease-out
                ${toast.exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
            `}
            style={{ animation: toast.exiting ? undefined : 'slideInRight 0.3s ease-out' }}
        >
            <span className="text-lg flex-shrink-0 mt-0.5">{style.icon}</span>
            <p className="text-sm text-gray-800 font-medium flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-1"
            >
                ×
            </button>
        </div>
    );
}

// ─── Confirm Modal Component ──────────────────────────────
function ConfirmModalInner({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
            onClick={() => onResolve(false)}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {state.title ?? 'Confirmation'}
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{state.message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => onResolve(false)}
                        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                        {state.cancelLabel ?? 'Annuler'}
                    </button>
                    <button
                        onClick={() => onResolve(true)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-colors ${
                            state.danger
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {state.confirmLabel ?? 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Hooks ───────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error('useToast must be used inside UIProvider');
    return {
        success: (msg: string) => ctx.addToast('success', msg),
        error:   (msg: string) => ctx.addToast('error', msg),
        info:    (msg: string) => ctx.addToast('info', msg),
    };
}

export function useConfirm() {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error('useConfirm must be used inside UIProvider');
    return ctx.showConfirm;
}
