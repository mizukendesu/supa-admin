import type { CustomError, CustomErrorOptions } from "./custom-error";
import type { DomainErrorClass } from "./domain-error";

type DomainErrorConstructor = DomainErrorClass & {
  readonly label: string;
  readonly packageName: string;
};

/**
 * 参照整合性違反用のエラーを親ドメインエラーから生成する。
 */
export function defineReferenceGuardError(
  errorClass: DomainErrorConstructor,
  referenceName: string,
): DomainErrorConstructor {
  class ReferenceGuardError extends (errorClass as typeof CustomError) {
    constructor(referencedId: string, options: CustomErrorOptions = {}) {
      super(`${referenceName} reference invalid: ${referencedId}`, {
        ...options,
        code: options.code ?? `${errorClass.packageName}/reference-guard`,
        metadata: {
          ...options.metadata,
          referenceName,
          referencedId,
        },
      });
    }
  }

  Object.defineProperty(ReferenceGuardError, "label", {
    value: errorClass.label,
  });
  Object.defineProperty(ReferenceGuardError, "packageName", {
    value: errorClass.packageName,
  });

  return ReferenceGuardError as DomainErrorConstructor;
}
