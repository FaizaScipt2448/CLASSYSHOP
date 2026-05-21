import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MdClose, MdCloudUpload, MdImage, MdArrowBack, MdAccountTree } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AddEditSubCategory = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState(searchParams.get('cat') || '');
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    axios.get('/api/categories').then(({ data }) => setCategories(data)).catch(() => {});
    if (isEdit) {
      axios.get('/api/subcategories').then(({ data }) => {
        const sub = data.find(s => s._id === id);
        if (sub) {
          setName(sub.name);
          setParentCategory(sub.parentCategory?._id || sub.parentCategory || '');
          setImagePreview(sub.image || '');
          setImageUrl(sub.image || '');
        }
      }).catch(() => toast.error('Sub category not found'));
    }
  }, [id]); // eslint-disable-line

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target.result); setImageUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Sub category name is required'); return; }
    if (!parentCategory) { toast.error('Please select a parent category'); return; }

    setLoading(true);
    const payload = { name: name.trim(), parentCategory, image: imageUrl };

    try {
      if (isEdit) {
        await axios.put(`/api/subcategories/${id}`, payload, authHeader());
        toast.success('Sub category updated!');
      } else {
        await axios.post('/api/subcategories', payload, authHeader());
        toast.success('Sub category added!');
      }
      navigate('/admin/subcategories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving sub category');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '2px solid #cffafe',
    borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    color: '#164e63', background: '#f0fdff', transition: 'border-color 0.2s',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230e7490' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40,
    cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdff 0%, #ecfeff 100%)', padding: '28px 24px' }}>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(14,116,144,0.28)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MdAccountTree style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>
              ADMIN / SUB CATEGORIES
            </p>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {isEdit ? 'Edit Sub Category' : 'Add New Sub Category'}
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/subcategories')}
          style={{
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <MdArrowBack style={{ fontSize: 16 }} /> Back
        </button>
      </div>

      {/* Form Card */}
      <div style={{
        maxWidth: 620, background: '#fff', borderRadius: 18,
        padding: '32px 36px', boxShadow: '0 4px 28px rgba(14,116,144,0.08)',
        border: '1.5px solid #cffafe',
      }}>

        {/* Parent Category Dropdown */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 800, color: '#0e7490',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Parent Category <span style={{ color: '#e94560' }}>*</span>
          </label>
          <select
            value={parentCategory}
            onChange={e => setParentCategory(e.target.value)}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = '#0e7490'}
            onBlur={e => e.target.style.borderColor = '#cffafe'}
          >
            <option value="">-- Select a parent category --</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <p style={{ color: '#67e8f9', fontSize: 11, marginTop: 5, marginLeft: 2 }}>
            Choose which top-level category this belongs to.
          </p>
        </div>

        {/* Sub Category Name Field */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 800, color: '#0e7490',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Sub Category Name <span style={{ color: '#e94560' }}>*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Smartphones, Dresses, Skincare..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#0e7490'}
            onBlur={e => e.target.style.borderColor = '#cffafe'}
          />
          <p style={{ color: '#67e8f9', fontSize: 11, marginTop: 5, marginLeft: 2 }}>
            This name will appear under the parent category in navigation.
          </p>
        </div>

        {/* Image Field (optional) */}
        <div style={{ marginBottom: 32 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 800, color: '#0e7490',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Sub Category Image <span style={{ color: '#a0aec0', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span>
          </label>

          {imagePreview ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 12, border: '2px solid #a5f3fc' }}
                />
                <button
                  onClick={() => { setImagePreview(''); setImageUrl(''); }}
                  style={{
                    position: 'absolute', top: -8, right: -8, width: 24, height: 24,
                    background: '#0e7490', color: '#fff', border: 'none', borderRadius: '50%',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <MdClose style={{ fontSize: 14 }} />
                </button>
              </div>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 13, color: '#0e7490', fontWeight: 600, marginBottom: 4 }}>Image selected</p>
                <p style={{ fontSize: 12, color: '#67e8f9' }}>Click the × to remove and upload a different one.</p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed #a5f3fc', borderRadius: 12, padding: '28px 24px',
                textAlign: 'center', cursor: 'pointer', background: '#f0fdff',
                marginBottom: 14, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ecfeff'; e.currentTarget.style.borderColor = '#0e7490'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0fdff'; e.currentTarget.style.borderColor = '#a5f3fc'; }}
            >
              <MdImage style={{ fontSize: 38, color: '#a5f3fc', marginBottom: 8 }} />
              <p style={{ color: '#0e7490', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Click to upload image</p>
              <p style={{ color: '#67e8f9', fontSize: 12, margin: 0 }}>PNG, JPG, WEBP — recommended 400×400 px</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ height: 1, flex: 1, background: '#cffafe' }} />
            <span style={{ color: '#a5f3fc', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>OR PASTE URL</span>
            <div style={{ height: 1, flex: 1, background: '#cffafe' }} />
          </div>

          <input
            placeholder="https://example.com/subcategory-image.jpg"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
            style={{ ...inputStyle, fontSize: 13 }}
            onFocus={e => e.target.style.borderColor = '#0e7490'}
            onBlur={e => e.target.style.borderColor = '#cffafe'}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#e0f7fa', marginBottom: 24 }} />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '15px 24px',
            background: loading ? '#a5f3fc' : 'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 6px 20px rgba(14,116,144,0.38)',
            transition: 'all 0.2s', letterSpacing: 0.5,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <MdCloudUpload style={{ fontSize: 20 }} />
          {loading ? 'Saving...' : isEdit ? 'UPDATE SUB CATEGORY' : 'PUBLISH SUB CATEGORY'}
        </button>
      </div>
    </div>
  );
};

export default AddEditSubCategory;
