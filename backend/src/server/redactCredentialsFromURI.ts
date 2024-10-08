/**
 * Redacts the username and password from a URI.
 * @param uri The URI to redact.
 * @returns The redacted URI.
 */
export function redactCredentialsFromURI(uri: string) {
  // Regular expression pattern to match username and password
  const pattern = /\/\/[^@]+@/;

  // Replace the matched username and password with asterisks
  return uri.replace(pattern, "//*:*@");
}
