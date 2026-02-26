import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';

// Replicate the header normalization and column finder from ProductManager
function normalizeHeader(h) {
    if (typeof h !== 'string') return '';
    return h
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function findColumn(row, ...candidates) {
    for (const key of Object.keys(row)) {
        const normalized = normalizeHeader(key);
        for (const candidate of candidates) {
            if (normalized === candidate) return row[key];
        }
    }
    return '';
}

function parseCSVData(data) {
    return data
        .filter(row => {
            const name = findColumn(row, 'nombre', 'name', 'producto', 'product');
            return name && name.toString().trim().length > 0;
        })
        .map(row => ({
            name: findColumn(row, 'nombre', 'name', 'producto', 'product').trim(),
            description: findColumn(row, 'descripcion', 'description', 'desc').trim(),
            code: findColumn(row, 'codigo', 'code', 'sku', 'ref').trim(),
            price: parseFloat(findColumn(row, 'precio', 'price', 'valor', 'costo') || 0),
            stock: findColumn(row, 'stock', 'cantidad', 'quantity') || null,
            image: findColumn(row, 'imagen', 'image', 'foto', 'img', 'url').trim(),
        }));
}

describe('CSV Parsing', () => {
    it('should parse CSV with Spanish headers', () => {
        const csv = `nombre,descripcion,precio,codigo,stock
Camisa,Camisa roja,25.00,SKU-001,10
Pantalón,Pantalón azul,45.50,SKU-002,5`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(2);
        expect(products[0].name).toBe('Camisa');
        expect(products[0].price).toBe(25);
        expect(products[1].name).toBe('Pantalón');
        expect(products[1].code).toBe('SKU-002');
    });

    it('should parse CSV with English headers', () => {
        const csv = `name,description,price,code,stock
Shirt,Red shirt,25.00,SKU-001,10`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(1);
        expect(products[0].name).toBe('Shirt');
    });

    it('should handle headers with BOM', () => {
        const csv = `\uFEFFnombre,precio
Producto BOM,15.00`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(1);
        expect(products[0].name).toBe('Producto BOM');
    });

    it('should handle headers with extra spaces', () => {
        const csv = ` nombre , precio , descripcion 
Con Espacios,29.99,Producto con espacios`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(1);
        expect(products[0].name).toBe('Con Espacios');
        expect(products[0].price).toBe(29.99);
    });

    it('should handle headers with accents (Descripción)', () => {
        const csv = `Nombre,Descripción,Precio
Acentuado,Con tildes,50`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(1);
        expect(products[0].description).toBe('Con tildes');
    });

    it('should skip empty rows', () => {
        const csv = `nombre,precio
Producto1,10

Producto2,20
,,`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(2);
    });

    it('should return empty for CSV with no valid products', () => {
        const csv = `col1,col2
data1,data2`;

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(0);
    });

    it('should handle large product sets', () => {
        let csv = 'nombre,precio\n';
        for (let i = 0; i < 100; i++) {
            csv += `Producto ${i},${(i * 1.5).toFixed(2)}\n`;
        }

        const results = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
        const products = parseCSVData(results.data);

        expect(products.length).toBe(100);
    });
});

describe('Header normalization', () => {
    it('should strip BOM', () => {
        expect(normalizeHeader('\uFEFFnombre')).toBe('nombre');
    });

    it('should lowercase', () => {
        expect(normalizeHeader('NOMBRE')).toBe('nombre');
    });

    it('should remove accents', () => {
        expect(normalizeHeader('Descripción')).toBe('descripcion');
    });

    it('should remove special characters', () => {
        expect(normalizeHeader('item-name_1')).toBe('itemname1');
    });

    it('should return empty for non-string', () => {
        expect(normalizeHeader(null)).toBe('');
        expect(normalizeHeader(undefined)).toBe('');
    });
});
