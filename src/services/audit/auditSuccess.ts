import type {
  ListAuditEventsResponse,
  WriteAuditEventResponse
} from "@gen/acme/audit/v1/audit_service";
import { asResponses, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyWriteAuditEventSuccessOptions = {
  expectedRequestId?: string;
  expectedStatus?: string;
  expectedEventId?: string;
};

export const verifyWriteAuditEventSuccess = (
  res: SuccessOneOrMany<WriteAuditEventResponse>,
  options?: VerifyWriteAuditEventSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedStatus !== undefined) {
      expect(r.status).toBe(options.expectedStatus);
    }
    if (options?.expectedEventId !== undefined) {
      expect(r.eventId).toBe(options.expectedEventId);
    }
  });
};

export type VerifyListAuditEventsSuccessOptions = {
  expectedRequestId?: string;
  expectedMinCount?: number;
  expectedCount?: number;
};

export const verifyListAuditEventsSuccess = (
  res: SuccessOneOrMany<ListAuditEventsResponse>,
  options?: VerifyListAuditEventsSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedMinCount !== undefined) {
      expect(r.events.length).toBeGreaterThanOrEqual(options.expectedMinCount);
    }
    if (options?.expectedCount !== undefined) {
      expect(r.events.length).toBe(options.expectedCount);
    }
  });
};
