export async function readJsonResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return { error: response.ok ? undefined : response.statusText || "Request failed." } as T;
}
