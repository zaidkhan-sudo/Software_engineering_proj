const { VALID_TRANSITIONS, STATUSES } = require('../utils/constants');
const { generateTrackingId } = require('../services/trackingIdService');
const Counter = require('../models/Counter');

function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

describe('Unit Tests: State Machine Transitions and Tracking ID Service', () => {
  describe('canTransition (Grievance State Machine)', () => {
    test('Allowed transitions return true', () => {
      expect(canTransition(STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW)).toBe(true);
      expect(canTransition(STATUSES.UNDER_REVIEW, STATUSES.IN_PROGRESS)).toBe(true);
      expect(canTransition(STATUSES.IN_PROGRESS, STATUSES.RESOLVED)).toBe(true);
      expect(canTransition(STATUSES.IN_PROGRESS, STATUSES.REJECTED)).toBe(true);
      expect(canTransition(STATUSES.RESOLVED, STATUSES.REOPENED)).toBe(true);
      expect(canTransition(STATUSES.REJECTED, STATUSES.REOPENED)).toBe(true);
      expect(canTransition(STATUSES.REOPENED, STATUSES.UNDER_REVIEW)).toBe(true);
    });

    test('Disallowed transitions return false', () => {
      // Direct jump from SUBMITTED to RESOLVED or REJECTED
      expect(canTransition(STATUSES.SUBMITTED, STATUSES.RESOLVED)).toBe(false);
      expect(canTransition(STATUSES.SUBMITTED, STATUSES.REJECTED)).toBe(false);
      expect(canTransition(STATUSES.SUBMITTED, STATUSES.IN_PROGRESS)).toBe(false);

      // Jumping from UNDER_REVIEW directly to RESOLVED
      expect(canTransition(STATUSES.UNDER_REVIEW, STATUSES.RESOLVED)).toBe(false);

      // Backwards transitions
      expect(canTransition(STATUSES.RESOLVED, STATUSES.IN_PROGRESS)).toBe(false);
      expect(canTransition(STATUSES.REJECTED, STATUSES.IN_PROGRESS)).toBe(false);
      expect(canTransition(STATUSES.IN_PROGRESS, STATUSES.SUBMITTED)).toBe(false);

      // Unknown statuses
      expect(canTransition('INVALID_STATUS', STATUSES.SUBMITTED)).toBe(false);
      expect(canTransition(STATUSES.SUBMITTED, 'UNKNOWN_STATUS')).toBe(false);
    });
  });

  describe('generateTrackingId Service', () => {
    test('Generates sequential tracking IDs matching GRV-YYYY-XXXXXX format', async () => {
      const year = new Date().getFullYear();

      const id1 = await generateTrackingId();
      expect(id1).toBe(`GRV-${year}-000001`);

      const id2 = await generateTrackingId();
      expect(id2).toBe(`GRV-${year}-000002`);

      const id3 = await generateTrackingId();
      expect(id3).toBe(`GRV-${year}-000003`);
    });
  });
});
