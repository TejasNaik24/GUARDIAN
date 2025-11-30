/**
 * Guardian AI Backend API Client
 * Connects Next.js frontend to FastAPI backend
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ChatRequest {
  message: string;
  conversation_id?: string;
}

interface ChatResponse {
  conversation_id: string;
  message: string;
  role: string;
  sources?: Array<{
    content: string;
    similarity: number;
  }>;
}

interface IngestResponse {
  status: string;
  filename?: string;
  chunks_ingested: number;
  document_ids: string[];
}

/**
 * Get auth headers with JWT token from Supabase session
 */
async function getAuthHeaders(token: string): Promise<HeadersInit> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Send chat message to Guardian AI backend
 */
export async function sendChatMessage(
  message: string,
  token: string,
  conversationId?: string
): Promise<ChatResponse> {
  const headers = await getAuthHeaders(token);

  console.log("🟢 [guardianApi] Sending chat message...");
  console.log("🟢 [guardianApi] Backend URL:", BACKEND_URL);
  console.log("🟢 [guardianApi] Endpoint:", `${BACKEND_URL}/api/chat`);
  console.log("🟢 [guardianApi] Message:", message);
  console.log("🟢 [guardianApi] Conversation ID:", conversationId);

  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    } as ChatRequest),
  });

  console.log("🟢 [guardianApi] Response status:", response.status);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    console.error("🔴 [guardianApi] Error response:", error);
    throw new Error(error.detail || `Chat request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("🟢 [guardianApi] Response data:", data);
  return data;
}

/**
 * Send chat message with streaming response (SSE)
 */
export async function sendChatMessageStream(
  message: string,
  token: string,
  conversationId: string | undefined,
  onChunk: (chunk: string) => void,
  onComplete: (response: ChatResponse) => void,
  onStatus?: (status: string) => void
): Promise<void> {
  const headers = await getAuthHeaders(token);

  console.log("🟢 [guardianApi] Sending streaming chat message...");

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let conversationIdReceived = conversationId || "";
    let fullMessage = "";
    let sources: any[] = [];
    let role = "assistant";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log("🔍 [guardianApi] Parsed SSE data:", data);

            if (data.conversation_id) {
              conversationIdReceived = data.conversation_id;
            } else if (data.status) {
              console.log("📊 [guardianApi] Status event received:", data.status);
              if (onStatus) onStatus(data.status);
            } else if (data.chunk) {
              fullMessage += data.chunk;
              onChunk(data.chunk);
            } else if (data.sources) {
              sources = data.sources;
            } else if (data.error) {
              console.error("🔴 [guardianApi] Stream error:", data.error);
              throw new Error(data.error);
            } else if (data.done) {
              // Stream complete
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }

    // Call onComplete with full response
    onComplete({
      conversation_id: conversationIdReceived,
      message: fullMessage,
      role,
      sources
    });

  } catch (error) {
    console.error("🔴 [guardianApi] Streaming error:", error);
    throw error;
  }
}

/**
 * Send chat message for guest users (no authentication)
 */
export async function sendChatMessageGuest(
  message: string
): Promise<ChatResponse> {
  console.log("🟢 [guardianApi] Sending guest chat message...");

  const response = await fetch(`${BACKEND_URL}/api/chat/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message } as ChatRequest),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Guest chat request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("🟢 [guardianApi] Guest response data:", data);
  return data;
}

/**
 * Send chat message with streaming response for guest users (no authentication)
 */
export async function sendChatMessageStreamGuest(
  message: string,
  onChunk: (chunk: string) => void,
  onComplete: (response: ChatResponse) => void,
  onStatus?: (status: string) => void
): Promise<void> {
  console.log("🟢 [guardianApi] Sending guest streaming chat message...");

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/guest/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`Guest stream request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullMessage = "";
    let sources: any[] = [];
    let role = "assistant";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log("🔍 [guardianApi] Guest parsed SSE data:", data);

            if (data.status) {
              console.log("📊 [guardianApi] Guest status event received:", data.status);
              if (onStatus) onStatus(data.status);
            } else if (data.chunk) {
              fullMessage += data.chunk;
              onChunk(data.chunk);
            } else if (data.sources) {
              sources = data.sources;
            } else if (data.error) {
              console.error("🔴 [guardianApi] Guest stream error:", data.error);
              throw new Error(data.error);
            } else if (data.done) {
              // Stream complete
            }
          } catch (e) {
            console.error("Error parsing guest SSE data:", e);
          }
        }
      }
    }

    // Call onComplete with full response
    onComplete({
      conversation_id: "guest",
      message: fullMessage,
      role,
      sources
    });

  } catch (error) {
    console.error("🔴 [guardianApi] Guest streaming error:", error);
    throw error;
  }
}


/**
 * Upload PDF file for RAG ingestion
 */
export async function uploadPDF(
  file: File,
  token: string
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/api/ingest/pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `PDF upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload plain text for RAG ingestion
 */
export async function uploadText(
  text: string,
  token: string,
  source: string = "manual_upload"
): Promise<IngestResponse> {
  const headers = await getAuthHeaders(token);

  const response = await fetch(`${BACKEND_URL}/api/ingest/text`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, source }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Text upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Health check for backend connectivity
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(token: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders(token);
    const response = await fetch(`${BACKEND_URL}/api/health/db`, { headers });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Vision analysis response interface
 */
export interface VisionResponse {
  status: string;
  conversation_id: string;
  image_preview_urls: string[]; // Changed from single url
  vision_summary: string;
  rag_context_used: boolean;
  final_answer: string;
  sources?: Array<{
    content: string;
    similarity: number;
  }>;
}

/**
 * Analyze medical images using Gemini Vision + RAG
 */
export async function analyzeImageWithVision(
  files: File[],
  token?: string,
  message?: string,
  conversationId?: string
): Promise<VisionResponse> {
  const formData = new FormData();

  // Append all files
  files.forEach(file => {
    formData.append("files", file);
  });

  if (message) {
    formData.append("message", message);
  }
  if (conversationId) {
    formData.append("conversation_id", conversationId);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/vision/analyze`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze images");
  }

  return response.json();
}

export type { ChatResponse, IngestResponse, ChatRequest };
