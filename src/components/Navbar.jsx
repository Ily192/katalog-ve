import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Navbar.css';

export default function Navbar() {
    const { state, dispatch } = useApp();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        navigate('/login');
    };

    const links = [
        { to: '/setup', label: '⚙️ Configurar', id: 'nav-setup' },
        { to: '/products', label: '📦 Productos', id: 'nav-products' },
        { to: `/store/${state.store.slug || ''}`, label: '🏪 Mi Tienda', id: 'nav-store' },
        { to: '/dashboard', label: '📊 Dashboard', id: 'nav-dashboard' },
    ];

    return (
        <nav className="navbar glass">
            <div className="navbar-inner container">
                <div className="navbar-brand" onClick={() => navigate('/setup')}>
                    <span className="navbar-logo">🚀</span>
                    <span className="navbar-title">Katalog</span>
                </div>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    {links.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            id={link.id}
                            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                    <button className="btn btn-ghost btn-sm navbar-logout" onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                </div>

                <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
                        <span></span><span></span><span></span>
                    </span>
                </button>
            </div>
        </nav>
    );
}
