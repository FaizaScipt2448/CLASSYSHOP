import React from 'react';
import { titleCase } from '../../utils/analyticsFormat';

const trendStyles = {
  hot: 'bg-red-100 text-red-700 ring-red-200',
  rising: 'bg-orange-100 text-orange-700 ring-orange-200',
  stable: 'bg-blue-100 text-blue-700 ring-blue-200',
  falling: 'bg-gray-100 text-gray-700 ring-gray-200',
  dead: 'bg-black text-white ring-black',
};

const urgencyStyles = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  low: 'bg-green-100 text-green-700 ring-green-200',
};

const Badge = ({ className, children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${className}`}>
    {children}
  </span>
);

export const TrendBadge = ({ value }) => {
  const key = String(value || 'stable').toLowerCase();
  return <Badge className={trendStyles[key] || trendStyles.stable}>{titleCase(key)}</Badge>;
};

export const UrgencyBadge = ({ value }) => {
  const key = String(value || 'low').toLowerCase();
  return <Badge className={urgencyStyles[key] || urgencyStyles.low}>{titleCase(key)}</Badge>;
};

export const RecommendationBadge = ({ value }) => (
  <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{titleCase(value || 'watch')}</Badge>
);
