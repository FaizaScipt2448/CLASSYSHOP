import React, { useState } from 'react';
import { toast } from 'react-toastify';

/* ─── Size option sets ─── */
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES_UK   = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SHOE_SIZES_US   = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const SHOE_SIZES_EU   = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const FIT_OPTIONS     = ['True to size', 'Runs small', 'Runs large', 'Slim fit', 'Relaxed fit', 'Oversized'];
const CATEGORIES      = ['Fashion', 'Footwear', 'Bags', 'Electronics', 'Beauty', 'Wellness', 'Groceries', 'Jewellery'];

/* ─── Dummy products for product selector ─── */
const DUMMY_PRODUCTS = [
  { _id: 'p1', name: 'Levi\'s 511 Slim Fit Jeans', category: 'Fashion', brand: 'Levi\'s', sku: 'LV-511-BLU' },
  { _id: 'p2', name: 'Nike Air Max 270 White',      category: 'Footwear', brand: 'Nike',    sku: 'NK-AM270-W' },
  { _id: 'p3', name: 'Zara Floral Midi Dress',       category: 'Fashion', brand: 'Zara',    sku: 'ZR-FMD-001' },
  { _id: 'p4', name: 'Adidas Ultraboost 22',          category: 'Footwear', brand: 'Adidas', sku: 'AD-UB22-BLK' },
  { _id: 'p5', name: 'H&M Cotton Crew Neck T-Shirt',  category: 'Fashion', brand: 'H&M',    sku: 'HM-CNT-WHT' },
  { _id: 'p6', name: 'Puma Suede Classic Sneakers',   category: 'Footwear', brand: 'Puma',   sku: 'PM-SC-NAV' },
  { _id: 'p7', name: 'Uniqlo Ultra Light Down Jacket', category: 'Fashion', brand: 'Uniqlo', sku: 'UQ-ULD-BLK' },
  { _id: 'p8', name: 'New Balance 574 Core',           category: 'Footwear', brand: 'New Balance', sku: 'NB-574-GRY' },
];

/* ─── Existing size entries (dummy) ─── */
const DUMMY_SIZE_ENTRIES = [
  {
    _id: 's1', productId: 'p1', productName: "Levi's 511 Slim Fit Jeans", category: 'Fashion',
    availableSizes: ['S', 'M', 'L', 'XL'],
    measurements: { S: { chest: 86, waist: 71, hips: 89 }, M: { chest: 91, waist: 76, hips: 94 }, L: { chest: 97, waist: 81, hips: 99 }, XL: { chest: 102, waist: 86, hips: 104 } },
    unit: 'cm', fit: 'Slim fit', sizeGuide: 'Measure around the fullest part of your chest. Keep tape parallel to ground.',
    dimensions: { length: 110, width: 32, height: 2 }, weight: 580,
  },
  {
    _id: 's2', productId: 'p2', productName: 'Nike Air Max 270 White', category: 'Footwear',
    shoeSizes: { uk: ['6', '7', '8', '9', '10'], us: ['7', '8', '9', '10', '11'], eu: ['39', '40', '41', '42', '43'] },
    fit: 'True to size', sizeGuide: 'We recommend ordering your usual size. Half sizes should size up.',
    dimensions: { length: 30, width: 12, height: 14 }, weight: 290,
  },
  {
    _id: 's3', productId: 'p3', productName: 'Zara Floral Midi Dress', category: 'Fashion',
    availableSizes: ['XS', 'S', 'M', 'L'],
    measurements: { XS: { chest: 80, waist: 60, hips: 84 }, S: { chest: 84, waist: 64, hips: 88 }, M: { chest: 88, waist: 68, hips: 92 }, L: { chest: 94, waist: 74, hips: 98 } },
    unit: 'cm', fit: 'True to size', sizeGuide: 'Model is 175cm and wears size S.',
    dimensions: { length: 120, width: 45, height: 2 }, weight: 310,
  },
];

const EMPTY_FORM = {
  productSearch: '',
  selectedProduct: null,
  category: 'Fashion',
  sizeType: 'clothing',
  /* clothing */
  availableSizes: [],
  measurements: {},
  unit: 'cm',
  /* footwear */
  shoeSizesUK: [],
  shoeSizesUS: [],
  shoeSizesEU: [],
  shoeSizesCM: '',
  /* shared */
  fit: 'True to size',
  sizeGuide: '',
  dimensionLength: '',
  dimensionWidth: '',
  dimensionHeight: '',
  dimensionUnit: 'cm',
  weight: '',
  weightUnit: 'g',
  notes: '',
};

/* ─── Measurement row for a single clothing size ─── */
const MeasurementRow = ({ size, values, unit, onChange }) => (
  <tr className="border-t border-slate-100">
    <td className="py-2 pr-4 text-sm font-semibold text-slate-700">{size}</td>
    {['chest', 'waist', 'hips'].map(field => (
      <td key={field} className="py-2 pr-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            value={values?.[field] ?? ''}
            onChange={e => onChange(size, field, e.target.value)}
            placeholder="—"
            className="w-20 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-brand"
          />
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </td>
    ))}
  </tr>
);

/* ─── Tag toggle button ─── */
const SizeToggle = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'border-brand bg-brand text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand'
    }`}
  >
    {label}
  </button>
);

const AdminProductSize = () => {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [entries, setEntries]   = useState(DUMMY_SIZE_ENTRIES);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);

  /* ── helpers ── */
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleSize = (size) => {
    setForm(f => {
      const next = f.availableSizes.includes(size)
        ? f.availableSizes.filter(s => s !== size)
        : [...f.availableSizes, size];
      const measurements = { ...f.measurements };
      if (!next.includes(size)) delete measurements[size];
      return { ...f, availableSizes: next, measurements };
    });
  };

  const toggleShoeSize = (system, size) => {
    const key = `shoeSizes${system}`;
    setForm(f => ({
      ...f,
      [key]: f[key].includes(size) ? f[key].filter(s => s !== size) : [...f[key], size],
    }));
  };

  const setMeasurement = (size, field, val) => {
    setForm(f => ({
      ...f,
      measurements: {
        ...f.measurements,
        [size]: { ...(f.measurements[size] || {}), [field]: val },
      },
    }));
  };

  const selectProduct = (p) => {
    const isFootwear = p.category === 'Footwear';
    set('selectedProduct', p);
    set('productSearch', p.name);
    set('category', p.category);
    set('sizeType', isFootwear ? 'footwear' : 'clothing');
  };

  /* ── form submit ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.selectedProduct) { toast.error('Please select a product'); return; }
    if (form.sizeType === 'clothing' && form.availableSizes.length === 0) {
      toast.error('Select at least one clothing size'); return;
    }
    if (form.sizeType === 'footwear' && form.shoeSizesUK.length === 0) {
      toast.error('Select at least one UK shoe size'); return;
    }
    setSaving(true);
    try {
      /* API call would go here */
      await new Promise(r => setTimeout(r, 600));
      const entry = {
        _id: editId || `s${Date.now()}`,
        productId: form.selectedProduct._id,
        productName: form.selectedProduct.name,
        category: form.category,
        sizeType: form.sizeType,
        ...(form.sizeType === 'clothing'
          ? { availableSizes: form.availableSizes, measurements: form.measurements, unit: form.unit }
          : { shoeSizes: { uk: form.shoeSizesUK, us: form.shoeSizesUS, eu: form.shoeSizesEU } }),
        fit: form.fit,
        sizeGuide: form.sizeGuide,
        dimensions: { length: form.dimensionLength, width: form.dimensionWidth, height: form.dimensionHeight },
        weight: form.weight,
        notes: form.notes,
      };
      if (editId) {
        setEntries(es => es.map(e => e._id === editId ? entry : e));
        toast.success('Size entry updated');
      } else {
        setEntries(es => [entry, ...es]);
        toast.success('Size entry saved');
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
    } catch {
      toast.error('Failed to save size entry');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setForm({
      ...EMPTY_FORM,
      selectedProduct: { _id: entry.productId, name: entry.productName, category: entry.category },
      productSearch: entry.productName,
      category: entry.category,
      sizeType: entry.sizeType || (entry.availableSizes ? 'clothing' : 'footwear'),
      availableSizes: entry.availableSizes || [],
      measurements: entry.measurements || {},
      unit: entry.unit || 'cm',
      shoeSizesUK: entry.shoeSizes?.uk || [],
      shoeSizesUS: entry.shoeSizes?.us || [],
      shoeSizesEU: entry.shoeSizes?.eu || [],
      fit: entry.fit || 'True to size',
      sizeGuide: entry.sizeGuide || '',
      dimensionLength: entry.dimensions?.length || '',
      dimensionWidth: entry.dimensions?.width || '',
      dimensionHeight: entry.dimensions?.height || '',
      weight: entry.weight || '',
      notes: entry.notes || '',
    });
    setEditId(entry._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setEntries(es => es.filter(e => e._id !== id));
    toast.success('Size entry removed');
  };

  const filteredEntries = entries.filter(e =>
    !search || e.productName.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  const productMatches = DUMMY_PRODUCTS.filter(p =>
    form.productSearch.length > 1 &&
    p.name.toLowerCase().includes(form.productSearch.toLowerCase()) &&
    p._id !== form.selectedProduct?._id
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Size Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Define clothing measurements, shoe sizes, and fit guides per product.</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(v => !v); }}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Size Entry'}
        </button>
      </div>

      {/* ── Add / Edit form ── */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">

          {/* Section 1 — Product selection */}
          <div className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">1. Select Product</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Product Name / SKU *</label>
                <input
                  type="text"
                  value={form.productSearch}
                  onChange={e => { set('productSearch', e.target.value); set('selectedProduct', null); }}
                  placeholder="Search product..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
                {productMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {productMatches.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => selectProduct(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{p.category} · {p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.selectedProduct && (
                  <p className="mt-1 text-xs text-green-600">
                    Selected: <strong>{form.selectedProduct.name}</strong> ({form.selectedProduct.category})
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={form.category}
                  onChange={e => { set('category', e.target.value); set('sizeType', e.target.value === 'Footwear' ? 'footwear' : 'clothing'); }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Size type toggle */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold text-slate-600">Size Type</label>
              <div className="flex gap-3">
                {['clothing', 'footwear'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('sizeType', t)}
                    className={`rounded-lg border px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                      form.sizeType === t ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-600 hover:border-brand'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2a — Clothing sizes */}
          {form.sizeType === 'clothing' && (
            <div className="p-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">2. Clothing Sizes &amp; Measurements</h2>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold text-slate-600">Available Sizes *</label>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_SIZES.map(s => (
                    <SizeToggle key={s} label={s} active={form.availableSizes.includes(s)} onClick={() => toggleSize(s)} />
                  ))}
                </div>
              </div>

              {form.availableSizes.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500">Size</th>
                        <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500">Chest</th>
                        <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500">Waist</th>
                        <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-500">Hips</th>
                      </tr>
                    </thead>
                    <tbody className="px-4">
                      {form.availableSizes.map(s => (
                        <MeasurementRow key={s} size={s} values={form.measurements[s]} unit={form.unit} onChange={setMeasurement} />
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-100 px-4 py-2">
                    <label className="mr-3 text-xs font-semibold text-slate-500">Unit:</label>
                    {['cm', 'inches'].map(u => (
                      <button key={u} type="button" onClick={() => set('unit', u)}
                        className={`mr-2 rounded border px-2.5 py-1 text-xs font-medium ${form.unit === u ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-600'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2b — Footwear sizes */}
          {form.sizeType === 'footwear' && (
            <div className="p-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">2. Shoe Sizes</h2>
              <div className="space-y-4">
                {[
                  { label: 'UK Sizes *', key: 'UK', options: SHOE_SIZES_UK },
                  { label: 'US Sizes',   key: 'US', options: SHOE_SIZES_US },
                  { label: 'EU Sizes',   key: 'EU', options: SHOE_SIZES_EU },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">{label}</label>
                    <div className="flex flex-wrap gap-2">
                      {options.map(s => (
                        <SizeToggle
                          key={s} label={s}
                          active={form[`shoeSizes${key}`].includes(s)}
                          onClick={() => toggleShoeSize(key, s)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="max-w-xs">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">CM Range (optional)</label>
                  <input
                    type="text"
                    value={form.shoeSizesCM}
                    onChange={e => set('shoeSizesCM', e.target.value)}
                    placeholder="e.g. 24 – 29 cm"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3 — Fit & Size Guide */}
          <div className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">3. Fit &amp; Size Guide</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Fit Type</label>
                <select
                  value={form.fit}
                  onChange={e => set('fit', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {FIT_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Size Guide Instructions
                  <span className="ml-2 font-normal text-slate-400">{form.sizeGuide.length}/300</span>
                </label>
                <textarea
                  value={form.sizeGuide}
                  onChange={e => set('sizeGuide', e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Explain how to measure, model info, sizing notes..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Section 4 — Dimensions & Weight */}
          <div className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">4. Dimensions &amp; Weight</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {[['dimensionLength','Length'],['dimensionWidth','Width'],['dimensionHeight','Height']].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="number" min="0" value={form[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Unit</label>
                <select value={form.dimensionUnit} onChange={e => set('dimensionUnit', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand">
                  <option>cm</option><option>mm</option><option>inches</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Weight</label>
                <input type="number" min="0" value={form.weight} onChange={e => set('weight', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Weight Unit</label>
                <select value={form.weightUnit} onChange={e => set('weightUnit', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand">
                  <option>g</option><option>kg</option><option>lbs</option><option>oz</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5 — Notes */}
          <div className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">5. Additional Notes</h2>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Internal notes, washing instructions, material stretch info..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 bg-slate-50 px-6 py-4">
            <button type="button" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); }}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Update Entry' : 'Save Size Entry'}
            </button>
          </div>
        </form>
      )}

      {/* ── Existing entries list ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Saved Size Entries <span className="ml-2 text-sm font-normal text-slate-400">({filteredEntries.length})</span></h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by product or category..."
            className="w-60 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No size entries yet — add one above.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map(entry => {
              const isClothing = !!entry.availableSizes;
              return (
                <div key={entry._id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{entry.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{entry.category} · Fit: {entry.fit}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(entry)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(entry._id)}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
                        Remove
                      </button>
                    </div>
                  </div>

                  {isClothing ? (
                    <div className="mt-3">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {entry.availableSizes.map(s => (
                          <span key={s} className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{s}</span>
                        ))}
                      </div>
                      {entry.measurements && Object.keys(entry.measurements).length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="text-xs text-slate-600">
                            <thead>
                              <tr className="text-slate-400">
                                <th className="pr-4 font-medium text-left">Size</th>
                                <th className="pr-4 font-medium text-left">Chest</th>
                                <th className="pr-4 font-medium text-left">Waist</th>
                                <th className="pr-4 font-medium text-left">Hips</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(entry.measurements).map(([sz, m]) => (
                                <tr key={sz}>
                                  <td className="pr-4 font-semibold">{sz}</td>
                                  <td className="pr-4">{m.chest} {entry.unit}</td>
                                  <td className="pr-4">{m.waist} {entry.unit}</td>
                                  <td className="pr-4">{m.hips} {entry.unit}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1">
                      {entry.shoeSizes?.uk?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-7 font-semibold text-slate-500">UK</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.shoeSizes.uk.map(s => (
                              <span key={s} className="rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.shoeSizes?.us?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-7 font-semibold text-slate-500">US</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.shoeSizes.us.map(s => (
                              <span key={s} className="rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.shoeSizes?.eu?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-7 font-semibold text-slate-500">EU</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.shoeSizes.eu.map(s => (
                              <span key={s} className="rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.sizeGuide && (
                    <p className="mt-2 text-xs text-slate-500 italic">&ldquo;{entry.sizeGuide}&rdquo;</p>
                  )}
                  {(entry.dimensions?.length || entry.weight) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {entry.dimensions?.length && `Dims: ${entry.dimensions.length}×${entry.dimensions.width}×${entry.dimensions.height} cm`}
                      {entry.weight && ` · Weight: ${entry.weight}g`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductSize;
