export const TEMPORARY_ADMIN_USERNAME = "admin";
export const TEMPORARY_ADMIN_PASSWORD = "admin";

/** Validação local temporária, destinada apenas à fase inicial de testes. */
export function hasTemporaryAdminAccess(username: string, password: string) {
  return username.trim().toLowerCase() === TEMPORARY_ADMIN_USERNAME && password === TEMPORARY_ADMIN_PASSWORD;
}
