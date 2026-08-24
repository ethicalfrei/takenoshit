/** Allow kevinfrei.com to iframe the deployed game. */
export default async function frameAncestors(
  _event: unknown,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  headers.delete("X-Frame-Options");
  headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://kevinfrei.com https://www.kevinfrei.com https://*.vercel.app",
  );
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
