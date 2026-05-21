import React from 'react';
import { Link } from 'react-router-dom';

/**
 * color  — accent hex (e.g. '#7c3aed')
 * pastel — when true: light tinted bg + colored text (soft look)
 *          when false/absent: solid colored bg + white text
 */
const KPICard = ({ title, value, delta, icon, to, onClick, color, pastel }) => {
  const numericDelta = Number(delta || 0);
  const isPositive   = numericDelta >= 0;
  const clickable    = !!(to || onClick);

  // ── Style derivation ────────────────────────────────────────────
  let cardBg, cardBorder, labelColor, valueColor, iconBg, iconColor, deltaColor;

  if (pastel && color) {
    // Light pastel: colored tint background, coloured text
    cardBg     = color + '18';          // ~10% opacity tint
    cardBorder = color + '35';
    labelColor = color;
    valueColor = color;
    iconBg     = color + '28';
    iconColor  = color;
    deltaColor = isPositive ? '#059669' : '#dc2626';
  } else if (color) {
    // Solid: full color bg, white text
    cardBg     = color;
    cardBorder = 'transparent';
    labelColor = 'rgba(255,255,255,0.8)';
    valueColor = '#fff';
    iconBg     = 'rgba(255,255,255,0.22)';
    iconColor  = '#fff';
    deltaColor = 'rgba(255,255,255,0.85)';
  } else {
    // Default white card
    cardBg     = '#fff';
    cardBorder = '#e2e8f0';
    labelColor = '#64748b';
    valueColor = '#0f172a';
    iconBg     = '#fff1f2';
    iconColor  = '#e94560';
    deltaColor = isPositive ? '#059669' : '#dc2626';
  }

  const inner = (
    <div
      className={`rounded-xl border p-5 shadow-sm h-full transition-all duration-200 ${clickable ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}`}
      style={{ background: cardBg, borderColor: cardBorder }}
      onClick={!to ? onClick : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: labelColor }}>{title}</p>
          <h3 className="mt-2 text-2xl font-bold leading-tight truncate" style={{ color: valueColor }}>{value}</h3>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>

      {delta !== undefined && (
        <p className="mt-3 text-sm font-semibold" style={{ color: deltaColor }}>
          {isPositive ? '+' : ''}{numericDelta}% vs last period
        </p>
      )}

      {clickable && (
        <p className="mt-2 text-xs font-medium" style={{ color: pastel ? color + 'cc' : 'rgba(255,255,255,0.65)' }}>
          Click to view details →
        </p>
      )}
    </div>
  );

  return to ? (
    <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  ) : inner;
};

export default KPICard;
