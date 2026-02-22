import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { PricePoint } from "@/data/store";

const CHART_HEIGHT = 180;
const PADDING = { top: 12, right: 12, bottom: 24, left: 36 };

interface MarketPriceChartProps {
  priceHistory: PricePoint[];
  width: number;
}

function buildStepPath(
  points: PricePoint[],
  getValue: (p: PricePoint) => number,
  x: (t: number) => number,
  y: (pct: number) => number,
  chartWidth: number
): string {
  const endX = PADDING.left + chartWidth;
  if (points.length === 1) {
    const px = x(points[0].timestamp);
    const py = y(getValue(points[0]));
    return `M ${px} ${py} L ${endX} ${py}`;
  }
  let pathD = "";
  points.forEach((p, i) => {
    const px = x(p.timestamp);
    const py = y(getValue(p));
    if (i === 0) {
      pathD = `M ${px} ${py}`;
    } else {
      const prevPy = y(getValue(points[i - 1]));
      pathD += ` L ${px} ${prevPy} L ${px} ${py}`;
    }
  });
  pathD += ` L ${endX} ${y(getValue(points[points.length - 1]))}`;
  return pathD;
}

function formatTimestamp(t: number, rangeMs: number): string {
  const d = new Date(t);
  const rangeDays = rangeMs / (1000 * 60 * 60 * 24);
  const rangeHours = rangeMs / (1000 * 60 * 60);

  if (rangeDays >= 7) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (rangeDays >= 1) {
    const h = d.getHours();
    const ampm = h >= 12 ? "p" : "a";
    const h12 = h % 12 || 12;
    return `${d.getMonth() + 1}/${d.getDate()} ${h12}${ampm}`;
  }
  if (rangeHours >= 1) {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m > 0 ? `${h12}:${String(m).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
  }
  const m = d.getMinutes();
  const s = d.getSeconds();
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getTimeAxisLabels(minTime: number, maxTime: number): { x: number; label: string }[] {
  const rangeMs = maxTime - minTime || 1;
  const labels: { x: number; label: string }[] = [];
  const numTicks = 5;

  for (let i = 0; i <= numTicks; i++) {
    const t = minTime + (rangeMs * i) / numTicks;
    labels.push({ x: (i / numTicks) * 100, label: formatTimestamp(t, rangeMs) });
  }
  return labels;
}

export function MarketPriceChart({ priceHistory, width }: MarketPriceChartProps) {
  const { yesPath, noPath, hasData, timeLabels, chartWidth } = useMemo(() => {
    const cw = width - PADDING.left - PADDING.right;
    const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    if (!priceHistory || priceHistory.length === 0) {
      return { yesPath: "", noPath: "", hasData: false, timeLabels: [], chartWidth: cw };
    }

    const points = priceHistory;
    const minT = points[0].timestamp;
    const maxT = Date.now();
    const timeRange = Math.max(maxT - minT, 1);

    const x = (t: number) =>
      PADDING.left + ((t - minT) / timeRange) * cw;
    const y = (pct: number) =>
      PADDING.top + chartHeight - (pct / 100) * chartHeight;

    const yesPathD = buildStepPath(points, (p) => p.yesPercent, x, y, cw);
    const noPathD = buildStepPath(points, (p) => 100 - p.yesPercent, x, y, cw);
    const timeLabelsData = getTimeAxisLabels(minT, maxT);

    return {
      yesPath: yesPathD,
      noPath: noPathD,
      hasData: true,
      timeLabels: timeLabelsData,
      chartWidth: cw,
    };
  }, [priceHistory, width]);

  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  return (
    <View style={[styles.wrapper, { width }]}>
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={[styles.yAxis, { width: PADDING.left - 4 }]}>
          {[100, 75, 50, 25, 0].map((pct) => {
            const yPos = PADDING.top + chartHeight - (pct / 100) * chartHeight - 6;
            return (
              <Text
                key={pct}
                style={[styles.yLabel, { position: "absolute" as const, top: yPos }]}
              >
                {pct}%
              </Text>
            );
          })}
        </View>

        <Svg width={width} height={CHART_HEIGHT} style={styles.svg}>
          {/* Grid lines */}
          {[25, 50, 75].map((pct) => {
            const y = PADDING.top + chartHeight - (pct / 100) * chartHeight;
            return (
              <Path
                key={pct}
                d={`M ${PADDING.left} ${y} L ${width - PADDING.right} ${y}`}
                stroke="#2A2A2A"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}
          {/* YES line */}
          {hasData && (
            <Path
              d={yesPath}
              stroke="#14F195"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* NO line */}
          {hasData && (
            <Path
              d={noPath}
              stroke="#F03E3E"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>

        {/* X-axis time labels */}
        {hasData && timeLabels.length > 0 && (
          <View style={[styles.xAxis, { width: chartWidth }]}>
            {timeLabels.map(({ x, label }, i) => (
              <Text
                key={i}
                style={[
                  styles.xLabel,
                  {
                    left: (x / 100) * chartWidth - 24,
                  },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  chartContainer: { position: "relative", paddingLeft: PADDING.left },
  yAxis: {
    position: "absolute",
    left: 0,
    top: 0,
    height: CHART_HEIGHT,
    zIndex: 1,
  },
  yLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  svg: { overflow: "visible", marginLeft: -PADDING.left },
  xAxis: {
    position: "relative",
    marginTop: 6,
    marginLeft: PADDING.left,
    height: 14,
  },
  xLabel: {
    position: "absolute",
    fontSize: 9,
    color: "#6b7280",
    width: 48,
    textAlign: "center",
  },
});
