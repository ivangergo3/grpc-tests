import type { EmailAttachment, SendEmailRequest, SendSmsRequest } from "@gen/acme/notification/v1/notification_service";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type SendEmailParams = BaseRequestFields & {
  messageId: string;
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
};

/**
 * Builds SendEmailRequest. Used for both unary SendEmail and server-streaming SendEmailStream.
 * SendEmailStream is a multi-response RPC (tagged in baseRequest.MULTI_RESPONSE_RPCS); expected count from env.
 */
export const buildSendEmailRequest = (params: SendEmailParams): SendEmailRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    messageId: params.messageId,
    to: params.to,
    subject: params.subject,
    body: params.body,
    attachments: params.attachments ?? [],
    headers: base.headers ?? {},
    context: base.context,
    actor: base.actor
  };
};

export type SendSmsParams = BaseRequestFields & {
  messageId: string;
  to: string;
  text: string;
};

export const buildSendSmsRequest = (params: SendSmsParams): SendSmsRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    messageId: params.messageId,
    to: params.to,
    text: params.text,
    headers: base.headers ?? {},
    context: base.context,
    actor: base.actor
  };
};
