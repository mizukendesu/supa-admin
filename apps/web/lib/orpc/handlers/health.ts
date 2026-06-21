import "server-only";

import { os } from "../os";

export const healthHandlers = os.health.router({
  ping: os.health.ping.handler(async () => ({ ok: true as const })),
});
