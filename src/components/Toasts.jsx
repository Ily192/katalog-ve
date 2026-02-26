import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toasts() {
    const { state, dispatch } = useApp();

    if (state.toasts.length === 0) return null;

    const handleDismiss = (id) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    return (
        <div className="toast-container">
            {state.toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span className="toast-message">{t.message}</span>
                    <button
                        className="toast-close"
                        onClick={() => handleDismiss(t.id)}
                        aria-label="Cerrar notificación"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
