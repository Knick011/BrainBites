import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export class ProductionUtils {
  // Check if app is in production mode
  static isProduction(): boolean {
    return !__DEV__;
  }

  // Get app version for analytics
  static async getAppVersion(): Promise<string> {
    try {
      const version = await DeviceInfo.getVersion();
      const buildNumber = await DeviceInfo.getBuildNumber();
      return `${version} (${buildNumber})`;
    } catch {
      return '1.0.0';
    }
  }

  // Get device info for crash reporting
  static async getDeviceInfo() {
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        deviceModel: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await this.getAppVersion(),
        totalMemory: await DeviceInfo.getTotalMemory(),
        freeMemory: await DeviceInfo.getFreeDiskStorage(),
      };
    } catch (error) {
      console.warn('Failed to get device info:', error);
      return {
        platform: Platform.OS,
        version: Platform.Version,
        error: 'Failed to get device info',
      };
    }
  }

  // Optimize images for production
  static getOptimizedImageSize(width: number, height: number): { width: number; height: number } {
    const maxSize = 1024;
    const aspectRatio = width / height;
    
    if (width > height) {
      return {
        width: Math.min(width, maxSize),
        height: Math.min(width, maxSize) / aspectRatio,
      };
    } else {
      return {
        width: Math.min(height, maxSize) * aspectRatio,
        height: Math.min(height, maxSize),
      };
    }
  }

  // Check if device has low memory
  static async isLowMemoryDevice(): Promise<boolean> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const freeMemory = await DeviceInfo.getFreeDiskStorage();
      const memoryUsage = (totalMemory - freeMemory) / totalMemory;
      return memoryUsage > 0.8; // 80% memory usage threshold
    } catch {
      return false;
    }
  }

  // Get performance recommendations
  static async getPerformanceRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    try {
      const isLowMemory = await this.isLowMemoryDevice();
      if (isLowMemory) {
        recommendations.push('Consider closing other apps to improve performance');
      }

      const batteryLevel = await DeviceInfo.getBatteryLevel();
      if (batteryLevel < 0.2) {
        recommendations.push('Low battery - consider charging for optimal performance');
      }

      const freeStorage = await DeviceInfo.getFreeDiskStorage();
      const totalStorage = await DeviceInfo.getTotalDiskCapacity();
      const storageUsage = (totalStorage - freeStorage) / totalStorage;
      
      if (storageUsage > 0.9) {
        recommendations.push('Low storage space - consider clearing cache');
      }
    } catch (error) {
      console.warn('Failed to get performance recommendations:', error);
    }

    return recommendations;
  }

  // Log production errors
  static logProductionError(error: Error, context?: Record<string, any>) {
    if (this.isProduction()) {
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check if app should show maintenance mode
  static async shouldShowMaintenanceMode(): Promise<boolean> {
    // In a real app, you'd check with your backend
    // For now, return false
    return false;
  }

  // Get app configuration for current environment
  static getAppConfig() {
    return {
      isProduction: this.isProduction(),
      analyticsEnabled: this.isProduction(),
      crashReportingEnabled: this.isProduction(),
      debugMode: !this.isProduction(),
      maxCacheSize: this.isProduction() ? 50 * 1024 * 1024 : 100 * 1024 * 1024, // 50MB in prod, 100MB in dev
    };
  }
} 