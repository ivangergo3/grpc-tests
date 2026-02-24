import { PaymentServiceApi } from "@services/payment";
import { ShippingServiceApi } from "@services/shipping";
import { UserServiceApi } from "@services/user";
import { logger, type Logger } from "@utils/logger";

export type services_fixture = {
  user: UserServiceApi;
  payment: PaymentServiceApi;
  shipping: ShippingServiceApi;
  log: Logger;
};

export const TEST_SERVER_ADDRESS = "127.0.0.1:50051";

export const getTestServerAddress = (): string => {
  const v = process.env.TEST_SERVER_BASE_URL?.trim();
  if (!v) throw new Error("Missing required env var: TEST_SERVER_BASE_URL");
  return v;
};

/**
 * Create service clients pointing at the external `test-server` process.
 * The server is expected to be started manually in a separate terminal.
 */
export const createLocalServices = (target: string = getTestServerAddress()): services_fixture => {
  const log = logger.child("local");
  return {
    // Pass `undefined` creds: BaseGrpcService defaults to createInsecure().
    user: new UserServiceApi(target, undefined),
    payment: new PaymentServiceApi(target, undefined),
    shipping: new ShippingServiceApi(target, undefined),
    log,
  };
};
