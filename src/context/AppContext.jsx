import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

// ==========================================
// Security: Input sanitization utilities
// ==========================================
function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim()
        .slice(0, 500); // Max 500 chars
}

function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    // Only allow http, https, and data URIs (for base64 images)
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:image/')
    ) {
        return trimmed;
    }
    return '';
}

function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';
    return phone.replace(/[^0-9+\- ()]/g, '').slice(0, 20);
}

function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    const trimmed = email.trim().toLowerCase().slice(0, 254);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : '';
}

function sanitizePrice(val) {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 999999999) return 0;
    return Math.round(num * 100) / 100;
}

function sanitizeStock(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0 || num > 999999) return null;
    return num;
}

// Export for use in components
export {
    sanitizeText,
    sanitizeUrl,
    sanitizePhone,
    sanitizeEmail,
    sanitizePrice,
    sanitizeStock,
};

// ==========================================

let toastCounter = 0;

const initialState = {
    // Auth
    user: null,
    isAuthenticated: false,

    // Store config
    store: {
        name: '',
        description: '',
        logo: null,
        logoPreview: '',
        whatsapp: '',
        email: '',
        brandColor: '#6366f1',
        accentColor: '#10b981',
        template: null,
    },

    // Products
    products: [],
    nextProductId: 1,

    // Cart (for customer view)
    cart: [],

    // Dashboard metrics
    metrics: {
        totalVisits: 0,
        cartClicks: 0,
        confirmClicks: 0,
        popularProducts: [],
    },

    // UI state
    currentStep: 0,  // 0=setup, 1=template, 2=products, 3=building, 4=live
    toasts: [],
    catalogBuilt: false,
    tourActive: false,
    tourCompleted: false,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload, isAuthenticated: true };
        case 'LOGOUT':
            return { ...initialState };

        case 'UPDATE_STORE':
            return { ...state, store: { ...state.store, ...action.payload } };
        case 'SET_TEMPLATE':
            return { ...state, store: { ...state.store, template: action.payload } };
        case 'SET_STEP':
            return { ...state, currentStep: action.payload };

        case 'ADD_PRODUCT': {
            const id = state.nextProductId;
            return {
                ...state,
                products: [...state.products, { ...action.payload, id }],
                nextProductId: id + 1,
            };
        }
        case 'ADD_PRODUCTS_BULK': {
            let nextId = state.nextProductId;
            const newProducts = action.payload.map(p => ({ ...p, id: nextId++ }));
            return {
                ...state,
                products: [...state.products, ...newProducts],
                nextProductId: nextId,
            };
        }
        case 'UPDATE_PRODUCT':
            return {
                ...state,
                products: state.products.map(p =>
                    p.id === action.payload.id ? { ...p, ...action.payload } : p
                ),
            };
        case 'REMOVE_PRODUCT':
            return {
                ...state,
                products: state.products.filter(p => p.id !== action.payload),
            };

        case 'ADD_TO_CART': {
            const existing = state.cart.find(i => i.productId === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    cart: state.cart.map(i =>
                        i.productId === action.payload.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    ),
                };
            }
            return {
                ...state,
                cart: [...state.cart, { productId: action.payload.id, product: action.payload, quantity: 1 }],
            };
        }
        case 'UPDATE_CART_ITEM':
            return {
                ...state,
                cart: state.cart.map(i =>
                    i.productId === action.payload.productId
                        ? { ...i, quantity: action.payload.quantity }
                        : i
                ).filter(i => i.quantity > 0),
            };
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cart: state.cart.filter(i => i.productId !== action.payload),
            };
        case 'CLEAR_CART':
            return { ...state, cart: [] };

        case 'SET_CATALOG_BUILT':
            return { ...state, catalogBuilt: true };
        case 'INCREMENT_METRIC':
            return {
                ...state,
                metrics: {
                    ...state.metrics,
                    [action.payload]: (state.metrics[action.payload] || 0) + 1,
                },
            };

        // FIX: Toast now receives the id directly in the payload
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

        case 'SET_TOUR_ACTIVE':
            return { ...state, tourActive: action.payload };
        case 'SET_TOUR_COMPLETED':
            return { ...state, tourCompleted: true, tourActive: false };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const toast = useCallback((message, type = 'info') => {
        // FIX: Use a monotonic counter so the id used in ADD_TOAST and REMOVE_TOAST always match
        const id = ++toastCounter;
        dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch, toast }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

export default AppContext;
