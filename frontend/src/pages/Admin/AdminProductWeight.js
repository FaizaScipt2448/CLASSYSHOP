import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdSave } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  productId: '',
  weightValue: '',
  weightUnit: 'g',
  packageWeightValue: '',
  packageWeightUnit: 'g',
  length: '',
  width: '',
  height: '',
  dimensionUnit: 'cm',
  detailLabel: '',
  detailValue: '',
};

const AdminProductWeight = () => {
  const { authHeader } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/products')
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load products'));
  }, []);

  const selectedProduct = useMemo(
    () => products.find(product => product._id === form.productId),
    [products, form.productId]
  );

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleProductChange = (productId) => {
    const product = products.find(item => item._id === productId);
    setForm({
      productId,
      weightValue: product?.weight?.value || '',
      weightUnit: product?.weight?.unit || 'g',
      packageWeightValue: product?.packageWeight?.value || '',
      packageWeightUnit: product?.packageWeight?.unit || 'g',
      length: product?.dimensions?.length || '',
      width: product?.dimensions?.width || '',
      height: product?.dimensions?.height || '',
      dimensionUnit: product?.dimensions?.unit || 'cm',
      detailLabel: '',
      detailValue: '',
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setSaving(true);
    try {
      const existingDetails = Array.isArray(selectedProduct.productDetails)
        ? selectedProduct.productDetails.filter(detail => detail?.label && detail?.value)
        : [];
      const extraDetail = form.detailLabel && form.detailValue
        ? [{ label: form.detailLabel, value: form.detailValue }]
        : [];

      await axios.put(`/api/products/${selectedProduct._id}`, {
        weight: {
          value: Number(form.weightValue) || 0,
          unit: form.weightUnit,
        },
        packageWeight: {
          value: Number(form.packageWeightValue) || 0,
          unit: form.packageWeightUnit,
        },
        dimensions: {
          length: Number(form.length) || 0,
          width: Number(form.width) || 0,
          height: Number(form.height) || 0,
          unit: form.dimensionUnit,
        },
        productDetails: [
          ...existingDetails.filter(detail => !['Weight', 'Package Weight', 'Dimensions'].includes(detail.label)),
          form.weightValue ? { label: 'Weight', value: `${form.weightValue}${form.weightUnit}` } : null,
          form.packageWeightValue ? { label: 'Package Weight', value: `${form.packageWeightValue}${form.packageWeightUnit}` } : null,
          (form.length || form.width || form.height)
            ? { label: 'Dimensions', value: `${form.length || 0} x ${form.width || 0} x ${form.height || 0} ${form.dimensionUnit}` }
            : null,
          ...extraDetail,
        ].filter(Boolean),
      }, authHeader());

      setProducts(prev => prev.map(product => (
        product._id === selectedProduct._id
          ? {
              ...product,
              weight: { value: Number(form.weightValue) || 0, unit: form.weightUnit },
              packageWeight: { value: Number(form.packageWeightValue) || 0, unit: form.packageWeightUnit },
              dimensions: {
                length: Number(form.length) || 0,
                width: Number(form.width) || 0,
                height: Number(form.height) || 0,
                unit: form.dimensionUnit,
              },
            }
          : product
      )));
      toast.success('Product weight details saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save weight details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span style={{ display: 'inline-block', background: '#0891b2', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>Add Product Weight</span>
      </div>

      <div className="admin-form-grid">
        <div className="admin-form-group full">
          <label>Select Product</label>
          <select value={form.productId} onChange={event => handleProductChange(event.target.value)}>
            <option value="">Choose product</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label>Product Weight</label>
          <input type="number" min="0" value={form.weightValue} onChange={event => set('weightValue', event.target.value)} placeholder="500" />
        </div>
        <div className="admin-form-group">
          <label>Weight Unit</label>
          <select value={form.weightUnit} onChange={event => set('weightUnit', event.target.value)}>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="pcs">pcs</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label>Package Weight</label>
          <input type="number" min="0" value={form.packageWeightValue} onChange={event => set('packageWeightValue', event.target.value)} placeholder="650" />
        </div>
        <div className="admin-form-group">
          <label>Package Unit</label>
          <select value={form.packageWeightUnit} onChange={event => set('packageWeightUnit', event.target.value)}>
            <option value="g">g</option>
            <option value="kg">kg</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label>Length</label>
          <input type="number" min="0" value={form.length} onChange={event => set('length', event.target.value)} placeholder="0" />
        </div>
        <div className="admin-form-group">
          <label>Width</label>
          <input type="number" min="0" value={form.width} onChange={event => set('width', event.target.value)} placeholder="0" />
        </div>
        <div className="admin-form-group">
          <label>Height</label>
          <input type="number" min="0" value={form.height} onChange={event => set('height', event.target.value)} placeholder="0" />
        </div>
        <div className="admin-form-group">
          <label>Dimension Unit</label>
          <select value={form.dimensionUnit} onChange={event => set('dimensionUnit', event.target.value)}>
            <option value="cm">cm</option>
            <option value="inch">inch</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label>Extra Detail Label</label>
          <input value={form.detailLabel} onChange={event => set('detailLabel', event.target.value)} placeholder="Material" />
        </div>
        <div className="admin-form-group">
          <label>Extra Detail Value</label>
          <input value={form.detailValue} onChange={event => set('detailValue', event.target.value)} placeholder="Cotton blend" />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="admin-btn blue" onClick={handleSave} disabled={saving}>
          <MdSave /> {saving ? 'Saving...' : 'Save Weight Details'}
        </button>
      </div>
    </div>
  );
};

export default AdminProductWeight;
