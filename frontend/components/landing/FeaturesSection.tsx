"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "Smart Triage",
      description:
        "AI-powered emergency assessment that prioritizes critical cases and provides instant guidance for medical emergencies.",
      color: "#2563EB",
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
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
      ),
      title: "Document Intelligence",
      description:
        "Advanced RAG technology that retrieves and analyzes medical documents, providing accurate information from your knowledge base.",
      color: "#059669",
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
      title: "2-Layer AI Processing",
      description:
        "Sophisticated dual-LLM architecture that combines intelligent routing with contextual response generation for optimal accuracy.",
      color: "#3B82F6",
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Real-Time Response",
      description:
        "Lightning-fast processing and response times ensure you get critical medical information exactly when you need it most.",
      color: "#10B981",
    },
  ];

  return (
    <section
      ref={ref}
      id="features"
      className="relative bg-linear-to-b from-[#F9FAFB] to-white px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-[#1E3A8A] md:text-5xl lg:text-6xl">
            Powerful{" "}
            <span className="bg-linear-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-lg text-[#A3CFFB] md:text-xl">
            Everything you need for intelligent medical assistance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-8 backdrop-blur-sm transition-all duration-300 hover:border-[#93C5FD] hover:shadow-xl"
              style={{
                boxShadow: `0 0 30px ${feature.color}15`,
              }}
            >
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${feature.color}20`,
                  color: feature.color,
                }}
              >
                {feature.icon}
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#1E3A8A]">
                {feature.title}
              </h3>
              <p className="text-[#64748B]">{feature.description}</p>

              {/* Decorative gradient overlay on hover */}
              <div
                className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${feature.color}40, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
