"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGuardianRAG } from "@/hooks/useGuardianRAG";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function UploadPage() {
  const router = useRouter();
  const { ingestPDF, ingestText, loading, error } = useGuardianRAG();

  const [uploadType, setUploadType] = useState<"pdf" | "text">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [textSource, setTextSource] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSuccess(null);
    }
  };

  const handlePDFUpload = async () => {
    if (!selectedFile) return;

    setSuccess(null);
    const result = await ingestPDF(selectedFile);

    if (result) {
      setSuccess(
        `✅ Successfully uploaded! Ingested ${result.chunks_ingested} chunks.`
      );
      setSelectedFile(null);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) return;

    setSuccess(null);
    const result = await ingestText(textContent, textSource || "manual_upload");

    if (result) {
      setSuccess(
        `✅ Successfully uploaded! Ingested ${result.chunks_ingested} chunks.`
      );
      setTextContent("");
      setTextSource("");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/chat")}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Chat
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Upload Documents
            </h1>
            <p className="text-gray-600 mt-2">
              Add knowledge to Guardian AI by uploading PDFs or text content
            </p>
          </div>

          {/* Upload Type Selector */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setUploadType("pdf")}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  uploadType === "pdf"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Upload PDF
                </div>
              </button>

              <button
                onClick={() => setUploadType("text")}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  uploadType === "text"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Upload Text
                </div>
              </button>
            </div>

            {/* PDF Upload */}
            {uploadType === "pdf" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select PDF file"}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      Maximum file size: 10MB
                    </span>
                  </label>
                </div>

                <button
                  onClick={handlePDFUpload}
                  disabled={!selectedFile || loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Uploading..." : "Upload PDF"}
                </button>
              </div>
            )}

            {/* Text Upload */}
            {uploadType === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Name (optional)
                  </label>
                  <input
                    type="text"
                    value={textSource}
                    onChange={(e) => setTextSource(e.target.value)}
                    placeholder="e.g., Medical Guidelines 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text content here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                    rows={12}
                  />
                </div>

                <button
                  onClick={handleTextUpload}
                  disabled={!textContent.trim() || loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Uploading..." : "Upload Text"}
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                {success}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Documents are split into chunks with overlap</li>
              <li>• Each chunk is embedded using Gemini AI</li>
              <li>• Stored in vector database for semantic search</li>
              <li>• Retrieved automatically during conversations</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
