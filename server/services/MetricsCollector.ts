export interface ProtocolMetrics {
  tokens: number;
  latency_ms: number;
  quality_score: number;
}

export interface MetricsSummary {
  total_runs: number;
  avg_latency: number;
  avg_tokens: number;
  avg_quality: number;
  protocol_breakdown: Record<string, {
    runs: number;
    avg_latency: number;
    avg_tokens: number;
    avg_quality: number;
  }>;
}

export class MetricsCollector {
  private metrics: Array<{
    protocol: string;
    timestamp: Date;
    metrics: ProtocolMetrics;
  }> = [];

  recordProtocolRun(protocol: string, metrics: ProtocolMetrics): void {
    this.metrics.push({
      protocol,
      timestamp: new Date(),
      metrics
    });
  }

  getSummary(): MetricsSummary {
    if (this.metrics.length === 0) {
      return {
        total_runs: 0,
        avg_latency: 0,
        avg_tokens: 0,
        avg_quality: 0,
        protocol_breakdown: {}
      };
    }

    const totalRuns = this.metrics.length;
    const avgLatency = this.metrics.reduce((sum, m) => sum + m.metrics.latency_ms, 0) / totalRuns;
    const avgTokens = this.metrics.reduce((sum, m) => sum + m.metrics.tokens, 0) / totalRuns;
    const avgQuality = this.metrics.reduce((sum, m) => sum + m.metrics.quality_score, 0) / totalRuns;

    const protocolBreakdown: Record<string, any> = {};
    const protocolGroups = this.groupBy(this.metrics, m => m.protocol);

    for (const [protocol, runs] of Object.entries(protocolGroups)) {
      const protocolRuns = runs.length;
      const protocolAvgLatency = runs.reduce((sum, m) => sum + m.metrics.latency_ms, 0) / protocolRuns;
      const protocolAvgTokens = runs.reduce((sum, m) => sum + m.metrics.tokens, 0) / protocolRuns;
      const protocolAvgQuality = runs.reduce((sum, m) => sum + m.metrics.quality_score, 0) / protocolRuns;

      protocolBreakdown[protocol] = {
        runs: protocolRuns,
        avg_latency: protocolAvgLatency,
        avg_tokens: protocolAvgTokens,
        avg_quality: protocolAvgQuality
      };
    }

    return {
      total_runs: totalRuns,
      avg_latency: avgLatency,
      avg_tokens: avgTokens,
      avg_quality: avgQuality,
      protocol_breakdown: protocolBreakdown
    };
  }

  getProtocolMetrics(protocol: string): Array<{
    timestamp: string;
    metrics: ProtocolMetrics;
  }> {
    return this.metrics
      .filter(m => m.protocol === protocol)
      .map(m => ({
        timestamp: m.timestamp.toISOString(),
        metrics: m.metrics
      }));
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}