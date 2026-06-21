import { describe, expect, it } from "vitest";
import { Connection } from "../src/domain/connection";
import { ConnectionsFeatureError } from "../src/errors";

describe("Connection", () => {
  it("when valid input, then creates aggregate", () => {
    const connection = new Connection(
      "conn-1",
      "Local Target",
      "http://127.0.0.1:54421",
      "pending",
    );
    expect(connection.name).toBe("Local Target");
  });

  it("when normalizeUrl called, then strips trailing slash", () => {
    expect(Connection.normalizeUrl("http://example.com/")).toBe(
      "http://example.com",
    );
  });

  it("when name is empty, then throws", () => {
    expect(
      () => new Connection("conn-1", "  ", "http://example.com", "pending"),
    ).toThrow(ConnectionsFeatureError);
  });
});
