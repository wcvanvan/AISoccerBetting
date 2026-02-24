/**
 * Tests for Alert types and AlertCollector
 */

import { AlertCollector, AlertSeverity } from '../alerts';

describe('AlertCollector', () => {
  let collector: AlertCollector;

  beforeEach(() => {
    collector = new AlertCollector();
  });

  describe('add', () => {
    it('should add an alert', () => {
      collector.add(AlertSeverity.WARNING, 'TestComponent', 'Test message');
      
      expect(collector.hasAlerts()).toBe(true);
      expect(collector.getAlerts()).toHaveLength(1);
      
      const alerts = collector.getAlerts();
      expect(alerts[0].severity).toBe(AlertSeverity.WARNING);
      expect(alerts[0].component).toBe('TestComponent');
      expect(alerts[0].message).toBe('Test message');
    });

    it('should add alert with context', () => {
      collector.add(
        AlertSeverity.ERROR,
        'TestComponent',
        'Test error',
        { teamId: '123', matchId: '456' }
      );
      
      const alerts = collector.getAlerts();
      expect(alerts[0].context).toEqual({ teamId: '123', matchId: '456' });
    });
  });

  describe('convenience methods', () => {
    it('should add info alert', () => {
      collector.info('TestComponent', 'Info message');
      
      const alerts = collector.getAlerts();
      expect(alerts[0].severity).toBe(AlertSeverity.INFO);
    });

    it('should add warning alert', () => {
      collector.warning('TestComponent', 'Warning message');
      
      const alerts = collector.getAlerts();
      expect(alerts[0].severity).toBe(AlertSeverity.WARNING);
    });

    it('should add error alert', () => {
      collector.error('TestComponent', 'Error message');
      
      const alerts = collector.getAlerts();
      expect(alerts[0].severity).toBe(AlertSeverity.ERROR);
    });
  });

  describe('getMessages', () => {
    it('should format alert messages', () => {
      collector.info('Component1', 'Info message');
      collector.warning('Component2', 'Warning message');
      collector.error('Component3', 'Error message');
      
      const messages = collector.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages[0]).toBe('[INFO] Component1: Info message');
      expect(messages[1]).toBe('[WARNING] Component2: Warning message');
      expect(messages[2]).toBe('[ERROR] Component3: Error message');
    });
  });

  describe('clear', () => {
    it('should clear all alerts', () => {
      collector.info('TestComponent', 'Test message');
      expect(collector.hasAlerts()).toBe(true);
      
      collector.clear();
      expect(collector.hasAlerts()).toBe(false);
      expect(collector.getAlerts()).toHaveLength(0);
    });
  });

  describe('getCountBySeverity', () => {
    it('should count alerts by severity', () => {
      collector.info('Component1', 'Info 1');
      collector.info('Component2', 'Info 2');
      collector.warning('Component3', 'Warning 1');
      collector.error('Component4', 'Error 1');
      
      expect(collector.getCountBySeverity(AlertSeverity.INFO)).toBe(2);
      expect(collector.getCountBySeverity(AlertSeverity.WARNING)).toBe(1);
      expect(collector.getCountBySeverity(AlertSeverity.ERROR)).toBe(1);
    });
  });

  describe('hasAlerts', () => {
    it('should return false when no alerts', () => {
      expect(collector.hasAlerts()).toBe(false);
    });

    it('should return true when alerts exist', () => {
      collector.info('TestComponent', 'Test message');
      expect(collector.hasAlerts()).toBe(true);
    });
  });

  describe('getAlerts', () => {
    it('should return a copy of alerts array', () => {
      collector.info('TestComponent', 'Test message');
      
      const alerts1 = collector.getAlerts();
      const alerts2 = collector.getAlerts();
      
      // Should be different array instances
      expect(alerts1).not.toBe(alerts2);
      // But with same content
      expect(alerts1).toEqual(alerts2);
    });
  });
});
