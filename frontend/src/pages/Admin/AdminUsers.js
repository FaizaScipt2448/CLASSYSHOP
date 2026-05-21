import React, { useState, useEffect } from 'react';
import { MdPhone, MdCalendarToday, MdDelete, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AVATAR_COLORS = [
  '#e94560', '#1565c0', '#2e7d32', '#6a1b9a',
  '#e65100', '#00838f', '#c62828', '#37474f'
];

const getAvatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const AdminUsers = () => {
  const { authHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState({});
  const ROWS = 50;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/admin/users', authHeader());
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, authHeader());
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = () => {
    const allSelected = paged.every(u => selected[u._id]);
    const next = {};
    paged.forEach(u => { next[u._id] = !allSelected; });
    setSelected(prev => ({ ...prev, ...next }));
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ROWS);
  const paged = filtered.slice((page - 1) * ROWS, page * ROWS);
  const allSelected = paged.length > 0 && paged.every(u => selected[u._id]);

  return (
    <div className="admin-card">
      <div className="admin-section-title">
        <span style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>User List</span>
        <input
          className="admin-search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ marginLeft: 'auto', width: 260 }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th>USER</th>
              <th>USER PHONE NO</th>
              <th>Email Verify</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u._id}
                className={selected[u._id] ? 'selected' : ''}
                style={{ transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!selected[u._id]) e.currentTarget.style.background = '#eff6ff'; }}
                onMouseLeave={e => { if (!selected[u._id]) e.currentTarget.style.background = 'transparent'; }}
              >
                <td>
                  <input type="checkbox" checked={!!selected[u._id]} onChange={() => toggleSelect(u._id)} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: getAvatarColor(u.name),
                      color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15, fontWeight: 700
                    }}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#222' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                    <MdPhone style={{ color: '#aaa', fontSize: 16 }} />
                    {u.phone || 'NONE'}
                  </div>
                </td>
                <td>
                  {u.isEmailVerified ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#e8f5e9', color: '#2e7d32',
                      fontSize: 12, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 4
                    }}>✓ Verified</span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#fdecea', color: '#c62828',
                      fontSize: 12, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 4
                    }}>✕ Not Verify</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                    <MdCalendarToday style={{ color: '#aaa', fontSize: 14 }} />
                    {new Date(u.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </td>
                <td>
                  {!u.isAdmin && (
                    <button
                      onClick={() => handleDelete(u._id, u.name)}
                      style={{
                        background: '#e94560', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '5px 14px', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <MdDelete style={{ fontSize: 15 }} /> DELETE
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Rows per page:</span>
          <select className="rows-select" value={ROWS} readOnly>
            <option>50</option>
          </select>
        </div>
        <span style={{ fontSize: 13, color: '#777' }}>
          {filtered.length === 0 ? '0' : `${(page - 1) * ROWS + 1}–${Math.min(page * ROWS, filtered.length)}`} of {filtered.length}
        </span>
        <div className="table-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><MdChevronLeft /></button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
            <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><MdChevronRight /></button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
