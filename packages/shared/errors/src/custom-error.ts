export type CustomErrorOptions = {
  code?: string;
  cause?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Domain / application 層向けの基底エラー。
 * `Error` の `name` / `message` に加え、機械可読な `code` と任意の `metadata` を持つ。
 */
export class CustomError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, options: CustomErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code ?? "UNKNOWN";
    this.metadata = options.metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
