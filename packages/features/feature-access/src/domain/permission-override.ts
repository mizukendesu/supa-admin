import { AggregateRoot } from "@supa-admin/ddd";
import type { PermissionOverrideRow } from "@supa-admin/projections";

export class PermissionOverride extends AggregateRoot<string> {
  constructor(
    id: string,
    readonly userId: string,
    readonly connectionId: string,
    readonly tableName: string,
    readonly row: PermissionOverrideRow,
  ) {
    super(id);
  }
}
