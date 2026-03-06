import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, sanitizeText, sanitizePrice, sanitizeStock, sanitizeUrl } from '../context/AppContext';
import Papa from 'papaparse';
import JSZip from 'jszip';
import imageCompression from 'browser-image-compression';
import './ProductManager.css';

// ==========================================
// Security: Normalize CSV headers robustly
// ==========================================
function normalizeHeader(h) {
    if (typeof h !== 'string') return '';
    // Remove BOM, trim, lowercase, remove accents
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

export default function ProductManager() {
    const { state, dispatch, toast } = useApp();
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const csvRef = useRef(null);
    const zipRef = useRef(null);

    const [tab, setTab] = useState('manual'); // manual | bulk
    const [form, setForm] = useState({
        name: '', description: '', code: '', price: '', stock: '', image: null, imagePreview: ''
    });
    const [sheetsUrl, setSheetsUrl] = useState('');
    const [sheetsLoading, setSheetsLoading] = useState(false);
    const [zipImages, setZipImages] = useState({}); // filename -> dataURL
    const [zipLoading, setZipLoading] = useState(false);

    // ==========================================
    // Image upload for manual
    // ==========================================
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Security: validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            toast('Formato de imagen no soportado. Usa JPG, PNG, WebP o GIF.', 'error');
            return;
        }

        toast('Optimizando imagen...', 'info');

        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressedFile = await imageCompression(file, options);

            const reader = new FileReader();
            reader.onload = (ev) => {
                setForm(f => ({ ...f, image: compressedFile, imagePreview: ev.target.result }));
                toast('Imagen optimizada y ajustada con éxito', 'success');
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            toast('Ocurrió un error al optimizar la imagen', 'error');
        }
    };

    // ==========================================
    // Manual product add
    // ==========================================
    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) {
            toast('Nombre y precio son obligatorios', 'error');
            return;
        }
        dispatch({
            type: 'ADD_PRODUCT',
            payload: {
                name: sanitizeText(form.name),
                description: sanitizeText(form.description),
                code: sanitizeText(form.code),
                price: sanitizePrice(form.price),
                stock: sanitizeStock(form.stock),
                image: form.imagePreview || null,
            }
        });
        toast(`Producto "${form.name.trim()}" agregado ✅`, 'success');
        setForm({ name: '', description: '', code: '', price: '', stock: '', image: null, imagePreview: '' });
    };

    // ==========================================
    // CSV Upload (robust header parsing)
    // ==========================================
    const parseCSVData = (data) => {
        const products = data
            .filter(row => {
                const name = findColumn(row, 'nombre', 'name', 'producto', 'product', 'titulo', 'title');
                return name && name.toString().trim().length > 0;
            })
            .map(row => ({
                name: sanitizeText(findColumn(row, 'nombre', 'name', 'producto', 'product', 'titulo', 'title')),
                description: sanitizeText(findColumn(row, 'descripcion', 'description', 'desc')),
                code: sanitizeText(findColumn(row, 'codigo', 'code', 'sku', 'ref', 'referencia')),
                price: sanitizePrice(findColumn(row, 'precio', 'price', 'valor', 'costo', 'cost')),
                stock: sanitizeStock(findColumn(row, 'stock', 'cantidad', 'quantity', 'inventario')),
                image: sanitizeUrl(findColumn(row, 'imagen', 'image', 'foto', 'photo', 'img', 'url')),
            }));
        return products;
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Security: validate file extension and size
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast('Por favor sube un archivo .csv', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast('El archivo CSV es muy grande. Máx. 10 MB.', 'error');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (h) => h.trim(), // trim whitespace and BOM from headers
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parse warnings:', results.errors);
                }

                const products = parseCSVData(results.data);

                if (products.length === 0) {
                    const headers = results.meta.fields || [];
                    toast(
                        `No se encontraron productos. Columnas detectadas: ${headers.join(', ') || 'ninguna'}. Usa: nombre, precio, descripcion, codigo, stock`,
                        'error'
                    );
                    return;
                }

                // Assign zip images if available
                const productsWithImages = products.map(p => {
                    if (!p.image && Object.keys(zipImages).length > 0) {
                        // Try to match by product name or code
                        const matchKey = Object.keys(zipImages).find(filename => {
                            const base = filename.replace(/\.[^.]+$/, '').toLowerCase();
                            return base === p.name.toLowerCase() ||
                                base === p.code?.toLowerCase() ||
                                p.name.toLowerCase().includes(base) ||
                                base.includes(p.name.toLowerCase());
                        });
                        if (matchKey) {
                            return { ...p, image: zipImages[matchKey] };
                        }
                    }
                    return p;
                });

                dispatch({ type: 'ADD_PRODUCTS_BULK', payload: productsWithImages });
                toast(`${productsWithImages.length} productos importados desde CSV 🎉`, 'success');
            },
            error: (err) => {
                console.error('CSV parse error:', err);
                toast('Error al leer el archivo CSV. Verifica el formato.', 'error');
            },
        });
        // Reset the input
        if (csvRef.current) csvRef.current.value = '';
    };

    // ==========================================
    // Google Sheets Link
    // ==========================================
    const handleSheetsImport = () => {
        const link = sheetsUrl.trim();
        if (!link) {
            toast('Pega el enlace de tu Google Sheets', 'error');
            return;
        }

        // Security: validate it's a Google Sheets URL
        if (!link.includes('docs.google.com/spreadsheets')) {
            toast('El enlace no parece ser de Google Sheets. Verifica e intenta de nuevo.', 'error');
            return;
        }

        // Convert to CSV export URL
        let csvUrl = link;
        const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            // Extract gid if present
            const gidMatch = link.match(/gid=(\d+)/);
            const gid = gidMatch ? gidMatch[1] : '0';
            csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
        } else {
            toast('No se pudo extraer el ID del documento. Verifica el enlace.', 'error');
            return;
        }

        setSheetsLoading(true);
        toast('Descargando datos de Google Sheets...', 'info');

        fetch(csvUrl)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            })
            .then(text => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: 'greedy',
                    transformHeader: (h) => h.trim(),
                    complete: (results) => {
                        const products = parseCSVData(results.data);
                        if (products.length === 0) {
                            toast('No se encontraron productos válidos en la hoja de cálculo.', 'error');
                            setSheetsLoading(false);
                            return;
                        }
                        dispatch({ type: 'ADD_PRODUCTS_BULK', payload: products });
                        toast(`${products.length} productos importados de Google Sheets 🎉`, 'success');
                        setSheetsUrl('');
                        setSheetsLoading(false);
                    }
                });
            })
            .catch((err) => {
                console.error('Sheets fetch error:', err);
                toast(
                    'No se pudo acceder al enlace. Asegúrate de que la hoja sea pública (Archivo → Compartir → Cualquiera con el enlace).',
                    'error'
                );
                setSheetsLoading(false);
            });
    };

    // ==========================================
    // ZIP Upload — Extract images properly
    // ==========================================
    const handleZipUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Security: validate file
        if (!file.name.toLowerCase().endsWith('.zip')) {
            toast('Por favor sube un archivo .zip', 'error');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast('El archivo ZIP es muy grande. Máx. 50 MB.', 'error');
            return;
        }

        setZipLoading(true);
        toast('Extrayendo imágenes del ZIP...', 'info');

        try {
            const zip = await JSZip.loadAsync(file);
            const imageFiles = {};
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

            const entries = Object.entries(zip.files).filter(([name, entry]) => {
                if (entry.dir) return false;
                // Skip macOS metadata files
                if (name.startsWith('__MACOSX') || name.startsWith('.')) return false;
                const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
                return allowedExtensions.includes(ext);
            });

            if (entries.length === 0) {
                toast('No se encontraron imágenes válidas en el ZIP (JPG, PNG, WebP, GIF).', 'error');
                setZipLoading(false);
                return;
            }

            for (const [name, entry] of entries) {
                const blob = await entry.async('blob');
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
                // Use just the filename (without path) as key
                const basename = name.split('/').pop();
                imageFiles[basename] = dataUrl;
            }

            setZipImages(imageFiles);

            // If there are already products without images, try to assign zip images
            if (state.products.length > 0) {
                let matched = 0;
                state.products.forEach(p => {
                    if (!p.image) {
                        const matchKey = Object.keys(imageFiles).find(filename => {
                            const base = filename.replace(/\.[^.]+$/, '').toLowerCase();
                            return base === p.name.toLowerCase() ||
                                base === p.code?.toLowerCase() ||
                                p.name.toLowerCase().includes(base) ||
                                base.includes(p.name.toLowerCase());
                        });
                        if (matchKey) {
                            dispatch({
                                type: 'UPDATE_PRODUCT',
                                payload: { id: p.id, image: imageFiles[matchKey] }
                            });
                            matched++;
                        }
                    }
                });
                if (matched > 0) {
                    toast(`✅ ${matched} imágenes asignadas a productos existentes`, 'success');
                }
            }

            toast(`📁 ${Object.keys(imageFiles).length} imágenes extraídas del ZIP. Se asignarán automáticamente a los productos por nombre.`, 'success');
            setZipLoading(false);
        } catch (err) {
            console.error('ZIP extraction error:', err);
            toast('Error al procesar el archivo ZIP.', 'error');
            setZipLoading(false);
        }

        if (zipRef.current) zipRef.current.value = '';
    };

    const handleRemove = (id) => {
        dispatch({ type: 'REMOVE_PRODUCT', payload: id });
        toast('Producto eliminado', 'info');
    };

    const handleBuildCatalog = () => {
        if (state.products.length === 0) {
            toast('Agrega al menos un producto antes de continuar', 'error');
            return;
        }
        navigate('/building');
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Agrega tus productos</h1>
                    <p>Sube tus productos de forma manual o masiva desde un CSV o Google Sheets</p>
                </div>

                {/* Tabs */}
                <div className="pm-tabs" id="product-upload-tabs">
                    <button
                        className={`pm-tab ${tab === 'manual' ? 'active' : ''}`}
                        onClick={() => setTab('manual')}
                    >
                        ✏️ Manual
                    </button>
                    <button
                        className={`pm-tab ${tab === 'bulk' ? 'active' : ''}`}
                        onClick={() => setTab('bulk')}
                    >
                        📤 Carga masiva
                    </button>
                </div>

                <div className="pm-content">
                    {tab === 'manual' ? (
                        /* ============ MANUAL FORM ============ */
                        <form className="pm-form card animate-fade-in" onSubmit={handleAddProduct}>
                            <div className="pm-form-grid">
                                <div className="pm-image-upload" onClick={() => fileRef.current?.click()}>
                                    {form.imagePreview ? (
                                        <img src={form.imagePreview} alt="" className="pm-image-preview" />
                                    ) : (
                                        <div className="pm-image-placeholder">
                                            <span>📷</span>
                                            <span>Foto del producto</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Ideal: 1:1 (Cuadrada)</span>
                                        </div>
                                    )}
                                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
                                </div>

                                <div className="pm-fields">
                                    <div className="input-group">
                                        <label>Nombre del producto *</label>
                                        <input
                                            className="input-field"
                                            placeholder="Ej: Camisa deportiva"
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            maxLength={200}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Descripción breve</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Describe el producto..."
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            rows={2}
                                            maxLength={500}
                                        />
                                    </div>
                                    <div className="pm-row">
                                        <div className="input-group">
                                            <label>Precio *</label>
                                            <input
                                                className="input-field"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="999999999"
                                                placeholder="0.00"
                                                value={form.price}
                                                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Código (opcional)</label>
                                            <input
                                                className="input-field"
                                                placeholder="SKU-001"
                                                value={form.code}
                                                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                                maxLength={50}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Stock</label>
                                            <input
                                                className="input-field"
                                                type="number"
                                                min="0"
                                                max="999999"
                                                placeholder="∞"
                                                value={form.stock}
                                                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-accent">
                                        Agregar producto ＋
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* ============ BULK UPLOAD ============ */
                        <div className="pm-bulk card animate-fade-in" id="bulk-upload-section">
                            <div className="pm-bulk-options">
                                <div className="pm-bulk-card" onClick={() => csvRef.current?.click()}>
                                    <span className="pm-bulk-icon">📄</span>
                                    <h4>Subir CSV</h4>
                                    <p>Archivo .csv con columnas: nombre, descripcion, precio, codigo, stock</p>
                                    <input ref={csvRef} type="file" accept=".csv" hidden onChange={handleCSVUpload} />
                                </div>

                                <div className="pm-bulk-card pm-sheets-card">
                                    <span className="pm-bulk-icon">📊</span>
                                    <h4>Google Sheets</h4>
                                    <p>Pega el enlace público de tu hoja de cálculo</p>
                                    <input
                                        className="input-field pm-sheets-input"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={sheetsUrl}
                                        onChange={e => setSheetsUrl(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <button
                                        className="btn btn-sm btn-primary pm-sheets-btn"
                                        onClick={(e) => { e.stopPropagation(); handleSheetsImport(); }}
                                        disabled={sheetsLoading}
                                    >
                                        {sheetsLoading ? '⏳ Importando...' : '📥 Importar'}
                                    </button>
                                </div>

                                <div className="pm-bulk-card" onClick={() => zipRef.current?.click()}>
                                    <span className="pm-bulk-icon">🗂️</span>
                                    <h4>Fotos (.zip)</h4>
                                    <p>Sube un .zip con las imágenes de tus productos</p>
                                    {zipLoading && <div className="pm-zip-loading">⏳ Extrayendo...</div>}
                                    {Object.keys(zipImages).length > 0 && (
                                        <div className="pm-zip-count">
                                            ✅ {Object.keys(zipImages).length} imágenes listas
                                        </div>
                                    )}
                                    <input ref={zipRef} type="file" accept=".zip" hidden onChange={handleZipUpload} />
                                </div>
                            </div>

                            <div className="pm-bulk-hint">
                                <span>💡</span>
                                <span>
                                    Formato esperado del CSV: <code>nombre, descripcion, precio, codigo, stock, imagen</code>
                                    <br />
                                    Las imágenes del ZIP se asignan automáticamente por nombre del archivo (ej: "camisa.jpg" → producto "camisa").
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Product List */}
                {state.products.length > 0 && (
                    <div className="pm-products animate-fade-in">
                        <div className="pm-products-header">
                            <h2>Productos agregados ({state.products.length})</h2>
                            <button className="btn btn-primary btn-lg" onClick={handleBuildCatalog} id="build-catalog-btn">
                                🚀 Construir catálogo
                            </button>
                        </div>
                        <div className="pm-products-list stagger">
                            {state.products.map((p) => (
                                <div key={p.id} className="pm-product-item card">
                                    <div className="pm-product-image">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} />
                                        ) : (
                                            <div className="pm-product-no-image">📦</div>
                                        )}
                                    </div>
                                    <div className="pm-product-info">
                                        <h4>{p.name}</h4>
                                        {p.description && <p>{p.description}</p>}
                                        <div className="pm-product-meta">
                                            <span className="badge badge-primary">${p.price.toFixed(2)}</span>
                                            {p.code && <span className="badge badge-accent">{p.code}</span>}
                                            {p.stock !== null && p.stock !== undefined && (
                                                <span className={`badge ${p.stock <= 5 ? 'badge-danger' : 'badge-warm'}`}>
                                                    Stock: {p.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(p.id)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {state.products.length === 0 && (
                    <div className="empty-state">
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
                        <h3>Aún no hay productos</h3>
                        <p>Agrega productos manualmente o carga un CSV para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
