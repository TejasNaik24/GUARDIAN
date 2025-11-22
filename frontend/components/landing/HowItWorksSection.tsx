"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      title: "Document Ingestion",
      description:
        "Medical documents and clinical guidelines are processed using advanced embedding techniques, creating a comprehensive, searchable knowledge base.",
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
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      color: "#2563EB",
    },
    {
      number: "02",
      title: "Smart Retrieval (RAG)",
      description:
        "When you ask a question, our Retrieval-Augmented Generation system instantly finds the most relevant information from the knowledge base.",
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      color: "#059669",
    },
    {
      number: "03",
      title: "Intelligent Triage",
      description:
        "The first-layer LLM analyzes query urgency and context, routing to appropriate processing pathways for optimal response quality.",
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "#3B82F6",
    },
    {
      number: "04",
      title: "Response Generation",
      description:
        "The second-layer LLM synthesizes retrieved information with contextual understanding to deliver accurate, helpful, and actionable responses.",
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
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      color: "#10B981",
    },
  ];

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="relative bg-[#F9FAFB] px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-[#1E3A8A] md:text-5xl lg:text-6xl">
            How{" "}
            <span className="bg-linear-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
              Guardian Works
            </span>
          </h2>
          <p className="text-lg text-[#64748B] md:text-xl">
            Advanced AI pipeline for medical emergency assistance
          </p>
        </motion.div>

        <div className="relative space-y-12">
          {steps.map((step, index) => {
            const stepRef = useRef(null);
            const stepInView = useInView(stepRef, {
              once: true,
              margin: "-50px",
            });

            return (
              <div key={index} ref={stepRef}>
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={
                    stepInView
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 50, scale: 0.9 }
                  }
                  transition={{
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.1,
                  }}
                  className="relative flex flex-col md:flex-row md:items-center md:gap-8"
                >
                  {/* Animated Connecting Line - Grows from previous step */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={
                        stepInView
                          ? { height: "100%", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                        delay: 0.6,
                      }}
                      className="absolute left-8 top-20 hidden w-0.5 origin-top md:block"
                      style={{
                        background: `linear-gradient(to bottom, ${
                          step.color
                        }, ${steps[index + 1].color})`,
                        height: "calc(100% + 3rem)",
                      }}
                    />
                  )}

                  {/* Number Badge with Pop Animation */}
                  <div className="relative z-10 mb-4 md:mb-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={
                        stepInView
                          ? { scale: 1, rotate: 0 }
                          : { scale: 0, rotate: -180 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2,
                      }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-white shadow-lg"
                      style={{
                        backgroundColor: step.color,
                        boxShadow: `0 10px 30px ${step.color}40`,
                      }}
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={stepInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="text-xl"
                      >
                        {step.number}
                      </motion.span>
                    </motion.div>

                    {/* Pulse Ring Effect */}
                    <motion.div
                      initial={{ scale: 1, opacity: 0 }}
                      animate={
                        stepInView
                          ? {
                              scale: [1, 1.5, 1.8],
                              opacity: [0.5, 0.2, 0],
                            }
                          : { scale: 1, opacity: 0 }
                      }
                      transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        border: `2px solid ${step.color}`,
                      }}
                    />
                  </div>

                  {/* Content Card with Slide-in Animation */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={
                      stepInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }
                    }
                    transition={{
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.3,
                    }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-8 backdrop-blur-sm transition-all duration-300 hover:border-[#93C5FD] hover:shadow-xl"
                    style={{
                      boxShadow: `0 0 30px ${step.color}15`,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        stepInView
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 20 }
                      }
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="mb-4 flex items-center gap-4"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${step.color}20`,
                          color: step.color,
                        }}
                      >
                        {step.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-[#1E3A8A]">
                        {step.title}
                      </h3>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={stepInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                      className="text-[#64748B]"
                    >
                      {step.description}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 rounded-2xl border border-[#93C5FD]/30 bg-white p-6 backdrop-blur-sm"
        >
          <p className="text-center text-sm text-[#64748B]">
            <strong className="text-[#2563EB]">Important Note:</strong> Guardian
            is designed to assist with medical information and emergency triage,
            but it is not a replacement for professional medical advice,
            diagnosis, or treatment. Always consult with qualified healthcare
            professionals.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
