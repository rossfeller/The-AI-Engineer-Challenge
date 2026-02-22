/**
 * Fetches the backend API base URL.
 * Uses NEXT_PUBLIC_API_URL when set (e.g. on Vercel), otherwise defaults to local backend.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export interface ChatResponse {
  reply: string;
}

/**
 * Sends a message to the mental coach chat endpoint.
 * @param message - User message
 * @returns The coach's reply
 * @throws Error on non-OK response with server detail when available
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : res.statusText;
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (typeof data.reply !== "string") {
    throw new Error("Invalid response: missing reply");
  }

  return { reply: data.reply };
}

/**
 * Checks backend health (root endpoint).
 */
export async function checkHealth(): Promise<{ status: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Health check failed");
  }
  return data;
}

/** SSE event payload: either { content } or { error } */
type StreamEvent = { content?: string; error?: string };

/**
 * Streams the mental coach reply from the backend, calling onToken for each chunk.
 * Resolves with the full reply when the stream ends; rejects on network/server error or if an error event is sent.
 */
export async function streamChatMessage(
  message: string,
  onToken: (text: string) => void
): Promise<string> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = typeof data.detail === "string" ? data.detail : res.statusText;
    throw new Error(detail || `Request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const data = JSON.parse(raw) as StreamEvent;
            if (data.error) throw new Error(data.error);
            if (typeof data.content === "string") {
              fullReply += data.content;
              onToken(data.content);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullReply;
}
