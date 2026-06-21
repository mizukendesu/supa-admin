import { CustomError, type CustomErrorOptions } from "./custom-error";

/**
 * Feature ごとのドメインエラー基底クラスを生成する。
 *
 * @example
 * ```ts
 * export const ItemFeatureError = defineDomainError("Item", "item-feature");
 *
 * // 拡張する場合
 * class _ItemBase extends defineDomainError("Item", "item-feature") {}
 * export class ItemNotFoundError extends _ItemBase {}
 * ```
 */
export function defineDomainError<TLabel extends string>(
  label: TLabel,
  packageName: string,
) {
  class DomainError extends CustomError {
    static readonly label = label;
    static readonly packageName = packageName;

    constructor(message: string, options: CustomErrorOptions = {}) {
      super(message, {
        ...options,
        code: options.code ?? `${packageName}/${label}`,
      });
    }

    static notFound(this: typeof DomainError, id: string) {
      return new this(`${label} not found: ${id}`, {
        code: `${packageName}/not-found`,
        metadata: { id },
      });
    }

    static versionMismatch(
      this: typeof DomainError,
      id: string,
      expected: number,
      actual: number,
    ) {
      return new this(`${label} version mismatch: ${id}`, {
        code: `${packageName}/version-mismatch`,
        metadata: { id, expected, actual },
      });
    }

    static alreadyDeleted(this: typeof DomainError, id: string) {
      return new this(`${label} already deleted: ${id}`, {
        code: `${packageName}/already-deleted`,
        metadata: { id },
      });
    }

    static notDeleted(this: typeof DomainError, id: string) {
      return new this(`${label} not deleted: ${id}`, {
        code: `${packageName}/not-deleted`,
        metadata: { id },
      });
    }

    static insertFailed(this: typeof DomainError) {
      return new this(`${label} insert failed`, {
        code: `${packageName}/insert-failed`,
      });
    }

    static invalidState(this: typeof DomainError, id: string, reason: string) {
      return new this(`${label} invalid state: ${reason}`, {
        code: `${packageName}/invalid-state`,
        metadata: { id, reason },
      });
    }
  }

  return DomainError;
}

/** `defineDomainError(...)` の戻り値型。`extends` する側で参照するためのエイリアス。 */
export type DomainErrorClass = ReturnType<typeof defineDomainError>;
