import type * as grpc from "@grpc/grpc-js";

import type {
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  WriteAuditEventRequest,
  WriteAuditEventResponse
} from "@gen/acme/audit/v1/audit_service";
import { AuditServiceClient } from "@gen/acme/audit/v1/audit_service";
import { BaseGrpcService, type unary_call_options } from "@services/base";

export class AuditServiceApi extends BaseGrpcService<AuditServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(AuditServiceClient, target, creds, options);
  }

  writeEvent(
    req: WriteAuditEventRequest,
    opts: unary_call_options = {}
  ): Promise<WriteAuditEventResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<WriteAuditEventRequest, WriteAuditEventResponse>(
      {
        rpc: "AuditService.WriteEvent",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.writeEvent(req, metadata, callOpts, cb);
        return this.client.writeEvent(req, metadata, cb);
      }
    );
  }

  listEvents(
    req: ListAuditEventsRequest,
    opts: unary_call_options = {}
  ): Promise<ListAuditEventsResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<ListAuditEventsRequest, ListAuditEventsResponse>(
      {
        rpc: "AuditService.ListEvents",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.listEvents(req, metadata, callOpts, cb);
        return this.client.listEvents(req, metadata, cb);
      }
    );
  }
}
