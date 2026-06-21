import { AggregateRoot } from "@supa-admin/ddd";
import type { PlatformRole } from "@supa-admin/projections";
import { UsersFeatureError } from "../errors";

export class PlatformUser extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly email: string,
    readonly displayName: string | null,
    readonly role: PlatformRole,
  ) {
    super(id);
    if (!email.trim()) {
      throw UsersFeatureError.invalidState(id, "Email cannot be empty");
    }
  }

  static validateEmail(email: string): string {
    const trimmed = email.trim();
    if (!trimmed) {
      throw UsersFeatureError.invalidState("new", "Email cannot be empty");
    }
    return trimmed;
  }
}
