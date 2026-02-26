import { describe, it, expect } from 'vitest';
import {
    sanitizeText,
    sanitizeUrl,
    sanitizePhone,
    sanitizeEmail,
    sanitizePrice,
    sanitizeStock,
} from '../context/AppContext';

describe('Security: sanitizeText', () => {
    it('should escape HTML entities', () => {
        expect(sanitizeText('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    it('should trim whitespace', () => {
        expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should truncate to 500 chars', () => {
        const long = 'a'.repeat(600);
        expect(sanitizeText(long).length).toBe(500);
    });

    it('should return empty string for non-string input', () => {
        expect(sanitizeText(null)).toBe('');
        expect(sanitizeText(undefined)).toBe('');
        expect(sanitizeText(123)).toBe('');
    });

    it('should escape ampersands', () => {
        expect(sanitizeText('A & B')).toBe('A &amp; B');
    });

    it('should escape single quotes', () => {
        expect(sanitizeText("it's")).toBe("it&#x27;s");
    });
});

describe('Security: sanitizeUrl', () => {
    it('should allow http URLs', () => {
        expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
        expect(sanitizeUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    });

    it('should allow data:image URLs', () => {
        expect(sanitizeUrl('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
    });

    it('should block javascript: URLs', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should block data: non-image URLs', () => {
        expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should return empty for non-string input', () => {
        expect(sanitizeUrl(null)).toBe('');
    });
});

describe('Security: sanitizePhone', () => {
    it('should strip non-phone characters', () => {
        expect(sanitizePhone('+58 (412) 123-4567')).toBe('+58 (412) 123-4567');
    });

    it('should remove letters and special chars', () => {
        expect(sanitizePhone('abc+123!@#')).toBe('+123');
    });

    it('should truncate to 20 chars', () => {
        expect(sanitizePhone('1'.repeat(30)).length).toBe(20);
    });
});

describe('Security: sanitizeEmail', () => {
    it('should accept valid emails', () => {
        expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });

    it('should reject invalid emails', () => {
        expect(sanitizeEmail('not-an-email')).toBe('');
    });

    it('should lowercase emails', () => {
        expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should return empty for non-string', () => {
        expect(sanitizeEmail(null)).toBe('');
    });
});

describe('Security: sanitizePrice', () => {
    it('should parse valid prices', () => {
        expect(sanitizePrice('19.99')).toBe(19.99);
    });

    it('should return 0 for NaN', () => {
        expect(sanitizePrice('abc')).toBe(0);
    });

    it('should return 0 for negative prices', () => {
        expect(sanitizePrice('-5')).toBe(0);
    });

    it('should round to 2 decimal places', () => {
        expect(sanitizePrice('19.999')).toBe(20);
    });

    it('should return 0 for extremely large prices', () => {
        expect(sanitizePrice('9999999999')).toBe(0);
    });
});

describe('Security: sanitizeStock', () => {
    it('should parse valid stock values', () => {
        expect(sanitizeStock('100')).toBe(100);
    });

    it('should return null for empty values', () => {
        expect(sanitizeStock('')).toBeNull();
        expect(sanitizeStock(null)).toBeNull();
        expect(sanitizeStock(undefined)).toBeNull();
    });

    it('should return null for negative stock', () => {
        expect(sanitizeStock('-1')).toBeNull();
    });

    it('should return null for non-numeric', () => {
        expect(sanitizeStock('abc')).toBeNull();
    });
});
