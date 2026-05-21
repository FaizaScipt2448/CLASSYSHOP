export const currency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;

export const percent = (value = 0) => `${Number(value || 0).toLocaleString('en-PK')}%`;

export const titleCase = (value = '') =>
  String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const chartColors = ['#e94560', '#1565c0', '#f59e0b', '#10b981', '#7c3aed', '#0ea5e9', '#64748b', '#111827'];
