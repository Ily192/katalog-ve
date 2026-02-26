import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './CatalogBuilder.css';

const QUOTES = [
    { text: "Un negocio exitoso empieza con una gran presentación", icon: "✨" },
    { text: "Tu catálogo es tu mejor vendedor — trabaja 24/7", icon: "🕐" },
    { text: "Cada producto es una oportunidad de conectar", icon: "🤝" },
    { text: "Lo que no se muestra, no se vende", icon: "👀" },
    { text: "Tu marca cuenta una historia — cuéntala bien", icon: "📖" },
    { text: "El éxito no es casualidad — es catálogo", icon: "🚀" },
    { text: "Vender online es mostrar lo mejor de tu trabajo", icon: "💎" },
    { text: "Cada cliente que llega es una victoria", icon: "🏆" },
    { text: "Emprender es la forma más valiente de soñar", icon: "💪" },
    { text: "Tu tienda online te acerca al mundo entero", icon: "🌎" },
];

const STEPS = [
    "Preparando tu marca...",
    "Diseñando la plantilla...",
    "Organizando productos...",
    "Optimizando imágenes...",
    "Aplicando colores de marca...",
    "Generando catálogo...",
    "¡Casi listo!",
];

export default function CatalogBuilder() {
    const { state, dispatch, toast } = useApp();
    const navigate = useNavigate();
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const finish = useCallback(() => {
        dispatch({ type: 'SET_CATALOG_BUILT' });
        dispatch({ type: 'SET_STEP', payload: 4 });
        toast('¡Tu catálogo está listo! 🎉🚀', 'success');
        navigate('/store');
    }, [dispatch, toast, navigate]);

    useEffect(() => {
        // Rotate quotes
        const quoteTimer = setInterval(() => {
            setQuoteIndex(i => (i + 1) % QUOTES.length);
        }, 3000);

        // Progress bar
        const progressTimer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) return 100;
                return p + 1;
            });
        }, 80);

        // Steps
        const stepTimer = setInterval(() => {
            setStepIndex(i => {
                if (i >= STEPS.length - 1) return i;
                return i + 1;
            });
        }, 1200);

        // Finish
        const finishTimer = setTimeout(finish, 8500);

        return () => {
            clearInterval(quoteTimer);
            clearInterval(progressTimer);
            clearInterval(stepTimer);
            clearTimeout(finishTimer);
        };
    }, [finish]);

    const quote = QUOTES[quoteIndex];

    return (
        <div className="builder-page">
            <div className="builder-bg">
                <div className="builder-orb builder-orb-1" style={{ background: state.store.brandColor }}></div>
                <div className="builder-orb builder-orb-2" style={{ background: state.store.accentColor }}></div>
                <div className="builder-orb builder-orb-3"></div>
            </div>

            <div className="builder-content animate-fade-in-up">
                {/* Logo */}
                <div className="builder-logo-wrapper">
                    {state.store.logoPreview ? (
                        <img src={state.store.logoPreview} alt="Logo" className="builder-logo" />
                    ) : (
                        <div className="builder-logo-placeholder" style={{ background: state.store.brandColor }}>
                            {state.store.name?.[0] || '🚀'}
                        </div>
                    )}
                </div>

                {/* Store Name */}
                <h1 className="builder-title">{state.store.name || 'Tu Tienda'}</h1>

                {/* Step Label */}
                <div className="builder-step animate-fade-in" key={stepIndex}>
                    {STEPS[stepIndex]}
                </div>

                {/* Progress Bar */}
                <div className="builder-progress-track">
                    <div
                        className="builder-progress-fill"
                        style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${state.store.brandColor}, ${state.store.accentColor})`
                        }}
                    ></div>
                </div>
                <span className="builder-progress-num">{Math.min(progress, 100)}%</span>

                {/* Motivational Quote */}
                <div className="builder-quote animate-fade-in" key={quoteIndex}>
                    <span className="builder-quote-icon">{quote.icon}</span>
                    <p>"{quote.text}"</p>
                </div>

                {/* Product Count */}
                <div className="builder-info">
                    📦 {state.products.length} productos &nbsp;·&nbsp; 🎨 {state.store.template?.name || 'Plantilla'}
                </div>
            </div>
        </div>
    );
}
