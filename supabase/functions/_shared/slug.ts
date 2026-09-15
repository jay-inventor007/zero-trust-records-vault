// Generates the opaque identifier used in every URL and response, instead of
// the database's real primary key. Done in application code rather than as a
// SQL column default so it doesn't depend on which encode() formats a given
// Postgres version happens to support - this only needs the Web Crypto API,
// available in every Deno Edge Function regardless of the database version.
export function generateSlug(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
