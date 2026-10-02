import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Table2, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { compactNumber } from '../../utils/format';

/**
 * Chart palette, read from the theme.
 *
 * Recharts needs concrete colour strings, so these come out of the CSS custom
 * properties rather than being hardcoded — which is what lets the charts follow
 * the light/dark switch instead of keeping dark-mode axis greys on a white card.
 *
 * Each theme's values were checked separately with the data-viz validator
 * against that theme's card surface (see src/styles/theme.css). Three
 * categorical slots pass all-pairs CVD separation in both themes, which is why
 * no chart here uses a fourth series.
 *
 * Course status is deliberately NOT encoded by colour anywhere: a
 * green/amber/red status triad collapses for deuteranopes, so status charts use
 * one hue and let the text label carry identity.
 */
const VIZ_VARS = [
  'viz-surface',
  'viz-grid',
  'viz-axis',
  'viz-tick',
  'viz-cat-1',
  'viz-cat-2',
  'viz-cat-3',
  'viz-seq-1',
  'viz-seq-2',
  'viz-seq-3',
  'viz-seq-4',
  'viz-seq-5',
  'viz-cursor',
];

/** Dark-theme values, used for the first paint and for SSR-less fallback. */
const VIZ_FALLBACK = {
  'viz-surface': '#151325',
  'viz-grid': '#221e3b',
  'viz-axis': '#64748b',
  'viz-tick': '#cbd5e1',
  'viz-cat-1': '#8b5cf6',
  'viz-cat-2': '#0891b2',
  'viz-cat-3': '#d97706',
  'viz-seq-1': '#c4b5fd',
  'viz-seq-2': '#a78bfa',
  'viz-seq-3': '#8b5cf6',
  'viz-seq-4': '#7c3aed',
  'viz-seq-5': '#5b21b6',
  'viz-cursor': 'rgba(139, 92, 246, 0.07)',
};

function readViz() {
  if (typeof window === 'undefined') return VIZ_FALLBACK;
  const style = getComputedStyle(document.documentElement);
  const out = {};
  for (const name of VIZ_VARS) {
    out[name] = style.getPropertyValue(`--${name}`).trim() || VIZ_FALLBACK[name];
  }
  return out;
}

/** Re-reads the palette whenever the theme changes. */
function useViz() {
  const { theme } = useTheme();

  return useMemo(() => {
    const raw = readViz();
    return {
      surface: raw['viz-surface'],
      grid: raw['viz-grid'],
      axis: raw['viz-axis'],
      tick: raw['viz-tick'],
      cursor: raw['viz-cursor'],
      categorical: [raw['viz-cat-1'], raw['viz-cat-2'], raw['viz-cat-3']],
      sequential: [
        raw['viz-seq-1'],
        raw['viz-seq-2'],
        raw['viz-seq-3'],
        raw['viz-seq-4'],
        raw['viz-seq-5'],
      ],
      single: raw['viz-cat-1'],
    };
    // `theme` is the dependency: the variables change with it.
  }, [theme]);
}

/** Picks a sequential step by rank, darkest for the largest value. */
const rankColor = (viz, index, total) => {
  if (total <= 1) return viz.sequential[1];
  const step = Math.round((index / (total - 1)) * (viz.sequential.length - 1));
  return viz.sequential[viz.sequential.length - 1 - step];
};

/* ── Shared chrome ───────────────────────────────────────────────────────── */

const axisPropsFor = (viz) => ({
  stroke: viz.axis,
  tick: { fill: viz.axis, fontSize: 11, fontWeight: 500 },
  tickLine: false,
  axisLine: false,
});

/** Hairline, solid, one step off the surface — recessive by design. */
const Grid = ({ viz, vertical = false, horizontal = true }) => (
  <CartesianGrid stroke={viz.grid} strokeWidth={1} vertical={vertical} horizontal={horizontal} />
);

function TooltipCard({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-850/97 px-3.5 py-2.5 shadow-glow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey || entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: entry.color || entry.payload?.fill }}
              aria-hidden="true"
            />
            <span className="text-slate-400">{entry.name}</span>
            <span className="ml-auto font-bold text-white">
              {formatter ? formatter(entry.value) : Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Frame every chart sits in: title, optional action, and a toggle that reveals
 * the same numbers as a table. The table view is what makes a chart readable
 * when colour is unavailable, so it is present on every chart, not optional.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  tableData,
  tableColumns,
  height = 260,
  className,
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={clsx('surface-raised flex flex-col overflow-hidden', className)}>
      {/* No flex-wrap: a long subtitle must not push the controls onto their own row. */}
      <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-base">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {tableData?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable((value) => !value)}
              aria-pressed={showTable}
              title={showTable ? 'Show chart' : 'Show data table'}
              className={clsx(
                'btn-icon',
                showTable && 'bg-violet-600/20 text-violet-300'
              )}
            >
              <Table2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {showTable ? (
        <div className="max-h-[320px] overflow-auto px-5 pb-5 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={clsx(
                      'border-b border-ink-700 pb-2 text-2xs font-bold uppercase tracking-wider text-slate-500',
                      col.align === 'right' ? 'text-right' : 'text-left'
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="border-b border-ink-800/70 last:border-0">
                  {tableColumns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'py-2 text-slate-300',
                        col.align === 'right' ? 'text-right font-semibold text-white' : ''
                      )}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-1 pb-3 pt-4" style={{ height }}>
          {children}
        </div>
      )}
    </section>
  );
}

/* ── Trend: single series area ───────────────────────────────────────────── */

const shortDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * One series over time. Area fill is a 10% wash under a 2px line; no legend,
 * because the card title already names the single series.
 */
export function TrendArea({ data, dataKey = 'count', name = 'Count', xKey = 'date' }) {
  const viz = useViz();
  const axisProps = axisPropsFor(viz);

  const gradientId = `trend-${dataKey}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={viz.single} stopOpacity={0.22} />
            <stop offset="100%" stopColor={viz.single} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Grid viz={viz} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          tickFormatter={shortDate}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis {...axisProps} allowDecimals={false} width={44} tickFormatter={compactNumber} />
        <Tooltip
          content={<TooltipCard labelFormatter={shortDate} />}
          cursor={{ stroke: viz.single, strokeWidth: 1, strokeOpacity: 0.45 }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={viz.single}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: viz.surface, fill: viz.single }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Two or three series over time. Categorical slots in fixed order, and a legend
 * is always present so identity never depends on colour alone.
 */
export function TrendLines({ data, series, xKey = 'date' }) {
  const viz = useViz();
  const axisProps = axisPropsFor(viz);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <Grid viz={viz} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          tickFormatter={shortDate}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis {...axisProps} allowDecimals={false} width={44} tickFormatter={compactNumber} />
        <Tooltip
          content={<TooltipCard labelFormatter={shortDate} />}
          cursor={{ stroke: viz.axis, strokeWidth: 1, strokeOpacity: 0.4 }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="plainline"
          iconSize={14}
          wrapperStyle={{ fontSize: 11, color: viz.axis, paddingBottom: 6 }}
        />
        {series.map((item, index) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={viz.categorical[index % viz.categorical.length]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={false}
            activeDot={{
              r: 4.5,
              strokeWidth: 2,
              stroke: viz.surface,
              fill: viz.categorical[index % viz.categorical.length],
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Magnitude: columns ──────────────────────────────────────────────────── */

/**
 * Ordered magnitude comparison. One hue, because the categories are an ordered
 * scale rather than distinct identities.
 */
export function MagnitudeColumns({ data, xKey = 'label', dataKey = 'count', name = 'Count' }) {
  const viz = useViz();
  const axisProps = axisPropsFor(viz);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -14 }} barCategoryGap="22%">
        <Grid viz={viz} />
        <XAxis dataKey={xKey} {...axisProps} interval={0} />
        <YAxis {...axisProps} allowDecimals={false} width={44} tickFormatter={compactNumber} />
        <Tooltip content={<TooltipCard />} cursor={{ fill: viz.cursor }} />
        <Bar
          dataKey={dataKey}
          name={name}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
          stroke={viz.surface}
          strokeWidth={1}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={rankColor(viz, index, data.length)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Horizontal bars for long category names. Identity is the text label on the
 * y-axis, so colour is free to encode magnitude instead.
 */
export function MagnitudeBars({
  data,
  yKey = 'name',
  dataKey = 'value',
  name = 'Value',
  color,
  labelWidth = 132,
}) {
  const viz = useViz();
  const axisProps = axisPropsFor(viz);

  const ranked = useMemo(
    () => [...data].sort((a, b) => (b[dataKey] || 0) - (a[dataKey] || 0)),
    [data, dataKey]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={ranked}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 0, left: 4 }}
        barCategoryGap="22%"
      >
        <Grid viz={viz} vertical horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={compactNumber} />
        <YAxis
          type="category"
          dataKey={yKey}
          {...axisProps}
          width={labelWidth}
          tick={{ fill: viz.tick, fontSize: 11, fontWeight: 500 }}
          // Truncate in the formatter: SVG text has no ellipsis, so a long
          // label would otherwise be cut mid-glyph by the axis gutter.
          tickFormatter={(value) => {
            const max = Math.max(8, Math.floor((labelWidth - 12) / 6.2));
            const text = String(value);
            return text.length > max ? `${text.slice(0, max - 1)}…` : text;
          }}
        />
        <Tooltip content={<TooltipCard />} cursor={{ fill: viz.cursor }} />
        <Bar
          dataKey={dataKey}
          name={name}
          maxBarSize={22}
          radius={[0, 4, 4, 0]}
          stroke={viz.surface}
          strokeWidth={1}
          // Value at the tip: the label the reader actually wants.
          label={{
            position: 'right',
            fill: viz.tick,
            fontSize: 11,
            fontWeight: 700,
            formatter: (value) => (value > 0 ? value : ''),
          }}
        >
          {ranked.map((entry, index) => (
            <Cell key={index} fill={color || entry.color || rankColor(viz, index, ranked.length)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Part-to-whole: donut ────────────────────────────────────────────────── */

/**
 * Part-to-whole for at most three slices, which is the validated all-pairs cap
 * for this palette. A legend is always rendered, and each slice's share is
 * shown as text, so the split is readable without colour.
 */
export function ShareDonut({ data, nameKey = 'name', dataKey = 'value', centerLabel, centerValue }) {
  const viz = useViz();

  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  return (
    <div className="flex h-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius="64%"
              outerRadius="96%"
              paddingAngle={2}
              stroke={viz.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={viz.categorical[index % viz.categorical.length]} />
              ))}
            </Pie>
            <Tooltip
              content={
                <TooltipCard
                  formatter={(value) =>
                    `${Number(value).toLocaleString()}${total ? ` · ${Math.round((value / total) * 100)}%` : ''}`
                  }
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-white">
            {centerValue ?? compactNumber(total)}
          </span>
          {centerLabel && (
            <span className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Legend carries identity in text; the swatch beside it carries colour. */}
      <ul className="w-full max-w-[220px] space-y-2">
        {data.map((entry, index) => (
          <li key={entry[nameKey]} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: viz.categorical[index % viz.categorical.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-slate-400">{entry[nameKey]}</span>
            <span className="font-bold text-white">{entry[dataKey]}</span>
            <span className="w-9 text-right text-xs text-slate-500">
              {total ? `${Math.round((entry[dataKey] / total) * 100)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Meter: a single ratio against a limit ───────────────────────────────── */

/** For one ratio, a meter beats a two-slice pie. */
export function Meter({ label, value, total, hint, tone = 'violet' }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const fills = {
    violet: 'bg-violet-gradient',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  };

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className="font-display text-lg font-bold text-white">
          {pct}%
          <span className="ml-1.5 text-xs font-medium text-slate-500">
            {value}/{total}
          </span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink-700">
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-premium', fills[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ── Sparkline for stat tiles ────────────────────────────────────────────── */

export function Sparkline({ data, dataKey = 'count', height = 40 }) {
  const viz = useViz();

  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={viz.single} stopOpacity={0.3} />
              <stop offset="100%" stopColor={viz.single} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={viz.single}
            strokeWidth={2}
            fill="url(#spark)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmptyChart({ message = 'Not enough data yet' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <TrendingUp className="h-7 w-7 text-ink-500" aria-hidden="true" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
