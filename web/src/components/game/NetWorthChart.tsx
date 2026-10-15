"use client";

import { useApp } from "../AppState";

export interface Series {
  id: string;
  label: string;
  color: string;
  dashed?: boolean;
  points: { age: number; value: number }[];
}

const W = 720;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 36, left: 76 };

/** Net worth in today's money across the player's ages. Hand-drawn SVG so it themes with the line colors. */
export function NetWorthChart({ series, title }: { series: Series[]; title: string }) {
  const { money } = useApp();
  const all = series.flatMap((s) => s.points);
  const minAge = Math.min(...all.map((p) => p.age));
  const maxAge = Math.max(...all.map((p) => p.age));
  const minV = Math.min(0, ...all.map((p) => p.value));
  const maxV = Math.max(1, ...all.map((p) => p.value));
  const x = (age: number) => PAD.left + ((age - minAge) / Math.max(1, maxAge - minAge)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * (H - PAD.top - PAD.bottom);
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + ((maxV - minV) * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => Math.round(minAge + ((maxAge - minAge) * i) / 4));

  return (
    <figure>
      <figcaption className="mb-3 text-lg font-extrabold">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--panel-strong)" strokeWidth={v === 0 ? 2 : 1} />
            <text x={PAD.left - 10} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="13" fill="var(--ink-2)">
              {money(v, { compact: true })}
            </text>
          </g>
        ))}
        {xTicks.map((a) => (
          <text key={a} x={x(a)} y={H - 10} textAnchor="middle" fontSize="13" fill="var(--ink-2)">
            {a}
          </text>
        ))}
        {series.map((s) => {
          const d = s.points.map((p, i) => `${i ? "L" : "M"}${x(p.age).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
          return (
            <g key={s.id}>
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dashed ? 3 : 5}
                strokeDasharray={s.dashed ? "8 7" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={s.dashed ? undefined : "draw-line"}
              />
              {!s.dashed &&
                s.points.map((p) => <circle key={p.age} cx={x(p.age)} cy={y(p.value)} r={4.5} fill="var(--ground)" stroke={s.color} strokeWidth={3} />)}
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm font-bold">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden="true">
              <line x1="2" x2="26" y1="4" y2="4" stroke={s.color} strokeWidth={s.dashed ? 3 : 5} strokeDasharray={s.dashed ? "6 4" : undefined} strokeLinecap="round" />
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
