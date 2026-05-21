import React from 'react';
import { CATEGORIES, useAdminFiltersStore } from '../../store/adminFiltersStore';
import { titleCase } from '../../utils/analyticsFormat';

const seasons = ['', 'summer', 'winter', 'spring', 'autumn', 'eid', 'ramadan', 'wedding'];

const GlobalFilters = ({ showCategory = true, showSeason = true }) => {
  const { dateFrom, dateTo, category, season, setFilters } = useAdminFiltersStore();

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
        Date from
        <input
          type="date"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand"
          value={dateFrom}
          onChange={(event) => setFilters({ dateFrom: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
        Date to
        <input
          type="date"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand"
          value={dateTo}
          onChange={(event) => setFilters({ dateTo: event.target.value })}
        />
      </label>
      {showCategory && (
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
          Category
          <select
            className="min-w-40 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand"
            value={category}
            onChange={(event) => setFilters({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </label>
      )}
      {showSeason && (
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
          Season
          <select
            className="min-w-36 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand"
            value={season}
            onChange={(event) => setFilters({ season: event.target.value })}
          >
            {seasons.map((item) => (
              <option key={item || 'all'} value={item}>{item ? titleCase(item) : 'All seasons'}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

export default GlobalFilters;
