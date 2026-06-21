import { AggregateRoot } from "@supa-admin/ddd";
import type { BootstrapStatus } from "@supa-admin/projections";
import { ConnectionsFeatureError } from "../errors";

export class Connection extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly name: string,
    readonly url: string,
    readonly bootstrapStatus: BootstrapStatus,
  ) {
    super(id);
    if (!name.trim()) {
      throw ConnectionsFeatureError.invalidState(id, "Name cannot be empty");
    }
    if (!url.trim()) {
      throw ConnectionsFeatureError.invalidState(id, "URL cannot be empty");
    }
  }

  static normalizeUrl(url: string): string {
    const trimmed = url.trim().replace(/\/$/, "");
    if (!trimmed) {
      throw ConnectionsFeatureError.invalidState("new", "URL cannot be empty");
    }
    return trimmed;
  }
}
