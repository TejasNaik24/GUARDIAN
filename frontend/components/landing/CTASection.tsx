"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-linear-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-6 py-20 md:px-12 md:py-32"
    >
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Ready to Experience the Future of Medical AI?
          </h2>
          <p className="mb-12 text-xl text-white/90 md:text-2xl">
            Start chatting with Guardian today and see how AI can transform
            emergency response.
          </p>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full bg-white px-12 py-5 text-lg font-semibold text-[#1E3A8A] shadow-2xl transition-all duration-300 hover:bg-white/95 hover:shadow-white/50"
              >
                Get Started Now
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/50 bg-white/10 px-12 py-5 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/20"
              >
                Watch Demo
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
