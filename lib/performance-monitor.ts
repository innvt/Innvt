/**
 * Performance Monitoring System
 * 
 * Tracks FPS, memory usage, and automatically adjusts quality
 * if performance drops below target thresholds.
 */

import { getQualitySettings, setQualityTier, QualityTier } from './gpu-detection';

interface PerformanceMetrics {
  fps: number;
  avgFPS: number;
  minFPS: number;
  maxFPS: number;
  frameTime: number;
  memoryUsage?: number;
  drawCalls?: number;
}

class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private readonly historySize = 60; // Track last 60 frames (1 second at 60fps)
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private currentFPS = 60;
  private isMonitoring = false;
  private qualityAdjustmentCooldown = 0;
  private readonly cooldownDuration = 5000; // 5 seconds between adjustments

  // Performance thresholds
  private readonly targetFPS = 30; // Minimum acceptable FPS
  private readonly criticalFPS = 15; // Critical threshold
  private readonly checkInterval = 60; // Check every 60 frames

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.fpsHistory = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance monitoring started');
    }
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    this.isMonitoring = false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance monitoring stopped');
    }
  }

  /**
   * Update performance metrics (call this in render loop)
   */
  update(_deltaTime: number): PerformanceMetrics {
    if (!this.isMonitoring) {
      return this.getMetrics();
    }

    // Calculate FPS
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    const fps = frameTime > 0 ? 1000 / frameTime : 60;
    this.currentFPS = fps;

    // Add to history
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift();
    }

    this.frameCount++;

    // Check if we need to adjust quality
    if (this.frameCount % this.checkInterval === 0) {
      this.checkPerformance();
    }

    return this.getMetrics();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 60;

    const minFPS = this.fpsHistory.length > 0
      ? Math.min(...this.fpsHistory)
      : 60;

    const maxFPS = this.fpsHistory.length > 0
      ? Math.max(...this.fpsHistory)
      : 60;

    const frameTime = this.currentFPS > 0 ? 1000 / this.currentFPS : 16.67;

    // Get memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance && (performance as { memory?: { usedJSHeapSize: number } }).memory) {
      const memory = (performance as { memory: { usedJSHeapSize: number } }).memory;
      memoryUsage = memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    return {
      fps: this.currentFPS,
      avgFPS,
      minFPS,
      maxFPS,
      frameTime,
      memoryUsage,
    };
  }

  /**
   * Check performance and adjust quality if needed
   */
  private checkPerformance(): void {
    // Don't adjust if we're in cooldown
    const now = performance.now();
    if (now - this.qualityAdjustmentCooldown < this.cooldownDuration) {
      return;
    }

    const metrics = this.getMetrics();
    const currentSettings = getQualitySettings();

    // Critical performance issue - drop to lower tier
    if (metrics.avgFPS < this.criticalFPS && currentSettings.tier > 0) {
      const newTier = Math.max(0, currentSettings.tier - 1) as QualityTier;
      this.adjustQuality(newTier, 'critical');
      return;
    }

    // Below target FPS - consider reducing quality
    if (metrics.avgFPS < this.targetFPS && currentSettings.tier > 0) {
      const newTier = Math.max(0, currentSettings.tier - 1) as QualityTier;
      this.adjustQuality(newTier, 'low');
      return;
    }

    // Performance is good - could potentially increase quality
    // (but we'll be conservative and not auto-increase)
  }

  /**
   * Adjust quality tier
   */
  private adjustQuality(newTier: QualityTier, reason: 'critical' | 'low'): void {
    const currentSettings = getQualitySettings();
    
    if (newTier === currentSettings.tier) return;

    setQualityTier(newTier);
    this.qualityAdjustmentCooldown = performance.now();

    const reasonText = reason === 'critical' 
      ? 'Critical performance issue detected'
      : 'Performance below target';

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ ${reasonText}. Reducing quality from Tier ${currentSettings.tier} to Tier ${newTier}`
      );
    }

    // Dispatch custom event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('quality-adjusted', {
          detail: {
            oldTier: currentSettings.tier,
            newTier,
            reason,
            metrics: this.getMetrics(),
          },
        })
      );
    }
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const metrics = this.getMetrics();
    const settings = getQualitySettings();

    console.log('📊 Performance Summary:', {
      currentFPS: metrics.fps.toFixed(1),
      avgFPS: metrics.avgFPS.toFixed(1),
      minFPS: metrics.minFPS.toFixed(1),
      maxFPS: metrics.maxFPS.toFixed(1),
      frameTime: metrics.frameTime.toFixed(2) + 'ms',
      memoryUsage: metrics.memoryUsage ? metrics.memoryUsage.toFixed(2) + 'MB' : 'N/A',
      qualityTier: settings.tier,
    });
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();


