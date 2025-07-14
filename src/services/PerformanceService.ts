import { InteractionManager, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

interface PerformanceMetrics {
  screenLoadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryLevel: number;
  timestamp: number;
}

interface PerformanceEvent {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceServiceClass {
  private metrics: PerformanceMetrics[] = [];
  private events: PerformanceEvent[] = [];
  private screenStartTimes: Map<string, number> = new Map();
  private isMonitoring = false;

  async initialize() {
    this.isMonitoring = true;
    this.startPeriodicMonitoring();
  }

  private startPeriodicMonitoring() {
    if (!this.isMonitoring) return;

    // Monitor every 30 seconds
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const metrics: PerformanceMetrics = {
          screenLoadTime: 0, // Will be set by screen tracking
          memoryUsage: await this.getMemoryUsage(),
          cpuUsage: await this.getCpuUsage(),
          batteryLevel: await this.getBatteryLevel(),
          timestamp: Date.now(),
        };

        this.metrics.push(metrics);

        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }

        // Log to analytics if available
        this.logPerformanceMetrics(metrics);
      } catch (error) {
        console.warn('Performance monitoring error:', error);
      }
    }, 30000);
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        // iOS memory info
        const memoryInfo = await DeviceInfo.getTotalMemory();
        return memoryInfo;
      } else {
        // Android memory info
        const memoryInfo = await DeviceInfo.getTotalMemory();
        return memoryInfo;
      }
    } catch {
      return 0;
    }
  }

  private async getCpuUsage(): Promise<number> {
    try {
      // This is a simplified CPU usage calculation
      // In a real app, you'd use native modules for accurate CPU monitoring
      return Math.random() * 100; // Placeholder
    } catch {
      return 0;
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      return batteryLevel * 100;
    } catch {
      return 0;
    }
  }

  // Screen performance tracking
  startScreenTracking(screenName: string) {
    this.screenStartTimes.set(screenName, Date.now());
  }

  endScreenTracking(screenName: string) {
    const startTime = this.screenStartTimes.get(screenName);
    if (startTime) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.events.push({
        name: `screen_load_${screenName}`,
        startTime,
        endTime,
        duration,
        metadata: { screenName },
      });

      this.screenStartTimes.delete(screenName);
      
      // Log to analytics
      this.logScreenLoadTime(screenName, duration);
    }
  }

  // Custom event tracking
  startEvent(eventName: string, metadata?: Record<string, any>) {
    const event: PerformanceEvent = {
      name: eventName,
      startTime: Date.now(),
      metadata,
    };
    this.events.push(event);
    return eventName; // Return event name for ending
  }

  endEvent(eventName: string) {
    const event = this.events.find(e => e.name === eventName && !e.endTime);
    if (event) {
      event.endTime = Date.now();
      event.duration = event.endTime - event.startTime;
      
      // Log to analytics
      this.logCustomEvent(event);
    }
  }

  // Memory warning handler
  handleMemoryWarning() {
    console.warn('Memory warning received');
    
    // Clear old metrics
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }
    
    // Clear old events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const recentMetrics = this.metrics.slice(-10);
    const recentEvents = this.events.slice(-20);

    const avgMemoryUsage = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length 
      : 0;

    const avgBatteryLevel = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.batteryLevel, 0) / recentMetrics.length 
      : 0;

    const avgScreenLoadTime = recentEvents
      .filter(e => e.name.startsWith('screen_load_'))
      .reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(1, recentEvents.filter(e => e.name.startsWith('screen_load_')).length);

    return {
      avgMemoryUsage,
      avgBatteryLevel,
      avgScreenLoadTime,
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
    };
  }

  private logPerformanceMetrics(metrics: PerformanceMetrics) {
    try {
      const AnalyticsService = (global as any).AnalyticsService;
      if (AnalyticsService?.logCustomEvent) {
        AnalyticsService.logCustomEvent('performance_metrics', {
          memory_usage: metrics.memoryUsage,
          cpu_usage: metrics.cpuUsage,
          battery_level: metrics.batteryLevel,
          timestamp: metrics.timestamp,
        });
      }
    } catch (error) {
      console.warn('Failed to log performance metrics:', error);
    }
  }

  private logScreenLoadTime(screenName: string, duration: number) {
    try {
      const AnalyticsService = (global as any).AnalyticsService;
      if (AnalyticsService?.logCustomEvent) {
        AnalyticsService.logCustomEvent('screen_load_time', {
          screen_name: screenName,
          duration_ms: duration,
        });
      }
    } catch (error) {
      console.warn('Failed to log screen load time:', error);
    }
  }

  private logCustomEvent(event: PerformanceEvent) {
    try {
      const AnalyticsService = (global as any).AnalyticsService;
      if (AnalyticsService?.logCustomEvent && event.duration) {
        AnalyticsService.logCustomEvent('custom_performance_event', {
          event_name: event.name,
          duration_ms: event.duration,
          metadata: event.metadata,
        });
      }
    } catch (error) {
      console.warn('Failed to log custom event:', error);
    }
  }

  cleanup() {
    this.isMonitoring = false;
    this.metrics = [];
    this.events = [];
    this.screenStartTimes.clear();
  }
}

export const PerformanceService = new PerformanceServiceClass(); 