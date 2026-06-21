import "server-only";

export type {
  CreateAdminInput,
  CreateAdminResult,
} from "./application/create-admin";
export { createAdmin } from "./application/create-admin";
export { isSetupComplete } from "./application/is-setup-complete";
export { SetupLock } from "./domain/setup-lock";
export { SetupFeatureError } from "./errors";
