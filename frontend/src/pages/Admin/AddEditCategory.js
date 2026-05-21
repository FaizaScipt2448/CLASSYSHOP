import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdClose, MdCloudUpload, MdImage, MdCategory, MdArrowBack } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AddEditCategory = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    axios.get('/api/categories').then(({ data }) => {
      const cat = data.find(c => c._id === id);
      if (cat) { setName(cat.name); setImagePreview(cat.image); setImageUrl(cat.image); }
    }).catch(() => toast.error('Category not found'));
  }, [id]); // eslint-disable-line

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target.result); setImageUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Category name is required'); return; }
    if (!imageUrl) { toast.error('Please upload a category image'); return; }

    setLoading(true);
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const payload = { name: name.trim(), slug, image: imageUrl };

    try {
      if (isEdit) {
        await axios.put(`/api/categories/${id}`, payload, authHeader());
        toast.success('Category updated!');
      } else {
        await axios.post('/api/categories', payload, authHeader());
        toast.success('Category added!');
      }
      navigate('/admin/categories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '2px solid #ede9fe',
    borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    color: '#1e1b4b', background: '#faf8ff', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', padding: '28px 24px' }}>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(109,40,217,0.28)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MdCategory style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>
              ADMIN / CATEGORIES
            </p>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {isEdit ? 'Edit Category' : 'Add New Category'}
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/categories')}
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
        padding: '32px 36px', boxShadow: '0 4px 28px rgba(109,40,217,0.08)',
        border: '1.5px solid #ede9fe',
      }}>

        {/* Category Name Field */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 800, color: '#7c3aed',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Category Name <span style={{ color: '#e94560' }}>*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Electronics, Fashion, Beauty..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#ede9fe'}
          />
          <p style={{ color: '#a78bfa', fontSize: 11, marginTop: 5, marginLeft: 2 }}>
            This name will appear in navigation menus and filters.
          </p>
        </div>

        {/* Image Field */}
        <div style={{ marginBottom: 32 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 800, color: '#7c3aed',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Category Image <span style={{ color: '#e94560' }}>*</span>
          </label>

          {imagePreview ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 12, border: '2px solid #ddd6fe' }}
                />
                <button
                  onClick={() => { setImagePreview(''); setImageUrl(''); }}
                  style={{
                    position: 'absolute', top: -8, right: -8, width: 24, height: 24,
                    background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '50%',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <MdClose style={{ fontSize: 14 }} />
                </button>
              </div>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 13, color: '#5b21b6', fontWeight: 600, marginBottom: 4 }}>Image selected</p>
                <p style={{ fontSize: 12, color: '#a78bfa' }}>Click the × to remove and upload a different one.</p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed #c4b5fd', borderRadius: 12, padding: '28px 24px',
                textAlign: 'center', cursor: 'pointer', background: '#faf8ff',
                marginBottom: 14, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ff'; e.currentTarget.style.borderColor = '#7c3aed'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf8ff'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
            >
              <MdImage style={{ fontSize: 38, color: '#c4b5fd', marginBottom: 8 }} />
              <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Click to upload image</p>
              <p style={{ color: '#a78bfa', fontSize: 12, margin: 0 }}>PNG, JPG, WEBP — recommended 400×400 px</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ height: 1, flex: 1, background: '#ede9fe' }} />
            <span style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>OR PASTE URL</span>
            <div style={{ height: 1, flex: 1, background: '#ede9fe' }} />
          </div>

          <input
            placeholder="https://example.com/category-image.jpg"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
            style={{ ...inputStyle, fontSize: 13 }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#ede9fe'}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f3f0ff', marginBottom: 24 }} />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '15px 24px',
            background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 6px 20px rgba(109,40,217,0.38)',
            transition: 'all 0.2s', letterSpacing: 0.5,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <MdCloudUpload style={{ fontSize: 20 }} />
          {loading ? 'Saving...' : isEdit ? 'UPDATE CATEGORY' : 'PUBLISH CATEGORY'}
        </button>
      </div>
    </div>
  );
};

export default AddEditCategory;
