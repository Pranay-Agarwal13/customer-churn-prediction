import React, { useState, useId } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  pulseLastPoint?: boolean;
  showGradient?: boolean;
  unit?: string;
  label?: string;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#ffb2b7',
  height = 28,
  width = 72,
  pulseLastPoint = true,
  showGradient = true,
  unit = '',
  label,
  strokeWidth = 2,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, '');

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || (min === 0 ? 1 : Math.abs(min) * 0.1);
  const paddingX = 4;
  const paddingY = 4;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * innerWidth;
    const y = paddingY + innerHeight - ((val - min) / range) * innerHeight;
    return { x, y, val };
  });

  // Stroke Path
  const pathD = points.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');

  // Closed Area Path for Soft Gradient Fill
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${(height - 1).toFixed(1)} L ${points[0].x.toFixed(1)},${(height - 1).toFixed(1)} Z`;

  const lastPoint = points[points.length - 1];
  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div
      className="relative inline-flex items-center group cursor-crosshair select-none"
      onMouseLeave={() => setHoveredIdx(null)}
      title={label || `Recent trend: ${data.join(' → ')}`}
    >
      <svg
        className="overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <defs>
          <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Soft Area Gradient Under Line */}
        {showGradient && (
          <path
            d={areaD}
            fill={`url(#grad-${gradientId})`}
            className="transition-opacity duration-200"
          />
        )}

        {/* Main Trend Line */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Hover Hit Areas */}
        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="6"
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIdx(idx)}
          />
        ))}

        {/* Pulsing indicator on latest point (when not hovering another point) */}
        {pulseLastPoint && lastPoint && hoveredIdx === null && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="4.5"
              fill={color}
              className="animate-ping opacity-60 origin-center"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="2.5"
              fill={color}
            />
          </>
        )}

        {/* Active Hover Marker */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={paddingY}
              x2={hoveredPoint.x}
              y2={height - paddingY}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="3.5"
              fill={color}
              stroke="#0f131d"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {/* Floating Tooltip on Hover */}
      {hoveredPoint && (
        <div
          className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-1.5 py-0.5 rounded bg-[#0a0e18]/95 border border-white/20 text-[9px] font-mono text-[#dfe2f1] shadow-xl whitespace-nowrap flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
          <span>
            {unit === '₹' ? `₹${hoveredPoint.val}L` : `${hoveredPoint.val}${unit}`}
          </span>
          <span className="text-[#87929a] text-[8px]">
            (pt {hoveredIdx! + 1}/{data.length})
          </span>
        </div>
      )}
    </div>
  );
};
