import * as grpc from "@grpc/grpc-js";
import { createChannelCredentialsFromEnv, type grpc_tls_env } from "@utils/grpc/credentials";
import { AuditServiceApi } from "@services/audit/auditService";
import { InventoryServiceApi } from "@services/inventory/inventoryService";
import { NotificationServiceApi } from "@services/notification/notificationService";
import { OrderServiceApi } from "@services/order/orderService";
import { PaymentServiceApi } from "@services/payment/paymentService";
import { ShippingServiceApi } from "@services/shipping/shippingService";
import { UserServiceApi } from "@services/user/userService";
import { getEnvironment } from "@utils/environments";
import { logger, type Logger } from "@utils/logger";

export type services_fixture = {
  user: UserServiceApi;
  order: OrderServiceApi;
  inventory: InventoryServiceApi;
  payment: PaymentServiceApi;
  shipping: ShippingServiceApi;
  notification: NotificationServiceApi;
  audit: AuditServiceApi;
  log: Logger;
};

// For deployed clusters (multi-service ready):
// - Configure in src/utils/environments.ts
// - Select via TEST_ENV=local|dev
export const createRemoteServicesFromEnv = (): services_fixture => {
  const env = getEnvironment();
  const log = logger.child(`remote:${env.name}`);

  const requireTarget = (
    name: string,
    cfg: { target?: string; insecure?: boolean } & Partial<grpc_tls_env>
  ) => {
    if (!cfg.target)
      throw new Error(`Missing ${name}.target in environments.ts for env=${env.name}`);
    return {
      target: cfg.target,
      insecure: Boolean(cfg.insecure),
      caCertPath: cfg.caCertPath,
      clientCertPath: cfg.clientCertPath,
      clientKeyPath: cfg.clientKeyPath
    } satisfies grpc_tls_env;
  };

  const userEnv = requireTarget("services.user", env.services.user);
  const orderEnv = requireTarget("services.order", env.services.order);
  const inventoryEnv = requireTarget("services.inventory", env.services.inventory);
  const paymentEnv = requireTarget("services.payment", env.services.payment);
  const shippingEnv = requireTarget("services.shipping", env.services.shipping);
  const notificationEnv = requireTarget("services.notification", env.services.notification);
  const auditEnv = requireTarget("services.audit", env.services.audit);

  const userCreds = createChannelCredentialsFromEnv(userEnv);
  const orderCreds = createChannelCredentialsFromEnv(orderEnv);
  const inventoryCreds = createChannelCredentialsFromEnv(inventoryEnv);
  const paymentCreds = createChannelCredentialsFromEnv(paymentEnv);
  const shippingCreds = createChannelCredentialsFromEnv(shippingEnv);
  const notificationCreds = createChannelCredentialsFromEnv(notificationEnv);
  const auditCreds = createChannelCredentialsFromEnv(auditEnv);

  return {
    user: new UserServiceApi(userEnv.target, userCreds),
    order: new OrderServiceApi(orderEnv.target, orderCreds),
    inventory: new InventoryServiceApi(inventoryEnv.target, inventoryCreds),
    payment: new PaymentServiceApi(paymentEnv.target, paymentCreds),
    shipping: new ShippingServiceApi(shippingEnv.target, shippingCreds),
    notification: new NotificationServiceApi(notificationEnv.target, notificationCreds),
    audit: new AuditServiceApi(auditEnv.target, auditCreds),
    log
  };
};

// For local tests where you already have host:port strings:
export const createLocalServices = (targets: {
  user: string;
  order: string;
  inventory: string;
  payment: string;
  shipping: string;
  notification: string;
  audit: string;
}): services_fixture => {
  const creds = grpc.credentials.createInsecure();
  const log = logger.child("local");
  return {
    user: new UserServiceApi(targets.user, creds),
    order: new OrderServiceApi(targets.order, creds),
    inventory: new InventoryServiceApi(targets.inventory, creds),
    payment: new PaymentServiceApi(targets.payment, creds),
    shipping: new ShippingServiceApi(targets.shipping, creds),
    notification: new NotificationServiceApi(targets.notification, creds),
    audit: new AuditServiceApi(targets.audit, creds),
    log
  };
};
