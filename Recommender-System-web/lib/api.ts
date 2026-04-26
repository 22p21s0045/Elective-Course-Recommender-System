const BASE_URL = "http://127.0.0.1:8000/" // 🔥 change to your backend

type FetchOptions = RequestInit & {
  params?: Record<string, string>
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options

  // Handle query params
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : ""

  const res = await fetch(`${BASE_URL}${endpoint}${queryString}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "API Error")
  }

  return res.json()
}