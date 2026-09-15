import { describe, it, expect, beforeEach } from 'vitest';
import { DealStatus } from '@prisma/client';
import { DealStatusService } from './deal-status.service.js';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception.js';

describe('DealStatusService', () => {
  let service: DealStatusService;

  beforeEach(() => {
    service = new DealStatusService();
  });

  describe('Linear progression transitions', () => {
    it('should allow LEAD -> NEGOTIATING', () => {
      expect(service.isValidTransition(DealStatus.LEAD, DealStatus.NEGOTIATING)).toBe(true);
      expect(() => service.validateTransition(DealStatus.LEAD, DealStatus.NEGOTIATING)).not.toThrow();
    });

    it('should allow NEGOTIATING -> CONTRACT_SENT', () => {
      expect(service.isValidTransition(DealStatus.NEGOTIATING, DealStatus.CONTRACT_SENT)).toBe(true);
      expect(() => service.validateTransition(DealStatus.NEGOTIATING, DealStatus.CONTRACT_SENT)).not.toThrow();
    });

    it('should allow CONTRACT_SENT -> IN_PROGRESS', () => {
      expect(service.isValidTransition(DealStatus.CONTRACT_SENT, DealStatus.IN_PROGRESS)).toBe(true);
      expect(() => service.validateTransition(DealStatus.CONTRACT_SENT, DealStatus.IN_PROGRESS)).not.toThrow();
    });

    it('should allow IN_PROGRESS -> DELIVERED', () => {
      expect(service.isValidTransition(DealStatus.IN_PROGRESS, DealStatus.DELIVERED)).toBe(true);
      expect(() => service.validateTransition(DealStatus.IN_PROGRESS, DealStatus.DELIVERED)).not.toThrow();
    });

    it('should allow DELIVERED -> INVOICED', () => {
      expect(service.isValidTransition(DealStatus.DELIVERED, DealStatus.INVOICED)).toBe(true);
      expect(() => service.validateTransition(DealStatus.DELIVERED, DealStatus.INVOICED)).not.toThrow();
    });

    it('should allow INVOICED -> PAID', () => {
      expect(service.isValidTransition(DealStatus.INVOICED, DealStatus.PAID)).toBe(true);
      expect(() => service.validateTransition(DealStatus.INVOICED, DealStatus.PAID)).not.toThrow();
    });
  });

  describe('Exit to LOST / CANCELLED from active states', () => {
    const activeStates = [
      DealStatus.LEAD,
      DealStatus.NEGOTIATING,
      DealStatus.CONTRACT_SENT,
      DealStatus.IN_PROGRESS,
      DealStatus.DELIVERED,
      DealStatus.INVOICED,
    ];

    activeStates.forEach((state) => {
      it(`should allow ${state} -> LOST`, () => {
        expect(service.isValidTransition(state, DealStatus.LOST)).toBe(true);
        expect(() => service.validateTransition(state, DealStatus.LOST)).not.toThrow();
      });

      it(`should allow ${state} -> CANCELLED`, () => {
        expect(service.isValidTransition(state, DealStatus.CANCELLED)).toBe(true);
        expect(() => service.validateTransition(state, DealStatus.CANCELLED)).not.toThrow();
      });
    });
  });

  describe('Terminal states', () => {
    it('should have no allowed transitions from PAID', () => {
      expect(service.getAllowedTransitions(DealStatus.PAID)).toEqual([]);
    });

    it('should reject any transition from PAID', () => {
      expect(service.isValidTransition(DealStatus.PAID, DealStatus.INVOICED)).toBe(false);
      expect(() => service.validateTransition(DealStatus.PAID, DealStatus.INVOICED)).toThrow(
        InvalidStatusTransitionException,
      );
      expect(service.isValidTransition(DealStatus.PAID, DealStatus.LEAD)).toBe(false);
    });
  });

  describe('Backward transitions', () => {
    it('should allow moving backward (e.g. NEGOTIATING -> LEAD)', () => {
      expect(service.isValidTransition(DealStatus.NEGOTIATING, DealStatus.LEAD)).toBe(true);
      expect(() => service.validateTransition(DealStatus.NEGOTIATING, DealStatus.LEAD)).not.toThrow();
    });

    it('should allow moving backward across multiple stages (e.g. DELIVERED -> LEAD)', () => {
      expect(service.isValidTransition(DealStatus.DELIVERED, DealStatus.LEAD)).toBe(true);
      expect(service.isValidTransition(DealStatus.DELIVERED, DealStatus.IN_PROGRESS)).toBe(true);
      expect(() => service.validateTransition(DealStatus.DELIVERED, DealStatus.IN_PROGRESS)).not.toThrow();
    });

    it('should allow moving backward from INVOICED to DELIVERED', () => {
      expect(service.isValidTransition(DealStatus.INVOICED, DealStatus.DELIVERED)).toBe(true);
      expect(() => service.validateTransition(DealStatus.INVOICED, DealStatus.DELIVERED)).not.toThrow();
    });
  });

  describe('Reopening from LOST / CANCELLED', () => {
    it('should allow reopening LOST deal back to active pipeline stages', () => {
      expect(service.isValidTransition(DealStatus.LOST, DealStatus.LEAD)).toBe(true);
      expect(service.isValidTransition(DealStatus.LOST, DealStatus.NEGOTIATING)).toBe(true);
      expect(() => service.validateTransition(DealStatus.LOST, DealStatus.LEAD)).not.toThrow();
    });

    it('should allow reopening CANCELLED deal back to active pipeline stages', () => {
      expect(service.isValidTransition(DealStatus.CANCELLED, DealStatus.LEAD)).toBe(true);
      expect(service.isValidTransition(DealStatus.CANCELLED, DealStatus.IN_PROGRESS)).toBe(true);
      expect(() => service.validateTransition(DealStatus.CANCELLED, DealStatus.LEAD)).not.toThrow();
    });

    it('should NOT allow reopening LOST or CANCELLED directly to PAID', () => {
      expect(service.isValidTransition(DealStatus.LOST, DealStatus.PAID)).toBe(false);
      expect(service.isValidTransition(DealStatus.CANCELLED, DealStatus.PAID)).toBe(false);
      expect(() => service.validateTransition(DealStatus.LOST, DealStatus.PAID)).toThrow(
        InvalidStatusTransitionException,
      );
    });
  });

  describe('Invalid transitions', () => {
    it('should reject forward stage skipping (e.g. LEAD -> PAID or LEAD -> IN_PROGRESS)', () => {
      expect(service.isValidTransition(DealStatus.LEAD, DealStatus.PAID)).toBe(false);
      expect(service.isValidTransition(DealStatus.LEAD, DealStatus.IN_PROGRESS)).toBe(false);
      expect(() => service.validateTransition(DealStatus.LEAD, DealStatus.PAID)).toThrow(
        InvalidStatusTransitionException,
      );
    });

    it('should allow same status transition without error', () => {
      expect(() => service.validateTransition(DealStatus.LEAD, DealStatus.LEAD)).not.toThrow();
    });
  });
});
