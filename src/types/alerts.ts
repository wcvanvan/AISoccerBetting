/**
 * Alert types for tracking missing data and errors
 */

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Alert for missing or unavailable data
 */
export interface Alert {
  severity: AlertSeverity;
  component: string; // Which component generated the alert
  message: string;
  context?: Record<string, any>; // Additional context (team ID, match ID, etc.)
}

/**
 * Alert collector for tracking missing data and errors
 */
export class AlertCollector {
  private alerts: Alert[] = [];

  /**
   * Add an alert
   */
  add(severity: AlertSeverity, component: string, message: string, context?: Record<string, any>): void {
    this.alerts.push({
      severity,
      component,
      message,
      context,
    });
  }

  /**
   * Add an info alert
   */
  info(component: string, message: string, context?: Record<string, any>): void {
    this.add(AlertSeverity.INFO, component, message, context);
  }

  /**
   * Add a warning alert
   */
  warning(component: string, message: string, context?: Record<string, any>): void {
    this.add(AlertSeverity.WARNING, component, message, context);
  }

  /**
   * Add an error alert
   */
  error(component: string, message: string, context?: Record<string, any>): void {
    this.add(AlertSeverity.ERROR, component, message, context);
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get formatted alert messages
   */
  getMessages(): string[] {
    return this.alerts.map(alert => {
      const prefix = `[${alert.severity}] ${alert.component}:`;
      return `${prefix} ${alert.message}`;
    });
  }

  /**
   * Clear all alerts
   */
  clear(): void {
    this.alerts = [];
  }

  /**
   * Check if there are any alerts
   */
  hasAlerts(): boolean {
    return this.alerts.length > 0;
  }

  /**
   * Get count of alerts by severity
   */
  getCountBySeverity(severity: AlertSeverity): number {
    return this.alerts.filter(a => a.severity === severity).length;
  }
}
