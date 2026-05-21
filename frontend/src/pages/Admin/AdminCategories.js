import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const ROWS = 10;

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories');
      setCategories(data);
    } catch { toast.error('Failed to load categories'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await axios.delete(`/api/categories/${id}`, authHeader());
      toast.success('Category deleted');
      fetchCategories();
    } catch { toast.error('Delete failed'); }
  };

  const totalPages = Math.ceil(categories.length / ROWS);
  const paged = categories.slice((page - 1) * ROWS, page * ROWS);

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>Category List</span>
        <button className="admin-btn blue" onClick={() => navigate('/admin/categories/add')}>
          ADD CATEGORY
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>IMAGE</th>
              <th>CATEGORY NAME</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(cat => (
              <tr key={cat._id}>
                <td style={{ width: 120 }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 6 }}
                    onError={e => e.target.style.display = 'none'}
                  />
                </td>
                <td style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cat.name}</td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn edit"
                      title="Edit"
                      onClick={() => navigate(`/admin/categories/edit/${cat._id}`)}
                    ><MdEdit /></button>
                    <button
                      className="action-btn del"
                      title="Delete"
                      onClick={() => handleDelete(cat._id, cat.name)}
                    ><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>No categories</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Rows per page:</span>
          <select className="rows-select" value={ROWS}>
            <option>10</option>
          </select>
        </div>
        <span>
          {categories.length === 0 ? '0' : `${(page-1)*ROWS+1}–${Math.min(page*ROWS, categories.length)}`} of {categories.length}
        </span>
        <div className="table-pagination">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><MdChevronLeft /></button>
          {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
            <button key={p} className={page===p?'active':''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}><MdChevronRight /></button>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
