import type * as grpc from "@grpc/grpc-js";

import type {
  SendEmailRequest,
  SendEmailResponse,
  SendSmsRequest,
  SendSmsResponse
} from "@gen/acme/notification/v1/notification_service";
import { NotificationServiceClient } from "@gen/acme/notification/v1/notification_service";
import { BaseGrpcService, type unary_call_options } from "@services/base";

export class NotificationServiceApi extends BaseGrpcService<NotificationServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(NotificationServiceClient, target, creds, options);
  }

  sendEmail(req: SendEmailRequest, opts: unary_call_options = {}): Promise<SendEmailResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<SendEmailRequest, SendEmailResponse>(
      {
        rpc: "NotificationService.SendEmail",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.sendEmail(req, metadata, callOpts, cb);
        return this.client.sendEmail(req, metadata, cb);
      }
    );
  }

  sendSms(req: SendSmsRequest, opts: unary_call_options = {}): Promise<SendSmsResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<SendSmsRequest, SendSmsResponse>(
      {
        rpc: "NotificationService.SendSms",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.sendSms(req, metadata, callOpts, cb);
        return this.client.sendSms(req, metadata, cb);
      }
    );
  }
}
