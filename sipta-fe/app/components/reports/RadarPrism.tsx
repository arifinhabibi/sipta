import { PrismAxes } from '@/src/domain/ReportEntity';
import React from 'react';

interface RadarPrismProps {
  values: PrismAxes;
  size?: number;
}

export const RadarPrism: React.FC<RadarPrismProps> = ({ values, size = 120 }) => {
  const axes = ["knowledge", "skill", "attitude", "creativity", "discipline"] as const;
  const axisLabels: Record<(typeof axes)[number], string> = {
    knowledge: "Pemahaman",
    skill: "Tugas",
    attitude: "Sikap",
    creativity: "Kreativitas",
    discipline: "Disiplin",
  };
  const max = 100;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = (value / max) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const polygonPoints = axes
    .map((a, i) => point(i, values[a as keyof PrismAxes]).join(","))
    .join(" ");

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1].reverse();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <g fill="none" stroke="#E6E9EF" strokeWidth={1}>
        {gridLevels.map((g, gi) => (
          <polygon
            key={gi}
            points={axes
              .map((_, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const r = g * radius;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(" ")}
            strokeOpacity={0.8}
            fill="none"
          />
        ))}
      </g>

      <g stroke="#E6E9EF">
        {axes.map((_, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={point(i, max)[0]}
            y2={point(i, max)[1]}
            strokeWidth={1}
          />
        ))}
      </g>

      <polygon points={polygonPoints} fill="#3B82F6" fillOpacity={0.18} stroke="#2563EB" strokeWidth={2} />

      <g fontSize={size * 0.06} fill="#475569" fontWeight={600}>
        {axes.map((a, i) => {
          const p = point(i, max + 8);
          return (
            <text 
              key={a} 
              x={p[0]} 
              y={p[1]} 
              textAnchor={p[0] > cx ? "start" : p[0] < cx ? "end" : "middle"} 
              dy={4}
              className="hidden sm:block"
            >
              {axisLabels[a]}
            </text>
          );
        })}
      </g>
    </svg>
  );
};
