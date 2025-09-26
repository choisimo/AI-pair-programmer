/**
 * Telemetry Client Implementation
 * Implements TASK-034: 구조화 이벤트 SDK 구현
 */

import { telemetryConfig } from '@/config/environment';
import { TelemetryEvent, Logger } from '../ai-engine/types';

export interface TelemetryEventData {
  name: string;
  properties?: Record<string, any>;
  metrics?: Record<string, number>;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
}

export interface TelemetryBatch {
  events: TelemetryEvent[];
  batchId: string;
  timestamp: number;
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  samplingRate: number;
}

class TelemetryClient {
  private config: TelemetryConfig;
  private eventQueue: TelemetryEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private logger: Logger;
  private sessionId: string;
  private userId?: string;

  constructor(config: TelemetryConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.sessionId = this.generateSessionId();
    
    // Start flush timer
    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Track a telemetry event
   */
  track(eventData: TelemetryEventData): void {
    if (!this.config.enabled) {
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const event: TelemetryEvent = {
      name: eventData.name,
      timestamp: eventData.timestamp || Date.now(),
      properties: {
        ...eventData.properties,
        userId: eventData.userId || this.userId,
        sessionId: eventData.sessionId || this.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      metrics: eventData.metrics
    };

    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Set user ID for all subsequent events
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear user ID
   */
  clearUserId(): void {
    this.userId = undefined;
  }

  /**
   * Manually flush events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const batch: TelemetryBatch = {
      events: [...this.eventQueue],
      batchId: this.generateBatchId(),
      timestamp: Date.now()
    };

    // Clear queue
    this.eventQueue = [];

    try {
      await this.sendBatch(batch);
      this.logger.debug('Telemetry batch sent successfully', {
        batchId: batch.batchId,
        eventCount: batch.events.length
      });
    } catch (error) {
      this.logger.error('Failed to send telemetry batch', error as Error, {
        batchId: batch.batchId,
        eventCount: batch.events.length
      });

      // Re-queue events for retry (with limit)
      if (batch.events.length < 1000) { // Prevent memory issues
        this.eventQueue.unshift(...batch.events);
      }
    }
  }

  /**
   * Shutdown telemetry client
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    await this.flush();
  }

  private async sendBatch(batch: TelemetryBatch): Promise<void> {
    if (!this.config.endpoint) {
      this.logger.warn('Telemetry endpoint not configured');
      return;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      throw new Error(`Telemetry request failed: ${response.status} ${response.statusText}`);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        this.logger.error('Scheduled flush failed', error);
      });
    }, this.config.flushInterval);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let telemetryClient: TelemetryClient | null = null;

export function createTelemetryClient(logger: Logger): TelemetryClient {
  if (!telemetryClient) {
    const config: TelemetryConfig = {
      enabled: telemetryConfig.enabled,
      endpoint: telemetryConfig.endpoint,
      batchSize: 10,
      flushInterval: telemetryConfig.exportInterval,
      maxRetries: 3,
      samplingRate: telemetryConfig.samplingRate
    };

    telemetryClient = new TelemetryClient(config, logger);
  }

  return telemetryClient;
}

export function getTelemetryClient(): TelemetryClient | null {
  return telemetryClient;
}

// Convenience functions for common events
export function trackPageView(page: string, properties?: Record<string, any>): void {
  const client = getTelemetryClient();
  if (client) {
    client.track({
      name: 'page_view',
      properties: {
        page,
        ...properties
      }
    });
  }
}

export function trackUserAction(action: string, properties?: Record<string, any>): void {
  const client = getTelemetryClient();
  if (client) {
    client.track({
      name: 'user_action',
      properties: {
        action,
        ...properties
      }
    });
  }
}

export function trackError(error: Error, context?: Record<string, any>): void {
  const client = getTelemetryClient();
  if (client) {
    client.track({
      name: 'error',
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        ...context
      }
    });
  }
}

export function trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
  const client = getTelemetryClient();
  if (client) {
    client.track({
      name: 'performance_metric',
      properties: {
        metric,
        ...properties
      },
      metrics: {
        [metric]: value
      }
    });
  }
}

// React Hook for telemetry
export function useTelemetry() {
  const client = getTelemetryClient();

  return {
    track: (eventData: TelemetryEventData) => client?.track(eventData),
    trackPageView: (page: string, properties?: Record<string, any>) => 
      trackPageView(page, properties),
    trackUserAction: (action: string, properties?: Record<string, any>) => 
      trackUserAction(action, properties),
    trackError: (error: Error, context?: Record<string, any>) => 
      trackError(error, context),
    trackPerformance: (metric: string, value: number, properties?: Record<string, any>) => 
      trackPerformance(metric, value, properties),
    setUserId: (userId: string) => client?.setUserId(userId),
    clearUserId: () => client?.clearUserId()
  };
}

export { TelemetryClient };
export type { TelemetryEventData, TelemetryBatch, TelemetryConfig };
