import type * as grpc from "@grpc/grpc-js";

import type {
  SendEmailRequest,
  SendEmailResponse,
  SendSmsRequest,
  SendSmsResponse
} from "@gen/acme/notification/v1/notification_service";
import { NotificationServiceClient } from "@gen/acme/notification/v1/notification_service";
import { getExpectedResponseCountForRpc } from "@services/baseRequest";
import { BaseGrpcService, type unary_call_options } from "@services/baseService";
import {
  buildSendEmailRequest,
  buildSendSmsRequest,
  type SendEmailParams,
  type SendSmsParams
} from "./notificationRequest";
import { verifySendEmailSuccess, type VerifySendEmailSuccessOptions } from "./notificationSuccess";

export class NotificationServiceApi extends BaseGrpcService<NotificationServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(NotificationServiceClient, target, creds, options);
  }

  /**
   * Server-streaming: returns N responses (1–3) based on SYSTEM_B_ENABLED / SYSTEM_C_ENABLED.
   * Collects all streamed responses into an array so verifiers receive "one or many" (4.1).
   */
  sendEmailStream(req: SendEmailRequest, opts: unary_call_options = {}): Promise<SendEmailResponse[]> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- base class method from BaseGrpcService */
    const result: Promise<SendEmailResponse[]> = this.streamCallWithReport<
      SendEmailRequest,
      SendEmailResponse
    >(
      {
        rpc: "NotificationService.SendEmailStream",
        request: req,
        metadata,
        deadlineMs: opts.deadlineMs ?? this.defaultDeadlineMs()
      },
      opts,
      () => this.client.sendEmailStream(req, metadata, callOpts ?? {})
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
    return result;
  }

  sendEmail(req: SendEmailRequest, opts: unary_call_options = {}): Promise<SendEmailResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<SendEmailResponse> = this.unaryCallWithReport<
      SendEmailRequest,
      SendEmailResponse
    >(
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
    return result;
  }

  sendSms(req: SendSmsRequest, opts: unary_call_options = {}): Promise<SendSmsResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<SendSmsResponse> = this.unaryCallWithReport<
      SendSmsRequest,
      SendSmsResponse
    >(
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
    return result;
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  sendEmailWithParams(
    params: SendEmailParams,
    opts: unary_call_options = {}
  ): Promise<SendEmailResponse> {
    return this.sendEmail(buildSendEmailRequest(params), opts);
  }

  /** Build request from params, send stream, return array of responses (5.1 / 5.2). */
  sendEmailStreamWithParams(
    params: SendEmailParams,
    opts: unary_call_options = {}
  ): Promise<SendEmailResponse[]> {
    return this.sendEmailStream(buildSendEmailRequest(params), opts);
  }

  /**
   * Send + verify in one step (5.3). Sends SendEmailStream, runs verifySendEmailSuccess, returns responses.
   * Defaults expectedCount from getExpectedResponseCountForRpc when not provided.
   */
  async sendEmailStreamSendAndVerify(
    params: SendEmailParams,
    callOpts: unary_call_options = {},
    verifyOptions?: VerifySendEmailSuccessOptions
  ): Promise<SendEmailResponse[]> {
    const responses = await this.sendEmailStreamWithParams(params, callOpts);
    const options: VerifySendEmailSuccessOptions = {
      ...verifyOptions,
      expectedCount: verifyOptions?.expectedCount ?? getExpectedResponseCountForRpc("NotificationService.SendEmailStream")
    };
    verifySendEmailSuccess(responses, options);
    return responses;
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  sendSmsWithParams(
    params: SendSmsParams,
    opts: unary_call_options = {}
  ): Promise<SendSmsResponse> {
    return this.sendSms(buildSendSmsRequest(params), opts);
  }
}
