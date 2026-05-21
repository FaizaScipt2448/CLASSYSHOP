import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete, MdExpandMore, MdExpandLess } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminSubCategories = () => {
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catsRes, subsRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/subcategories')
      ]);
      setCategories(catsRes.data);
      setSubCategories(subsRes.data);
    } catch { toast.error('Failed to load data'); }
  };

  const handleDeleteSub = async (id, name) => {
    if (!window.confirm(`Delete sub category "${name}"?`)) return;
    try {
      await axios.delete(`/api/subcategories/${id}`, authHeader());
      toast.success('Sub category deleted');
      setSubCategories(prev => prev.filter(s => s._id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const getSubsForCategory = (catId) =>
    subCategories.filter(s =>
      (s.parentCategory?._id || s.parentCategory) === catId
    );

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span style={{ display: 'inline-block', background: '#7c3aed', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>Sub Category List</span>
        <button className="admin-btn blue" onClick={() => navigate('/admin/subcategories/add')}>
          ADD NEW SUB CATEGORY
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>IMAGE</th>
              <th>CATEGORY NAME</th>
              <th>SUB CATEGORIES</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const subs = getSubsForCategory(cat._id);
              const isOpen = !!expanded[cat._id];

              return (
                <React.Fragment key={cat._id}>
                  {/* Parent category row */}
                  <tr
                    style={{ cursor: 'pointer', background: isOpen ? '#eff6ff' : undefined, transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => toggleExpand(cat._id)}
                  >
                    <td>
                      <span style={{ fontSize: 20, color: '#888', display: 'flex' }}>
                        {isOpen ? <MdExpandLess /> : <MdExpandMore />}
                      </span>
                    </td>
                    <td style={{ width: 80 }}>
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6 }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 14, color: '#222' }}>
                      {cat.name}
                    </td>
                    <td style={{ fontSize: 13, color: '#888' }}>
                      {subs.length} sub {subs.length === 1 ? 'category' : 'categories'}
                    </td>
                    <td>
                      <button
                        className="admin-btn blue"
                        style={{ fontSize: 12, padding: '4px 12px' }}
                        onClick={e => { e.stopPropagation(); navigate(`/admin/subcategories/add?cat=${cat._id}`); }}
                      >
                        + Add Sub
                      </button>
                    </td>
                  </tr>

                  {/* Sub category rows */}
                  {isOpen && subs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '10px 32px', color: '#bbb', fontSize: 13, background: '#fafafa' }}>
                        No sub categories yet. Click "+ Add Sub" to add one.
                      </td>
                    </tr>
                  )}
                  {isOpen && subs.map(sub => (
                    <tr key={sub._id}
                      style={{ background: '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                    >
                      <td></td>
                      <td style={{ paddingLeft: 24 }}>
                        {sub.image ? (
                          <img
                            src={sub.image}
                            alt={sub.name}
                            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4 }}
                            onError={e => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 4, background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#9fa8da' }}>—</div>
                        )}
                      </td>
                      <td style={{ paddingLeft: 28, fontSize: 13, color: '#444' }}>
                        ↳ {sub.name}
                      </td>
                      <td></td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn edit"
                            title="Edit"
                            onClick={() => navigate(`/admin/subcategories/edit/${sub._id}`)}
                          ><MdEdit /></button>
                          <button
                            className="action-btn del"
                            title="Delete"
                            onClick={() => handleDeleteSub(sub._id, sub.name)}
                          ><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubCategories;
