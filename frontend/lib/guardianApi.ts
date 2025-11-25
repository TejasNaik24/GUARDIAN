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

export type { ChatResponse, IngestResponse, ChatRequest };
