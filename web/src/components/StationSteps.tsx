/** A short horizontal line with labelled stations: the onboarding progress, drawn as the product's own map. */
export function StationSteps({ labels, current }: { labels: string[]; current: number }) {
  const n = labels.length;
  const edge = `${50 / n}%`;
  const span = 100 - 100 / n;
  return (
    <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      <span aria-hidden="true" className="absolute top-[11px] h-1.5 rounded-full bg-panel-strong" style={{ left: edge, right: edge }} />
      <span
        aria-hidden="true"
        className="absolute top-[11px] h-1.5 rounded-full bg-line transition-[width] duration-700"
        style={{ left: edge, width: `${(span * current) / (n - 1)}%` }}
      />
      {labels.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={label} className="relative flex flex-col items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={`relative z-10 size-7 rounded-full border-[5px] ${
                state === "upcoming" ? "border-panel-strong bg-ground" : "border-ink bg-line"
              } ${state === "current" ? "station-here" : ""}`}
            />
            <span className={`text-sm ${state === "current" ? "font-extrabold text-ink" : "text-ink-2"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
