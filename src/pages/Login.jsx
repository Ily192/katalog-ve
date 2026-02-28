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
                        <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
                            {loading ? (
                                <span className="login-spinner"></span>
                            ) : (
                                isRegister ? 'Crear cuenta 🚀' : 'Entrar ✨'
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
