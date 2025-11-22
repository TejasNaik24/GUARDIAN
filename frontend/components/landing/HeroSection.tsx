"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

interface HeroSectionProps {
  scrollToSection: (id: string) => void;
}

export default function HeroSection({ scrollToSection }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#1E3A8A] via-[#1E40AF] to-[#3B82F6]">
      {/* Medical blue gradient */}
      {/* Animated Background Elements - Sky blue, Light blue, Success green accents */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#3B82F6]/15 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.2, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-[#60A5FA]/15 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#059669]/10 blur-3xl"
        />
      </div>

      {/* Animated Decorative Shapes - Light blue, Success green, Sky blue */}
      <motion.div
        animate={{
          rotate: [45, 90, 45],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-10 top-20 h-16 w-16 border-2 border-[#60A5FA]/40 md:left-20"
      />
      <motion.div
        animate={{
          rotate: [12, 45, 12],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute right-10 bottom-32 h-12 w-12 border-2 border-[#059669]/40 md:right-32"
      />
      <motion.div
        animate={{
          rotate: [45, 90, 45],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute left-1/4 bottom-20 hidden h-8 w-8 rotate-45 bg-[#3B82F6]/20 md:block"
      />

      {/* Hero Content */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 md:px-12"
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 text-center"
        >
          {/* Guardian Title with Medical Blues Gradient Animation */}
          <motion.h1
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mb-2 bg-size-[200%_auto] bg-linear-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6] bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl lg:text-8xl"
          >
            Guardian
          </motion.h1>
          {/* Decorative Lines - Light Blue */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            <div className="h-px w-12 bg-linear-to-r from-transparent to-[#60A5FA]" />
            <div className="h-2 w-2 rotate-45 bg-[#60A5FA]" />
            <div className="h-px w-12 bg-linear-to-l from-transparent to-[#60A5FA]" />
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 max-w-2xl text-center text-lg leading-relaxed text-white md:text-xl lg:text-2xl"
        >
          Your AI Guardian for medical emergencies and document assistance.
          <span className="mt-2 block text-base text-[#A3CFFB] md:text-lg">
            Powered by advanced RAG technology and intelligent triage systems.
          </span>
        </motion.p>

        {/* CTA Buttons - Primary Medical Blue & Secondary Light Blue */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col gap-6 sm:flex-row sm:gap-8"
        >
          <Link
            href="/chat"
            className="group relative overflow-hidden rounded-full bg-[#2563EB] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-[#2563EB]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#1D4ED8]/60 cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Chatting
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
            </span>
            <div className="absolute inset-0 z-0 bg-[#1D4ED8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>

          <button
            onClick={() => scrollToSection("how-it-works")}
            className="group relative overflow-hidden rounded-full border-2 border-[#60A5FA]/50 bg-[#1E40AF]/10 px-10 py-4 text-lg font-semibold text-[#60A5FA] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#60A5FA] hover:bg-[#1E40AF]/20 hover:text-[#93C5FD] hover:shadow-lg hover:shadow-[#60A5FA]/30 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              How It Works
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-y-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{
            opacity: { delay: 1, duration: 0.5 },
            y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          }}
          className="absolute bottom-10"
        >
          <svg
            className="h-8 w-8 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
