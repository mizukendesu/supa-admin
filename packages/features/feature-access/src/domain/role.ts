import { AggregateRoot } from "@supa-admin/ddd";
import { AccessFeatureError } from "../errors";

export class Role extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly name: string,
    readonly description: string | null,
  ) {
    super(id);
    if (!name.trim()) {
      throw AccessFeatureError.invalidState(id, "Role name cannot be empty");
    }
  }

  static validateCreateInput(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw AccessFeatureError.invalidState("new", "Role name cannot be empty");
    }
    return trimmed;
  }
}
