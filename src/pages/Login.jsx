import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import './Login.css';

export default function Login() {
    const { dispatch, toast } = useApp();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/setup`
                }
            });
            if (error) throw error;
        } catch (err) {
            toast(`Error con Google: ${err.message}`, 'error');
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast('Completa todos los campos', 'error');
            return;
        }
        setLoading(true);

        try {
            if (isRegister) {
                // Registrar nuevo usuario
                const { error, data } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: { data: { name: form.name } }
                });

                if (error) throw error;

                toast('¡Cuenta creada exitosamente! Ahora inicias sesión automáticamente.', 'success');
                // Si la configuración de Supabase autologuea:
                if (data?.session) {
                    dispatch({
                        type: 'SET_USER',
                        payload: { id: data.user.id, email: data.user.email, name: form.name || form.email.split('@')[0] }
                    });
                    navigate('/setup');
                } else {
                    // Si requiere confirmación o no trae sesión
                    setIsRegister(false);
                    setForm(prev => ({ ...prev, password: '' }));
                }

            } else {
                // Iniciar sesión
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password
                });

                if (error) throw error;

                dispatch({
                    type: 'SET_USER',
                    payload: {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email.split('@')[0]
                    }
                });
                toast(`¡Bienvenido de vuelta, ${data.user.user_metadata?.name || data.user.email.split('@')[0]}! 🎉`, 'success');
                navigate('/setup');
            }
        } catch (err) {
            // Check for specific login errors to give a better alert
            if (err.message === 'Invalid login credentials' || err.message.includes('credential')) {
                toast('Correo o contraseña incorrectos. Si no tienes cuenta, regístrate primero.', 'error');
            } else {
                toast(`Error: ${err.message}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Decorative blobs */}
            <div className="login-blob login-blob-1"></div>
            <div className="login-blob login-blob-2"></div>
            <div className="login-blob login-blob-3"></div>

            <div className="login-container animate-fade-in-up">
                <div className="login-hero">
                    <span className="login-hero-emoji">🚀</span>
                    <h1>Katalog</h1>
                    <p>Tu tienda online con WhatsApp en minutos</p>
                    <div className="login-features">
                        <div className="login-feature">
                            <span>🎨</span>
                            <span>Plantillas premium</span>
                        </div>
                        <div className="login-feature">
                            <span>📱</span>
                            <span>WhatsApp directo</span>
                        </div>
                        <div className="login-feature">
                            <span>📊</span>
                            <span>Dashboard claro</span>
                        </div>
                    </div>
                </div>

                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <h2>{isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
                        <p>{isRegister ? 'Comienza a vender en minutos' : 'Bienvenido de vuelta'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {isRegister && (
                            <div className="input-group">
                                <label htmlFor="name">Nombre completo</label>
                                <input
                                    id="name"
                                    type="text"
                                    className="input-field"
                                    placeholder="Tu nombre"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="input-group">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="tu@negocio.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading || googleLoading}>
                            {loading ? (
                                <span className="login-spinner"></span>
                            ) : (
                                isRegister ? 'Crear cuenta 🚀' : 'Entrar ✨'
                            )}
                        </button>

                        <div className="login-divider">
                            <span>o usa</span>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline btn-lg login-google"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            {googleLoading ? (
                                <span className="login-spinner" style={{ borderColor: 'var(--text) transparent transparent transparent' }}></span>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar con Google
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-toggle">
                        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Inicia sesión' : 'Regístrate gratis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
