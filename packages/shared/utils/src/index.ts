import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { sanitizePostgrestFilter } from "./postgrest";
export {
  type ValidateTargetUrlOptions,
  validateTargetUrl,
} from "./validate-url";
