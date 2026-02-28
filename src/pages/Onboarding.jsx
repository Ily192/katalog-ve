import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Onboarding.css';

const TEMPLATES = [
    {
        id: 'elegant',
        name: 'Elegante',
        desc: 'Diseño limpio y sofisticado con tarjetas grandes.',
        emoji: '💎',
        preview: 'linear-gradient(135deg, #1a1a2e, #2d1b4e)',
        layout: 'grid'
    },
    {
        id: 'vibrant',
        name: 'Vibrante',
        desc: 'Colores audaces y diseño llamativo. Ideal para moda.',
        emoji: '🌈',
        preview: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        layout: 'masonry'
    },
    {
        id: 'minimal',
        name: 'Minimalista',
        desc: 'Diseño limpio con mucho espacio. Ideal para tech.',
        emoji: '🤍',
        preview: 'linear-gradient(135deg, #141414, #1a1a1a)',
        layout: 'list'
    },
    {
        id: 'warm',
        name: 'Cálido',
        desc: 'Tonos cálidos y acogedores. Ideal para comida y artesanía.',
        emoji: '🧡',
        preview: 'linear-gradient(135deg, #1a0f0a, #2d1810)',
        layout: 'carousel'
    },
];

export default function Onboarding() {
    const { state, dispatch, toast } = useApp();
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [subStep, setSubStep] = useState(0); // 0 = info, 1 = template

    const store = state.store;

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast('El archivo es muy grande. Máximo 5MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                dispatch({ type: 'UPDATE_STORE', payload: { logo: file, logoPreview: ev.target.result } });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                dispatch({ type: 'UPDATE_STORE', payload: { logo: file, logoPreview: ev.target.result } });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInfoSubmit = () => {
        if (!store.name || !store.whatsapp || !store.email) {
            toast('Completa el nombre, WhatsApp y correo de tu negocio', 'error');
            return;
        }

        // Generar un enlace personalizado y único a partir del nombre
        const slug = store.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        dispatch({ type: 'UPDATE_STORE', payload: { slug } });

        setSubStep(1);
    };

    const handleTemplateSelect = (template) => {
        dispatch({ type: 'SET_TEMPLATE', payload: template });
    };

    const handleContinue = () => {
        if (!store.template) {
            toast('Selecciona una plantilla para continuar', 'error');
            return;
        }
        dispatch({ type: 'SET_STEP', payload: 2 });
        toast('¡Excelente! Ahora agrega tus productos 📦', 'success');
        navigate('/products');
    };

    return (
        <div className="page">
            <div className="container">
                {/* Progress Steps */}
                <div className="steps" id="onboarding-steps">
                    <div className={`step-dot ${subStep >= 0 ? 'active' : ''}`}></div>
                    <div className="step-connector"></div>
                    <div className={`step-dot ${subStep >= 1 ? 'active' : ''}`}></div>
                    <div className="step-connector"></div>
                    <div className="step-dot"></div>
                    <div className="step-connector"></div>
                    <div className="step-dot"></div>
                </div>

                {subStep === 0 ? (
                    /* ============ STEP 1: Business Info ============ */
                    <div className="onboarding-section animate-fade-in-up">
                        <div className="page-header">
                            <h1>Configura tu negocio</h1>
                            <p>Cuéntanos sobre tu negocio para crear tu catálogo perfecto</p>
                        </div>

                        <div className="setup-grid" id="store-setup-form">
                            {/* Logo Upload */}
                            <div className="setup-card card">
                                <h3>Logo de tu negocio</h3>
                                <div
                                    className="logo-dropzone"
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleLogoDrop}
                                >
                                    {store.logoPreview ? (
                                        <img src={store.logoPreview} alt="Logo" className="logo-preview" />
                                    ) : (
                                        <div className="logo-placeholder">
                                            <span className="logo-placeholder-icon">📷</span>
                                            <span>Arrastra o haz clic para subir</span>
                                            <span className="logo-placeholder-hint">PNG, JPG hasta 5MB</span>
                                        </div>
                                    )}
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                            </div>

                            {/* Business Details */}
                            <div className="setup-card card">
                                <h3>Datos del negocio</h3>
                                <div className="setup-fields">
                                    <div className="input-group">
                                        <label>Nombre del negocio *</label>
                                        <input
                                            className="input-field"
                                            placeholder="Mi Tienda Online"
                                            value={store.name}
                                            onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { name: e.target.value } })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Descripción</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Describe brevemente tu negocio..."
                                            value={store.description}
                                            onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { description: e.target.value } })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>WhatsApp del negocio * (con código de país)</label>
                                        <input
                                            className="input-field"
                                            placeholder="+58 412 1234567"
                                            value={store.whatsapp}
                                            onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { whatsapp: e.target.value } })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Correo electrónico *</label>
                                        <input
                                            className="input-field"
                                            type="email"
                                            placeholder="negocio@correo.com"
                                            value={store.email}
                                            onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { email: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Brand Colors */}
                            <div className="setup-card card setup-card-colors">
                                <h3>Colores de marca</h3>
                                <div className="color-pickers">
                                    <div className="color-picker-item">
                                        <label>Color principal</label>
                                        <div className="color-picker-wrapper">
                                            <input
                                                type="color"
                                                value={store.brandColor}
                                                onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { brandColor: e.target.value } })}
                                                className="color-input"
                                            />
                                            <span className="color-value">{store.brandColor}</span>
                                        </div>
                                    </div>
                                    <div className="color-picker-item">
                                        <label>Color secundario</label>
                                        <div className="color-picker-wrapper">
                                            <input
                                                type="color"
                                                value={store.accentColor}
                                                onChange={e => dispatch({ type: 'UPDATE_STORE', payload: { accentColor: e.target.value } })}
                                                className="color-input"
                                            />
                                            <span className="color-value">{store.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="color-preview" style={{
                                    background: `linear-gradient(135deg, ${store.brandColor}, ${store.accentColor})`
                                }}>
                                    <span>Vista previa de tus colores</span>
                                </div>
                            </div>
                        </div>

                        <div className="onboarding-actions">
                            <button className="btn btn-primary btn-lg" onClick={handleInfoSubmit}>
                                Siguiente: Elegir plantilla →
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ============ STEP 2: Template Selection ============ */
                    <div className="onboarding-section animate-fade-in-up">
                        <div className="page-header">
                            <h1>Elige tu plantilla</h1>
                            <p>Selecciona el diseño que mejor represente tu marca</p>
                        </div>

                        <div className="templates-grid stagger" id="template-picker">
                            {TEMPLATES.map(tpl => (
                                <div
                                    key={tpl.id}
                                    className={`template-card card ${store.template?.id === tpl.id ? 'template-selected' : ''}`}
                                    onClick={() => handleTemplateSelect(tpl)}
                                >
                                    <div className="template-preview" style={{ background: tpl.preview }}>
                                        <span className="template-emoji">{tpl.emoji}</span>
                                        {store.template?.id === tpl.id && (
                                            <div className="template-check">✓</div>
                                        )}
                                        {/* Mini layout preview */}
                                        <div className={`template-layout template-layout-${tpl.layout}`}>
                                            {tpl.layout === 'grid' && (
                                                <>
                                                    <div className="tl-box"></div>
                                                    <div className="tl-box"></div>
                                                    <div className="tl-box"></div>
                                                    <div className="tl-box"></div>
                                                </>
                                            )}
                                            {tpl.layout === 'masonry' && (
                                                <>
                                                    <div className="tl-box tl-tall"></div>
                                                    <div className="tl-box"></div>
                                                    <div className="tl-box"></div>
                                                    <div className="tl-box tl-tall"></div>
                                                </>
                                            )}
                                            {tpl.layout === 'list' && (
                                                <>
                                                    <div className="tl-line"></div>
                                                    <div className="tl-line"></div>
                                                    <div className="tl-line"></div>
                                                </>
                                            )}
                                            {tpl.layout === 'carousel' && (
                                                <>
                                                    <div className="tl-box tl-wide"></div>
                                                    <div className="tl-dots">
                                                        <span></span><span></span><span></span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="template-info">
                                        <h3>{tpl.name}</h3>
                                        <p>{tpl.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="onboarding-actions">
                            <button className="btn btn-outline" onClick={() => setSubStep(0)}>
                                ← Volver
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleContinue}
                                disabled={!store.template}
                            >
                                Continuar: Agregar productos →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
