import type { services_fixture } from "@utils/fixtures";
import { createLocalServices } from "@utils/fixtures";

import {
  startAuditServiceServer,
  startInventoryServiceServer,
  startNotificationServiceServer,
  startOrderServiceServerStandalone,
  startPaymentServiceServer,
  startShippingServiceServer,
  startUserOrderStack,
  startUserServiceServer,
  type started_server
} from "./servers";

export type started_services_fixture = {
  api: services_fixture;
  stop: () => Promise<void>;
  targets: {
    user: string;
    order: string;
    inventory: string;
    payment: string;
    shipping: string;
    notification: string;
    audit: string;
  };
};

const stopAll = async (servers: started_server[]) => {
  // Stop in reverse order (roughly "last started, first stopped").
  await Promise.all([...servers].reverse().map((s) => s.stop()));
};

export const startLocalStandaloneServices = async (): Promise<started_services_fixture> => {
  const user = await startUserServiceServer();
  const order = await startOrderServiceServerStandalone();
  const inventory = await startInventoryServiceServer();
  const payment = await startPaymentServiceServer();
  const shipping = await startShippingServiceServer();
  const notification = await startNotificationServiceServer();
  const audit = await startAuditServiceServer();

  const targets = {
    user: user.address,
    order: order.address,
    inventory: inventory.address,
    payment: payment.address,
    shipping: shipping.address,
    notification: notification.address,
    audit: audit.address
  };

  return {
    api: createLocalServices(targets),
    targets,
    stop: () => stopAll([user, order, inventory, payment, shipping, notification, audit])
  };
};

/**
 * Local multi-service wiring example:
 * - OrderService will call UserService internally (service-to-service call).
 */
export const startLocalUserOrderStackServices = async (): Promise<started_services_fixture> => {
  const stack = await startUserOrderStack();
  const inventory = await startInventoryServiceServer();
  const payment = await startPaymentServiceServer();
  const shipping = await startShippingServiceServer();
  const notification = await startNotificationServiceServer();
  const audit = await startAuditServiceServer();

  const targets = {
    user: stack.user.address,
    order: stack.order.address,
    inventory: inventory.address,
    payment: payment.address,
    shipping: shipping.address,
    notification: notification.address,
    audit: audit.address
  };

  return {
    api: createLocalServices(targets),
    targets,
    stop: () =>
      stopAll([stack.order, stack.user, inventory, payment, shipping, notification, audit])
  };
};
