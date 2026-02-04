import type {
  ListAuditEventsRequest,
  WriteAuditEventRequest,
  AuditEvent
} from "@gen/acme/audit/v1/audit_service";
import type { Pagination } from "@gen/acme/common/v1/common";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type WriteAuditEventParams = BaseRequestFields & {
  event?: AuditEvent;
};

export const buildWriteAuditEventRequest = (params: WriteAuditEventParams): WriteAuditEventRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    headers: params.headers
  });
  return {
    event: params.event,
    context: base.context,
    headers: base.headers ?? {}
  };
};

export type ListAuditEventsParams = BaseRequestFields & {
  entityType: string;
  entityId: string;
  type: string;
  page?: Pagination;
};

export const buildListAuditEventsRequest = (params: ListAuditEventsParams): ListAuditEventsRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    headers: params.headers
  });
  return {
    entityType: params.entityType,
    entityId: params.entityId,
    type: params.type,
    page: params.page,
    context: base.context,
    headers: base.headers ?? {}
  };
};
