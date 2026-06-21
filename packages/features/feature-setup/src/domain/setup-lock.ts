export class SetupLock {
  static isInProgress(value: unknown): boolean {
    return (
      typeof value === "object" &&
      value !== null &&
      "status" in value &&
      (value as { status: string }).status === "in_progress"
    );
  }

  static isComplete(value: unknown): boolean {
    if (value === true) return true;
    if (typeof value === "string") return value === "true";
    return false;
  }

  static canAcquireLock(value: unknown): boolean {
    return value === false;
  }
}
