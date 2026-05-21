import React from 'react';

export const ChartSkeleton = () => (
  <div className="flex h-full w-full animate-pulse flex-col justify-end gap-3 rounded-md border border-dashed border-slate-200 p-5">
    <div className="h-24 rounded bg-slate-100" />
    <div className="h-16 rounded bg-slate-100" />
    <div className="h-10 rounded bg-slate-100" />
  </div>
);

export const EmptyChart = ({ message = 'No data available for selected date range' }) => (
  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
    {message}
  </div>
);

export const LoadingSkeleton = ChartSkeleton;

export const EmptyState = ({ message = 'No data available for selected date range' }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
    {message}
  </div>
);

export const ChartCard = ({ title, children, className = '' }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    {title && <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>}
    {children}
  </div>
);

export const AnalyticsSectionHeader = ({ title, subtitle, color = '#8b5cf6' }) => (
  <div>
    <h1>
      <span style={{ display: 'inline-block', background: color, color: '#fff', padding: '5px 20px', borderRadius: 6, fontSize: 22, fontWeight: 800 }}>{title}</span>
    </h1>
    {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
  </div>
);
