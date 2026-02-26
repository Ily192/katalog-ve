import { describe, it, expect } from 'vitest';

describe('WhatsApp Message Builder', () => {
    function buildWhatsAppMessage(cart, storeName, cartTotal) {
        const phone = '584121234567';
        let message = `🛒 *Pedido de ${storeName || 'Tienda'}*\n\n`;
        cart.forEach((item, i) => {
            message += `${i + 1}. ${item.product.name} x${item.quantity} — $${(item.product.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n💰 *Total: $${cartTotal.toFixed(2)}*\n\n`;
        message += `¡Hola! Quiero confirmar este pedido. ¿Me puedes indicar los medios de pago disponibles? 🙏`;

        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        return { message, waUrl };
    }

    it('should format message correctly for single item', () => {
        const cart = [{ productId: 1, product: { name: 'Camisa', price: 25 }, quantity: 1 }];
        const { message } = buildWhatsAppMessage(cart, 'Mi Tienda', 25);

        expect(message).toContain('Pedido de Mi Tienda');
        expect(message).toContain('1. Camisa x1 — $25.00');
        expect(message).toContain('Total: $25.00');
    });

    it('should format multiple items with correct total', () => {
        const cart = [
            { productId: 1, product: { name: 'Zapato', price: 50 }, quantity: 2 },
            { productId: 2, product: { name: 'Bolso', price: 30 }, quantity: 1 },
        ];
        const total = 50 * 2 + 30;
        const { message } = buildWhatsAppMessage(cart, 'Tienda Ropa', total);

        expect(message).toContain('1. Zapato x2 — $100.00');
        expect(message).toContain('2. Bolso x1 — $30.00');
        expect(message).toContain('Total: $130.00');
    });

    it('should generate valid WhatsApp URL', () => {
        const cart = [{ productId: 1, product: { name: 'Test', price: 10 }, quantity: 1 }];
        const { waUrl } = buildWhatsAppMessage(cart, 'Shop', 10);

        expect(waUrl).toMatch(/^https:\/\/wa\.me\/584121234567\?text=/);
        expect(waUrl).toContain(encodeURIComponent('Pedido de Shop'));
    });

    it('should handle products with decimal prices', () => {
        const cart = [{ productId: 1, product: { name: 'Item', price: 9.99 }, quantity: 3 }];
        const total = 9.99 * 3;
        const { message } = buildWhatsAppMessage(cart, 'Tienda', total);

        expect(message).toContain('$29.97');
    });

    it('should use default store name when empty', () => {
        const cart = [{ productId: 1, product: { name: 'X', price: 5 }, quantity: 1 }];
        const { message } = buildWhatsAppMessage(cart, '', 5);

        expect(message).toContain('Pedido de Tienda');
    });
});

describe('Cart calculations', () => {
    it('should calculate cart total correctly', () => {
        const cart = [
            { productId: 1, product: { price: 10 }, quantity: 2 },
            { productId: 2, product: { price: 25.5 }, quantity: 1 },
            { productId: 3, product: { price: 7.99 }, quantity: 3 },
        ];
        const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        expect(total).toBeCloseTo(69.47, 2);
    });

    it('should calculate cart count correctly', () => {
        const cart = [
            { productId: 1, quantity: 2 },
            { productId: 2, quantity: 1 },
            { productId: 3, quantity: 3 },
        ];
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        expect(count).toBe(6);
    });

    it('should return 0 for empty cart', () => {
        const cart = [];
        const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        expect(total).toBe(0);
    });
});
