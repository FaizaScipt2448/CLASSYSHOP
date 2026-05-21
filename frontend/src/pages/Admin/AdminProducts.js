import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdEdit, MdVisibility, MdDelete, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CATEGORIES = ['Fashion', 'Electronics', 'Bags', 'Footwear', 'Groceries', 'Beauty', 'Wellness', 'Jewellery'];

const SUBCATEGORIES = {
  fashion: ['Men', 'Women', 'Kids'],
  electronics: ['Mobiles', 'Laptops', 'Smart Watch', 'Accessories', 'Cameras'],
  bags: ['Men Bags', 'Women Bags'],
  footwear: ['Men Footwear', 'Women Footwear'],
  groceries: ['Fruits & Vegetables', 'Dairy & Eggs', 'Beverages'],
  beauty: ['Skincare', 'Makeup', 'Haircare'],
  wellness: ['Fitness', 'Nutrition', 'Yoga'],
  jewellery: ['Necklaces', 'Earrings', 'Bracelets'],
};

const SUBCATEGORY_LABELS = {
  'fashion-men': 'Men', 'fashion-women': 'Women', 'fashion-kids': 'Kids',
  'electronics-mobiles': 'Mobiles', 'electronics-laptops': 'Laptops',
  'electronics-smartwatch': 'Smart Watch', 'electronics-accessories': 'Accessories',
  'electronics-cameras': 'Cameras', 'bags-men': 'Men', 'bags-women': 'Women',
  'footwear-men': 'Men', 'footwear-women': 'Women',
  'groceries-fruits': 'Fruits & Veg', 'groceries-dairy': 'Dairy & Eggs',
  'groceries-beverages': 'Beverages', 'beauty-skincare': 'Skincare',
  'beauty-makeup': 'Makeup', 'beauty-haircare': 'Haircare',
  'wellness-fitness': 'Fitness', 'wellness-nutrition': 'Nutrition',
  'wellness-yoga': 'Yoga', 'jewellery-necklaces': 'Necklaces',
  'jewellery-earrings': 'Earrings', 'jewellery-bracelets': 'Bracelets',
};

const Stars = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return <span className="star-row">{stars}</span>;
};

const AdminProducts = () => {
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [imgModal, setImgModal] = useState({ open: false, images: [], idx: 0 });

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let list = [...products];
    if (catFilter) list = list.filter(p => p.category.toLowerCase() === catFilter.toLowerCase());
    if (subFilter) {
      const slug = catFilter.toLowerCase() + '-' + subFilter.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-').replace('&', '');
      list = list.filter(p => p.subcategory === slug || SUBCATEGORY_LABELS[p.subcategory]?.toLowerCase() === subFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
    setPage(1);
    setSelected([]);
  }, [products, catFilter, subFilter, search]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data);
    } catch (e) { toast.error('Failed to load products'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`, authHeader());
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} products?`)) return;
    try {
      await axios.delete('/api/admin/products/bulk', { ...authHeader(), data: { ids: selected } });
      toast.success(`${selected.length} products deleted`);
      setSelected([]);
      fetchProducts();
    } catch { toast.error('Bulk delete failed'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === paged.length ? [] : paged.map(p => p._id));

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const subOptions = catFilter ? (SUBCATEGORIES[catFilter.toLowerCase()] || []) : [];

  const openImg = (p) => {
    const imgs = [p.image, ...(p.images || [])].filter(Boolean);
    setImgModal({ open: true, images: imgs, idx: 0 });
  };

  return (
    <div>
      <div className="admin-card">
        {/* Toolbar */}
        <div className="admin-section-title">
          <span style={{ display: 'inline-block', background: '#0d9488', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>Products</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.length > 0 && (
              <button className="admin-btn red" onClick={handleBulkDelete}>
                DELETE ({selected.length})
              </button>
            )}
            <button className="admin-btn blue" onClick={() => navigate('/admin/products/add')}>
              <MdAdd /> ADD PRODUCT
            </button>
          </div>
        </div>

        <div className="admin-toolbar">
          <select
            className="admin-filter-select"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setSubFilter(''); }}
          >
            <option value="">Category By</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="admin-filter-select"
            value={subFilter}
            onChange={e => setSubFilter(e.target.value)}
            disabled={!catFilter}
          >
            <option value="">Sub Category By</option>
            {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            className="admin-search-input"
            placeholder="Search here..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.length === paged.length}
                    onChange={toggleAll}
                  />
                </th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>SUB CATEGORY</th>
                <th>PRICE</th>
                <th>SALES</th>
                <th>STOCK</th>
                <th>RATING</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p._id} className={selected.includes(p._id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                    />
                  </td>
                  <td>
                    <div className="prod-cell">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="prod-thumb"
                        onClick={() => openImg(p)}
                        onError={e => { e.target.src = 'https://via.placeholder.com/52'; }}
                      />
                      <div className="prod-info">
                        <strong title={p.name}>
                          {p.name.length > 38 ? p.name.slice(0, 38) + '...' : p.name}
                        </strong>
                        <span>{p.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                  <td>{SUBCATEGORY_LABELS[p.subcategory] || p.subcategory || '-'}</td>
                  <td>
                    <span className="price-orig">Rs.{p.originalPrice?.toLocaleString()}</span>
                    <span className="price-curr">Rs.{p.price?.toLocaleString()}</span>
                  </td>
                  <td><span className="sales-badge">{p.sales || 0} sale{p.sales !== 1 ? 's' : ''}</span></td>
                  <td><span className="stock-num">{p.countInStock}</span></td>
                  <td><Stars rating={p.rating} /></td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="action-btn edit"
                        title="Edit"
                        onClick={() => navigate(`/admin/products/edit/${p._id}`)}
                      ><MdEdit /></button>
                      <button
                        className="action-btn view"
                        title="View image"
                        onClick={() => openImg(p)}
                      ><MdVisibility /></button>
                      <button
                        className="action-btn del"
                        title="Delete"
                        onClick={() => handleDelete(p._id)}
                      ><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="table-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Rows per page:</span>
            <select
              className="rows-select"
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <span>
            {filtered.length === 0 ? '0' : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)}`} of {filtered.length}
          </span>
          <div className="table-pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <MdChevronLeft />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
              <MdChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imgModal.open && (
        <div className="img-modal-overlay" onClick={() => setImgModal({ ...imgModal, open: false })}>
          <button className="img-modal-close" onClick={() => setImgModal({ ...imgModal, open: false })}>✕</button>
          {imgModal.images.length > 1 && (
            <button className="img-modal-prev" onClick={e => { e.stopPropagation(); setImgModal(m => ({ ...m, idx: Math.max(0, m.idx - 1) })); }}>
              <MdChevronLeft />
            </button>
          )}
          <img
            src={imgModal.images[imgModal.idx]}
            alt="preview"
            className="img-modal-img"
            onClick={e => e.stopPropagation()}
            onError={e => { e.target.src = 'https://via.placeholder.com/400'; }}
          />
          {imgModal.images.length > 1 && (
            <button className="img-modal-next" onClick={e => { e.stopPropagation(); setImgModal(m => ({ ...m, idx: Math.min(m.images.length - 1, m.idx + 1) })); }}>
              <MdChevronRight />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
