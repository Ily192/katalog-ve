import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './StoreFront.css';

function WhatsAppIcon() {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function StoreFront() {
    const { state, dispatch, toast } = useApp();
    const [search, setSearch] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const store = state.store;
    const templateId = store.template?.id || 'elegant';

    // Track visits
    useEffect(() => {
        dispatch({ type: 'INCREMENT_METRIC', payload: 'totalVisits' });
    }, [dispatch]);

    const filteredProducts = useMemo(() => {
        if (!search.trim()) return state.products;
        const q = search.toLowerCase();
        return state.products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.code?.toLowerCase().includes(q)
        );
    }, [state.products, search]);

    const cartTotal = useMemo(() =>
        state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        [state.cart]
    );
    const cartCount = useMemo(() =>
        state.cart.reduce((sum, item) => sum + item.quantity, 0),
        [state.cart]
    );

    const handleAddToCart = (product) => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
        dispatch({ type: 'INCREMENT_METRIC', payload: 'cartClicks' });
        toast(`${product.name} agregado al carrito 🛒`, 'success');
    };

    const handleConfirmPurchase = () => {
        if (state.cart.length === 0) return;
        dispatch({ type: 'INCREMENT_METRIC', payload: 'confirmClicks' });

        // Build WhatsApp message
        const phone = store.whatsapp.replace(/[^0-9]/g, '');
        let message = `🛒 *Pedido de ${store.name || 'Tienda'}*\n\n`;
        state.cart.forEach((item, i) => {
            message += `${i + 1}. ${item.product.name} x${item.quantity} — $${(item.product.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n💰 *Total: $${cartTotal.toFixed(2)}*\n\n`;
        message += `¡Hola! Quiero confirmar este pedido. ¿Me puedes indicar los medios de pago disponibles? 🙏`;

        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
        toast('¡Redirigiendo a WhatsApp! 📱', 'success');
    };

    const updateQuantity = (productId, delta) => {
        const item = state.cart.find(i => i.productId === productId);
        if (item) {
            dispatch({
                type: 'UPDATE_CART_ITEM',
                payload: { productId, quantity: item.quantity + delta }
            });
        }
    };

    if (state.products.length === 0) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state">
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏪</div>
                        <h3>Esta tienda aún no tiene productos</h3>
                        <p>El dueño del negocio está preparando su catálogo</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="storefront" style={{
            '--store-primary': store.brandColor || '#6366f1',
            '--store-accent': store.accentColor || '#10b981',
        }}>
            {/* ========= HEADER ========= */}
            <header className="sf-header">
                <div className="sf-header-bg" style={{
                    background: `linear-gradient(135deg, ${store.brandColor}22, ${store.accentColor}22)`
                }}></div>
                <div className="container sf-header-inner">
                    <div className="sf-brand">
                        {store.logoPreview ? (
                            <img src={store.logoPreview} alt={store.name} className="sf-logo" />
                        ) : (
                            <div className="sf-logo-fallback" style={{ background: store.brandColor }}>
                                {(store.name || 'T')[0]}
                            </div>
                        )}
                        <div>
                            <h1 className="sf-store-name">{store.name || 'Mi Tienda'}</h1>
                            {store.description && <p className="sf-store-desc">{store.description}</p>}
                        </div>
                    </div>
                    <div className="sf-actions">
                        <div className="sf-search">
                            <input
                                className="input-field"
                                placeholder="🔍 Buscar productos..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="sf-cart-btn" onClick={() => setCartOpen(true)} id="cart-button">
                            🛒
                            {cartCount > 0 && <span className="sf-cart-badge">{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </header>

            {/* ========= PRODUCTS GRID ========= */}
            <main className="sf-main container">
                <div className={`sf-products sf-template-${templateId} stagger`}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="sf-product-card"
                            onClick={() => setSelectedProduct(product)}
                        >
                            <div className="sf-product-image">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} />
                                ) : (
                                    <div className="sf-product-no-image">📦</div>
                                )}
                                {product.stock !== null && product.stock !== undefined && product.stock <= 5 && (
                                    <span className="sf-product-stock-badge">¡Últimas unidades!</span>
                                )}
                            </div>
                            <div className="sf-product-info">
                                <h3>{product.name}</h3>
                                {product.description && <p>{product.description}</p>}
                                <div className="sf-product-footer">
                                    <span className="sf-product-price" style={{ color: store.brandColor }}>
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <button
                                        className="btn btn-sm sf-add-btn"
                                        style={{ background: store.brandColor }}
                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                    >
                                        + Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                        <h3>No se encontraron productos</h3>
                        <p>Intenta con otro término de búsqueda</p>
                    </div>
                )}
            </main>

            {/* ========= CART DRAWER ========= */}
            {cartOpen && (
                <div className="sf-cart-overlay" onClick={() => setCartOpen(false)}>
                    <div className="sf-cart-drawer animate-slide-in" onClick={e => e.stopPropagation()} id="cart-drawer">
                        <div className="sf-cart-header">
                            <h2>🛒 Tu carrito</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCartOpen(false)}>✕</button>
                        </div>

                        {state.cart.length === 0 ? (
                            <div className="sf-cart-empty">
                                <span>🛒</span>
                                <p>Tu carrito está vacío</p>
                            </div>
                        ) : (
                            <>
                                <div className="sf-cart-items">
                                    {state.cart.map(item => (
                                        <div key={item.productId} className="sf-cart-item">
                                            <div className="sf-cart-item-image">
                                                {item.product.image ? (
                                                    <img src={item.product.image} alt={item.product.name} />
                                                ) : (
                                                    <div className="sf-cart-item-no-image">📦</div>
                                                )}
                                            </div>
                                            <div className="sf-cart-item-info">
                                                <h4>{item.product.name}</h4>
                                                <span className="sf-cart-item-price">${item.product.price.toFixed(2)}</span>
                                            </div>
                                            <div className="sf-cart-item-qty">
                                                <button onClick={() => updateQuantity(item.productId, -1)}>−</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.productId, 1)}>+</button>
                                            </div>
                                            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.productId })}>
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="sf-cart-footer">
                                    <div className="sf-cart-total">
                                        <span>Total</span>
                                        <span className="sf-cart-total-amount" style={{ color: store.brandColor }}>
                                            ${cartTotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="sf-cart-wa-notice">
                                        <WhatsAppIcon />
                                        <p>Te llevaremos a WhatsApp para aclarar dudas sobre productos y que obtengas todos nuestros medios de pago 💬</p>
                                    </div>

                                    <button
                                        className="btn btn-lg sf-confirm-btn"
                                        style={{ background: '#25D366' }}
                                        onClick={handleConfirmPurchase}
                                        id="confirm-purchase-btn"
                                    >
                                        <WhatsAppIcon />
                                        Confirmar pedido por WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ========= PRODUCT DETAIL MODAL ========= */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-content sf-detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost sf-detail-close" onClick={() => setSelectedProduct(null)}>✕</button>
                        <div className="sf-detail-image">
                            {selectedProduct.image ? (
                                <img src={selectedProduct.image} alt={selectedProduct.name} />
                            ) : (
                                <div className="sf-detail-no-image">📦</div>
                            )}
                        </div>
                        <h2>{selectedProduct.name}</h2>
                        {selectedProduct.description && <p className="sf-detail-desc">{selectedProduct.description}</p>}
                        {selectedProduct.code && <span className="badge badge-accent">Código: {selectedProduct.code}</span>}
                        <div className="sf-detail-price" style={{ color: store.brandColor }}>
                            ${selectedProduct.price.toFixed(2)}
                        </div>
                        {selectedProduct.stock !== null && selectedProduct.stock !== undefined && (
                            <span className={`badge ${selectedProduct.stock <= 5 ? 'badge-danger' : 'badge-warm'}`}>
                                Stock: {selectedProduct.stock}
                            </span>
                        )}
                        <button
                            className="btn btn-lg sf-detail-add"
                            style={{ background: store.brandColor }}
                            onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                        >
                            Agregar al carrito 🛒
                        </button>
                    </div>
                </div>
            )}

            {/* ========= WhatsApp FAB ========= */}
            <a
                className="whatsapp-fab"
                href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Estoy viendo tu catálogo online y tengo una pregunta 👋')}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                <WhatsAppIcon />
            </a>
        </div>
    );
}
