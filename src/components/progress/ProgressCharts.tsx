'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { SessionHistoryItem, UserStats } from '@/lib/types';
import { getKeyboardLayout } from '@/content/keyboards';

interface TrendChartsProps {
  sessions: readonly SessionHistoryItem[];
}

interface SparklineProps {
  data: readonly number[];
  color: string;
  width?: number;
  height?: number;
}

function Sparkline({ data, color, width = 200, height = 60 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-30">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={2} strokeDasharray="4,4" />
      </svg>
    );
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * stepX;
    const y = height - ((val - minVal) / range) * (height - 20) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`M${points}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${points} L${width},${height} L0,${height} Z`}
        fill="url(#sparklineGradient)"
      />
    </svg>
  );
}

function TrendChart({
  sessions,
  metricKey,
  title,
  color,
  formatValue,
}: {
  sessions: readonly SessionHistoryItem[];
  metricKey: keyof SessionHistoryItem;
  title: string;
  color: string;
  formatValue: (val: number) => string;
}) {
  const chartData = useMemo(() => {
    const reversed = [...sessions].reverse();
    return reversed.map((s) => s[metricKey] as number);
  }, [sessions, metricKey]);

  const latest = chartData[chartData.length - 1] ?? 0;
  const previous = chartData[chartData.length - 2] ?? 0;
  const change = latest - previous;
  const changePct = previous > 0 ? ((change / previous) * 100).toFixed(1) : '0';

  return (
    <Card variant="elevated" padding="md" className="h-full">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change >= 0 ? '+' : ''}{formatValue(change)} ({change >= 0 ? '+' : ''}{changePct}%)
          </span>
        </div>
        <div className="text-2xl font-extrabold text-foreground mt-1">
          {formatValue(latest)}
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <div className="h-24 w-full">
          <Sparkline data={chartData} color={color} />
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendCharts({ sessions }: TrendChartsProps) {
  const modeColors = {
    guided: '#3b82f6',
    reflex: '#8b5cf6',
    vocabulary: '#10b981',
  } as const;

  const sessionsByMode = useMemo(() => {
    const grouped: Record<string, SessionHistoryItem[]> = {
      guided: [],
      reflex: [],
      vocabulary: [],
    };
    sessions.forEach((s) => {
      grouped[s.mode].push(s);
    });
    return grouped;
  }, [sessions]);

  return (
    <Card variant="bordered" padding="lg">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg">Performance Trends</CardTitle>
        <CardDescription>
          Recent session trends across all practice modes (last {sessions.length} sessions).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TrendChart
            sessions={sessions}
            metricKey="netWpm"
            title="Net WPM"
            color="#3b82f6"
            formatValue={(v) => `${Math.round(v)} WPM`}
          />
          <TrendChart
            sessions={sessions}
            metricKey="accuracy"
            title="Accuracy"
            color="#10b981"
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
          <TrendChart
            sessions={sessions}
            metricKey="durationMs"
            title="Duration"
            color="#8b5cf6"
            formatValue={(v) => `${Math.round(v / 1000)}s`}
          />
        </div>

        <div className="pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Sessions by Mode</h4>
          <div className="grid grid-cols-3 gap-4">
            {(['guided', 'reflex', 'vocabulary'] as const).map((mode) => {
              const modeSessions = sessionsByMode[mode];
              const avgWpm = modeSessions.length > 0
                ? modeSessions.reduce((a, b) => a + b.netWpm, 0) / modeSessions.length
                : 0;
              const avgAcc = modeSessions.length > 0
                ? modeSessions.reduce((a, b) => a + b.accuracy, 0) / modeSessions.length
                : 0;
              return (
                <div
                  key={mode}
                  className="p-4 rounded-lg border border-border/50 text-center"
                  style={{ borderColor: `${modeColors[mode]}40` }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: modeColors[mode] }}
                    />
                    <span className="text-xs font-semibold uppercase text-foreground">
                      {mode}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sessions</span>
                      <span className="font-semibold text-foreground">{modeSessions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg WPM</span>
                      <span className="font-semibold text-foreground">{Math.round(avgWpm)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Acc</span>
                      <span className="font-semibold text-foreground">{avgAcc.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KeyboardHeatmapProps {
  perKeyErrors: UserStats['perKeyErrors'];
  layoutId?: string;
}

function KeyboardHeatmap({ perKeyErrors, layoutId = 'qwerty-us' }: KeyboardHeatmapProps) {
  const layout = getKeyboardLayout(layoutId);
  const maxErrors = useMemo(() => {
    const values = Object.values(perKeyErrors);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [perKeyErrors]);

  const getKeyIntensity = (char: string) => {
    const count = perKeyErrors[char] ?? 0;
    if (count === 0) return 0;
    const normalized = count / maxErrors;
    if (normalized >= 0.8) return 4;
    if (normalized >= 0.6) return 3;
    if (normalized >= 0.4) return 2;
    return 1;
  };

  const intensityColors = [
    'bg-gray-200 dark:bg-gray-700',    // 0
    'bg-rose-100 dark:bg-rose-900/30',  // 1
    'bg-rose-200 dark:bg-rose-800/50',  // 2
    'bg-rose-300 dark:bg-rose-700/70',  // 3
    'bg-rose-500 dark:bg-rose-500',     // 4
  ];

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '2px',
    marginBottom: '4px',
  };

  return (
    <div className="font-mono text-xs overflow-x-auto p-4 bg-card rounded-lg border border-border/50">
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span>Intensity:</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className={`w-4 h-4 rounded ${intensityColors[i]}`}
              style={{ border: i === 0 ? '1px solid' : 'none' }}
            />
            {i === 0 ? 'None' : i === 4 ? 'High' : ''}
          </span>
        ))}
      </div>
      <div style={rowStyles}>
        {layout.rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
            {row.keys.map((key, keyIndex) => {
              if (!key.primary || key.primary.length !== 1) return null;
              const intensity = getKeyIntensity(key.primary);
              const width = (key.width ?? 1) * 36;
              return (
                <div
                  key={keyIndex}
                  className={`flex items-center justify-center rounded transition-colors ${intensityColors[intensity]}`}
                  style={{
                    width: `${width}px`,
                    height: '36px',
                    minWidth: '36px',
                    fontSize: '11px',
                    fontWeight: intensity >= 3 ? 600 : 400,
                    color: intensity >= 4 ? 'white' : 'inherit',
                  }}
                  title={`${key.primary}: ${perKeyErrors[key.primary] ?? 0} errors`}
                >
                  {key.primary === ' ' ? '␣' : key.primary}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeakKeysHeatmap({ perKeyErrors }: { perKeyErrors: UserStats['perKeyErrors'] }) {
  const [layoutId, setLayoutId] = React.useState('qwerty-us');

  return (
    <Card variant="default" padding="lg">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-lg">Error Heatmap</CardTitle>
          </div>
          <select
            value={layoutId}
            onChange={(e) => setLayoutId(e.target.value)}
            className="text-xs px-2 py-1 border border-border rounded bg-background"
          >
            <option value="qwerty-us">QWERTY US</option>
            <option value="us-international">US-International</option>
            <option value="arabic-101">Arabic 101</option>
          </select>
        </div>
        <CardDescription>
          Visual keyboard showing your most frequent error keys. Darker = more errors.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <KeyboardHeatmap perKeyErrors={perKeyErrors} layoutId={layoutId} />
      </CardContent>
    </Card>
  );
}