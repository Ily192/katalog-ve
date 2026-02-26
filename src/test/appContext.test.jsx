import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../context/AppContext';

// Helper component to interact with context
function TestComponent({ onRender }) {
    const ctx = useApp();
    onRender?.(ctx);
    return (
        <div>
            <span data-testid="auth">{ctx.state.isAuthenticated.toString()}</span>
            <span data-testid="products">{ctx.state.products.length}</span>
            <span data-testid="cart">{ctx.state.cart.length}</span>
            <span data-testid="toasts">{ctx.state.toasts.length}</span>
            <span data-testid="store-name">{ctx.state.store.name}</span>
        </div>
    );
}

function renderWithProvider(onRender) {
    return render(
        <AppProvider>
            <TestComponent onRender={onRender} />
        </AppProvider>
    );
}

describe('AppContext State Management', () => {
    let ctx;

    it('should start with initial state', () => {
        renderWithProvider((c) => (ctx = c));
        expect(screen.getByTestId('auth').textContent).toBe('false');
        expect(screen.getByTestId('products').textContent).toBe('0');
        expect(screen.getByTestId('cart').textContent).toBe('0');
    });

    it('should set user on SET_USER', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'SET_USER', payload: { name: 'Test', email: 'test@test.com' } });
        });
        expect(screen.getByTestId('auth').textContent).toBe('true');
    });

    it('should add a product on ADD_PRODUCT', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({
                type: 'ADD_PRODUCT',
                payload: { name: 'Camisa', price: 10, description: '', code: '', stock: 5, image: null },
            });
        });
        expect(screen.getByTestId('products').textContent).toBe('1');
    });

    it('should add bulk products on ADD_PRODUCTS_BULK', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({
                type: 'ADD_PRODUCTS_BULK',
                payload: [
                    { name: 'A', price: 1 },
                    { name: 'B', price: 2 },
                    { name: 'C', price: 3 },
                ],
            });
        });
        expect(screen.getByTestId('products').textContent).toBe('3');
    });

    it('should remove a product on REMOVE_PRODUCT', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'ADD_PRODUCT', payload: { name: 'X', price: 5 } });
        });
        expect(screen.getByTestId('products').textContent).toBe('1');
        // Product gets id 1 (first product)
        act(() => {
            ctx.dispatch({ type: 'REMOVE_PRODUCT', payload: 1 });
        });
        expect(screen.getByTestId('products').textContent).toBe('0');
    });

    it('should add to cart on ADD_TO_CART', () => {
        renderWithProvider((c) => (ctx = c));
        const product = { id: 1, name: 'Zapato', price: 50 };
        act(() => {
            ctx.dispatch({ type: 'ADD_TO_CART', payload: product });
        });
        expect(screen.getByTestId('cart').textContent).toBe('1');
    });

    it('should increment quantity if same product added to cart again', () => {
        renderWithProvider((c) => (ctx = c));
        const product = { id: 1, name: 'Zapato', price: 50 };
        act(() => {
            ctx.dispatch({ type: 'ADD_TO_CART', payload: product });
            ctx.dispatch({ type: 'ADD_TO_CART', payload: product });
        });
        // Still 1 item but quantity = 2
        expect(screen.getByTestId('cart').textContent).toBe('1');
        expect(ctx.state.cart[0].quantity).toBe(2);
    });

    it('should remove from cart on REMOVE_FROM_CART', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'ADD_TO_CART', payload: { id: 1, name: 'X', price: 10 } });
        });
        act(() => {
            ctx.dispatch({ type: 'REMOVE_FROM_CART', payload: 1 });
        });
        expect(screen.getByTestId('cart').textContent).toBe('0');
    });

    it('should clear cart on CLEAR_CART', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'ADD_TO_CART', payload: { id: 1, name: 'A', price: 5 } });
            ctx.dispatch({ type: 'ADD_TO_CART', payload: { id: 2, name: 'B', price: 10 } });
        });
        act(() => {
            ctx.dispatch({ type: 'CLEAR_CART' });
        });
        expect(screen.getByTestId('cart').textContent).toBe('0');
    });

    it('should update cart item quantity and remove if zero', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'ADD_TO_CART', payload: { id: 1, name: 'X', price: 10 } });
        });
        act(() => {
            ctx.dispatch({ type: 'UPDATE_CART_ITEM', payload: { productId: 1, quantity: 0 } });
        });
        expect(screen.getByTestId('cart').textContent).toBe('0');
    });

    it('should update store config on UPDATE_STORE', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'UPDATE_STORE', payload: { name: 'Mi Tienda' } });
        });
        expect(screen.getByTestId('store-name').textContent).toBe('Mi Tienda');
    });

    it('should increment metrics on INCREMENT_METRIC', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'INCREMENT_METRIC', payload: 'totalVisits' });
            ctx.dispatch({ type: 'INCREMENT_METRIC', payload: 'totalVisits' });
        });
        expect(ctx.state.metrics.totalVisits).toBe(2);
    });

    it('should reset state on LOGOUT', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.dispatch({ type: 'SET_USER', payload: { name: 'Test' } });
            ctx.dispatch({ type: 'ADD_PRODUCT', payload: { name: 'X', price: 5 } });
        });
        act(() => {
            ctx.dispatch({ type: 'LOGOUT' });
        });
        expect(screen.getByTestId('auth').textContent).toBe('false');
        expect(screen.getByTestId('products').textContent).toBe('0');
    });
});

describe('Toast system', () => {
    let ctx;

    it('should add and auto-remove toasts', async () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.toast('Test message', 'success');
        });
        expect(screen.getByTestId('toasts').textContent).toBe('1');
    });

    it('should manually remove toasts via REMOVE_TOAST', () => {
        renderWithProvider((c) => (ctx = c));
        act(() => {
            ctx.toast('First', 'info');
        });
        const toastId = ctx.state.toasts[0]?.id;
        expect(toastId).toBeDefined();
        act(() => {
            ctx.dispatch({ type: 'REMOVE_TOAST', payload: toastId });
        });
        expect(screen.getByTestId('toasts').textContent).toBe('0');
    });
});
