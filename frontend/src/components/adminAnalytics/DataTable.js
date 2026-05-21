import React, { useMemo, useState } from 'react';

const SkeletonRows = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex}>
        {columns.map((column) => (
          <td key={column.key} className="border-b border-slate-100 px-4 py-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const DataTable = ({ columns, data = [], loading = false, pageSize = 10, emptyText = 'No records found' }) => {
  const [sort, setSort] = useState({ key: columns[0]?.key, direction: 'asc' });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const list = [...data];
    if (!sort.key) return list;
    const column = columns.find((item) => item.key === sort.key);
    if (column?.sortable === false) return list;

    return list.sort((a, b) => {
      const left = column?.sortValue ? column.sortValue(a) : a[sort.key];
      const right = column?.sortValue ? column.sortValue(b) : b[sort.key];
      if (typeof left === 'number' && typeof right === 'number') {
        return sort.direction === 'asc' ? left - right : right - left;
      }
      return sort.direction === 'asc'
        ? String(left ?? '').localeCompare(String(right ?? ''))
        : String(right ?? '').localeCompare(String(left ?? ''));
    });
  }, [columns, data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (column) => {
    if (column.sortable === false) return;
    setPage(1);
    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 font-bold uppercase"
                    onClick={() => toggleSort(column)}
                  >
                    {column.header}
                    {column.sortable !== false && sort.key === column.key && (
                      <span>{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows columns={columns} />
            ) : pageData.length ? (
              pageData.map((row, rowIndex) => (
                <tr
                  key={row._id || row.productId || row.id || rowIndex}
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-500">
        <span>{sorted.length ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, sorted.length)} of ${sorted.length}` : '0 records'}</span>
        <div className="flex gap-2">
          <button className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
          <span className="px-2 py-1 font-semibold text-slate-700">{page} / {totalPages}</span>
          <button className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
