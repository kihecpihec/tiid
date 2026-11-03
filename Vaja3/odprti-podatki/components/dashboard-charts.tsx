"use client";

import { curveLinear } from "@visx/curve";
import { LineChart } from "@/components/charts/line-chart";
import { Line } from "@/components/charts/line";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { XAxis } from "@/components/charts/x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { useChart } from "@/components/charts/chart-context";
import type { Mode, Point } from "@/lib/analysis";

const number = new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("sl-SI", {
  notation: "compact",
  maximumFractionDigits: 1,
});
export const formatValue = (
  value: number | null | undefined,
  mode: Mode,
): string =>
  value == null
    ? "—"
    : `${number.format(value)}${mode === "percent" ? " %" : ""}`;

function YAxis({ mode }: { mode: Mode }) {
  const { yScale, margin } = useChart();
  return (
    <g aria-hidden="true">
      {yScale.ticks(4).map((value) => (
        <text
          key={value}
          x={-10}
          y={yScale(value)}
          textAnchor="end"
          dominantBaseline="middle"
          fill="var(--chart-label)"
          fontSize={11}
          style={{ fontVariantNumeric: "tabular-nums" }}
          data-margin={margin.left}
        >
          {compact.format(value)}
          {mode === "percent" ? " %" : ""}
        </text>
      ))}
    </g>
  );
}

// Bklit recognizes this name when placing axes outside the plot clip.
YAxis.displayName = "YAxis";

export function TrendChart({ points, mode }: { points: Point[]; mode: Mode }) {
  const data = points.map((p) => ({
    date: new Date(Date.UTC(p.year, 0, 1)),
    value: p.value,
    year: p.year,
    reason: p.reason,
  }));
  return (
    <LineChart
      data={data}
      className="chart-canvas"
      aspectRatio="auto"
      margin={{ top: 26, right: 22, bottom: 44, left: 62 }}
      animationDuration={0}
      yDomainTween={false}
    >
      <Grid
        horizontal
        fadeHorizontal={false}
        strokeDasharray="3,5"
        numTicksRows={4}
      />
      <YAxis mode={mode} />
      <Line
        dataKey="value"
        stroke="var(--teal)"
        strokeWidth={3}
        curve={curveLinear}
        fadeEdges={false}
        animate={false}
        showMarkers
        markers={{
          radius: 4,
          fill: "var(--teal)",
          stroke: "var(--card)",
          strokeWidth: 2,
        }}
        showHighlight={false}
      />
      <XAxis labels={points.map((p) => String(p.year))} numTicks={5} />
      <ChartTooltip
        showDots={false}
        showDatePill={false}
        content={({ point }) => (
          <div className="chart-tip">
            <strong>{String(point.year)}</strong>
            <span>
              {typeof point.value === "number"
                ? formatValue(point.value, mode)
                : String(point.reason)}
            </span>
          </div>
        )}
      />
    </LineChart>
  );
}

export interface GroupPoint {
  name: string;
  label: string;
  value: number | null;
  reason: string | null;
  annotations: string[];
}
export function ComparisonChart({
  groups,
  mode,
}: {
  groups: GroupPoint[];
  mode: Mode;
}) {
  return (
    <BarChart
      data={groups.map((g) => ({ ...g }))}
      className="chart-canvas"
      aspectRatio="auto"
      margin={{ top: 26, right: 22, bottom: 44, left: 62 }}
      barGap={0.5}
      animationDuration={0}
    >
      <Grid
        horizontal
        fadeHorizontal={false}
        strokeDasharray="3,5"
        numTicksRows={4}
      />
      <YAxis mode={mode} />
      <Bar dataKey="value" fill="var(--teal)" lineCap="round" />
      <BarXAxis showAllLabels />
      <ChartTooltip
        showDots={false}
        showDatePill={false}
        content={({ point }) => (
          <div className="chart-tip">
            <strong>{String(point.label)}</strong>
            <span>
              {typeof point.value === "number"
                ? formatValue(point.value, mode)
                : String(point.reason)}
            </span>
          </div>
        )}
      />
    </BarChart>
  );
}
