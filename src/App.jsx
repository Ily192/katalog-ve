import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toasts from './components/Toasts';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import ProductManager from './pages/ProductManager';
import CatalogBuilder from './pages/CatalogBuilder';
import StoreFront from './pages/StoreFront';
import Dashboard from './pages/Dashboard';
import './App.css';

function ProtectedRoute({ children }) {
    const { state } = useApp();
    if (!state.isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const { state } = useApp();

    return (
        <div className="app">
            <Toasts />
            {state.isAuthenticated && <Navbar />}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/setup" element={
                    <ProtectedRoute><Onboarding /></ProtectedRoute>
                } />
                <Route path="/products" element={
                    <ProtectedRoute><ProductManager /></ProtectedRoute>
                } />
                <Route path="/building" element={
                    <ProtectedRoute><CatalogBuilder /></ProtectedRoute>
                } />
                <Route path="/store/:storeSlug?" element={<StoreFront />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="*" element={
                    <Navigate to={state.isAuthenticated ? '/setup' : '/login'} replace />
                } />
            </Routes>
        </div>
    );
}
