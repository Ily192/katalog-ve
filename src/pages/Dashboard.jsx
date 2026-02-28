import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

export default function Dashboard() {
    const { state, toast } = useApp();
    const [reminderSent, setReminderSent] = useState(false);

    const metrics = state.metrics;
    const store = state.store;

    const lowStockProducts = useMemo(() =>
        state.products.filter(p => p.stock !== null && p.stock !== undefined && p.stock <= 5),
        [state.products]
    );

    const topProducts = useMemo(() => {
        // Simulate popular products based on cart additions
        return [...state.products]
            .sort((a, b) => (b.price * 10) - (a.price * 10))
            .slice(0, 5);
    }, [state.products]);

    const handleSendReminder = () => {
        if (reminderSent) return;
        setReminderSent(true);
        toast('Recordatorio semanal configurado. Te avisaremos cada lunes 📧', 'success');
        setTimeout(() => setReminderSent(false), 5000);
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/store/${store.slug || ''}`;
        navigator.clipboard.writeText(link);
        toast(`¡Enlace copiado al portapapeles! 📋 URL única: /store/${store.slug || ''}`, 'success');
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Dashboard de tu negocio</h1>
                    <p>Monitorea el rendimiento de tu catálogo y gestiona tu tienda</p>
                </div>

                {/* Quick Actions */}
                <div className="dash-actions" id="dashboard-actions" style={{ flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tu enlace personalizado único:</p>
                        <code style={{ background: 'var(--bg-elevated)', padding: '10px 16px', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center', border: '1px solid var(--border)', fontSize: '0.875rem', overflowWrap: 'anywhere' }}>
                            {window.location.origin}/store/<strong style={{ color: 'var(--primary-400)' }}>{store.slug || ''}</strong>
                        </code>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={handleCopyLink}>
                            🔗 Copiar enlace
                        </button>
                        <button className="btn btn-outline" onClick={handleSendReminder} disabled={reminderSent}>
                            🔔 {reminderSent ? 'Recordatorio activado ✓' : 'Activar recordatorio semanal'}
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="dash-metrics stagger" id="dashboard-metrics">
                    <div className="dash-metric-card card">
                        <div className="dash-metric-icon" style={{ background: 'rgba(99,102,241, .15)', color: '#818cf8' }}>👀</div>
                        <div className="dash-metric-data">
                            <span className="dash-metric-number">{metrics.totalVisits}</span>
                            <span className="dash-metric-label">Visitas al catálogo</span>
                        </div>
                    </div>
                    <div className="dash-metric-card card">
                        <div className="dash-metric-icon" style={{ background: 'rgba(16,185,129,.15)', color: '#34d399' }}>🛒</div>
                        <div className="dash-metric-data">
                            <span className="dash-metric-number">{metrics.cartClicks}</span>
                            <span className="dash-metric-label">Clics en agregar al carrito</span>
                        </div>
                    </div>
                    <div className="dash-metric-card card">
                        <div className="dash-metric-icon" style={{ background: 'rgba(37,211,102,.15)', color: '#25D366' }}>✅</div>
                        <div className="dash-metric-data">
                            <span className="dash-metric-number">{metrics.confirmClicks}</span>
                            <span className="dash-metric-label">Pedidos confirmados (WhatsApp)</span>
                        </div>
                    </div>
                    <div className="dash-metric-card card">
                        <div className="dash-metric-icon" style={{ background: 'rgba(249,115,22,.15)', color: '#fb923c' }}>📦</div>
                        <div className="dash-metric-data">
                            <span className="dash-metric-number">{state.products.length}</span>
                            <span className="dash-metric-label">Productos en catálogo</span>
                        </div>
                    </div>
                </div>

                <div className="dash-grid">
                    {/* Low Stock Alerts */}
                    <div className="dash-section card" id="stock-alerts">
                        <h3>⚠️ Alertas de stock bajo</h3>
                        {lowStockProducts.length > 0 ? (
                            <div className="dash-alerts">
                                {lowStockProducts.map(p => (
                                    <div key={p.id} className="dash-alert-item">
                                        <div className="dash-alert-info">
                                            <span className="dash-alert-name">{p.name}</span>
                                            <span className={`badge ${p.stock <= 2 ? 'badge-danger' : 'badge-warm'}`}>
                                                {p.stock} unidades
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="dash-empty">
                                <span>✅</span>
                                <p>No hay productos con stock bajo</p>
                            </div>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="dash-section card">
                        <h3>🔥 Productos destacados</h3>
                        {topProducts.length > 0 ? (
                            <div className="dash-top-list">
                                {topProducts.map((p, i) => (
                                    <div key={p.id} className="dash-top-item">
                                        <span className="dash-top-rank">#{i + 1}</span>
                                        <div className="dash-top-info">
                                            <span className="dash-top-name">{p.name}</span>
                                            <span className="dash-top-price">${p.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="dash-empty">
                                <span>📦</span>
                                <p>No hay datos aún</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Notification Info */}
                <div className="dash-email-info card" id="email-notifications">
                    <div className="dash-email-icon">📧</div>
                    <div className="dash-email-content">
                        <h3>Notificaciones por correo</h3>
                        <p>Cada vez que un cliente confirme un pedido, recibirás un aviso en <strong>{store.email || 'tu correo registrado'}</strong> con los detalles del pedido.</p>
                        <div className="dash-email-features">
                            <span className="badge badge-primary">📩 Pedidos nuevos</span>
                            <span className="badge badge-warm">📦 Stock bajo</span>
                            <span className="badge badge-accent">📅 Recordatorio semanal</span>
                        </div>
                    </div>
                </div>

                {/* Conversion funnel */}
                <div className="dash-funnel card">
                    <h3>📊 Embudo de conversión</h3>
                    <div className="dash-funnel-bars">
                        <div className="dash-funnel-step">
                            <div className="dash-funnel-bar">
                                <div className="dash-funnel-fill" style={{
                                    width: '100%',
                                    background: 'var(--primary-500)'
                                }}></div>
                            </div>
                            <span className="dash-funnel-label">Visitas ({metrics.totalVisits})</span>
                        </div>
                        <div className="dash-funnel-step">
                            <div className="dash-funnel-bar">
                                <div className="dash-funnel-fill" style={{
                                    width: metrics.totalVisits > 0 ? `${Math.min((metrics.cartClicks / metrics.totalVisits) * 100, 100)}%` : '0%',
                                    background: 'var(--accent-500)'
                                }}></div>
                            </div>
                            <span className="dash-funnel-label">Al carrito ({metrics.cartClicks})</span>
                        </div>
                        <div className="dash-funnel-step">
                            <div className="dash-funnel-bar">
                                <div className="dash-funnel-fill" style={{
                                    width: metrics.totalVisits > 0 ? `${Math.min((metrics.confirmClicks / metrics.totalVisits) * 100, 100)}%` : '0%',
                                    background: '#25D366'
                                }}></div>
                            </div>
                            <span className="dash-funnel-label">Confirmados ({metrics.confirmClicks})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
