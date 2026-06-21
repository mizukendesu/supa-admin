import {
  accessHandlers,
  appHandlers,
  connectionsHandlers,
  connectionsRlsHandlers,
  dashboardHandlers,
  healthHandlers,
  provisionHandlers,
  rolesHandlers,
  setupHandlers,
  usersHandlers,
} from "./handlers";

export const router = {
  setup: setupHandlers,
  connections: connectionsHandlers,
  connectionsRls: connectionsRlsHandlers,
  roles: rolesHandlers,
  access: accessHandlers,
  users: usersHandlers,
  provision: provisionHandlers,
  app: appHandlers,
  dashboard: dashboardHandlers,
  health: healthHandlers,
};
