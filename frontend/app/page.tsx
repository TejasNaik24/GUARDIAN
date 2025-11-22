"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

export default function LandingPage() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Offset for better positioning
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative overflow-x-hidden bg-[#1E3A8A]">
      {/* Medical blue background */}
      {/* Hero Section */}
      <HeroSection scrollToSection={scrollToSection} />

      {/* Demo Video Section */}
      <DemoVideoSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}

// Hero Section Component
function HeroSection({
  scrollToSection,
}: {
  scrollToSection: (id: string) => void;
}) {
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
            className="group relative overflow-hidden rounded-full bg-[#2563EB] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-[#2563EB]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#1D4ED8]/60"
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
            className="group relative overflow-hidden rounded-full border-2 border-[#60A5FA]/50 bg-[#1E40AF]/10 px-10 py-4 text-lg font-semibold text-[#60A5FA] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#60A5FA] hover:bg-[#1E40AF]/20 hover:text-[#93C5FD] hover:shadow-lg hover:shadow-[#60A5FA]/30"
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

// Demo Video Section Component
function DemoVideoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="demo"
      className="relative bg-[#F9FAFB] px-6 pt-12 pb-20 md:px-12 md:pt-16 md:pb-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Demo Section Title - Medical Blue */}
          <h2 className="mb-4 text-4xl font-bold text-[#1E3A8A] md:text-5xl lg:text-6xl -mt-10">
            See Guardian in{" "}
            <span className="bg-linear-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="mb-12 text-lg text-[#64748B] md:text-xl">
            Watch how Guardian transforms medical emergency response
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Video Container - Replace with actual video */}
          <div className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-[#2563EB]/30 bg-white shadow-2xl shadow-[#2563EB]/20 backdrop-blur-sm">
            {/* Placeholder for video - Replace with actual <video> tag */}
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2563EB]/20"
                >
                  <svg
                    className="h-10 w-10 text-[#2563EB]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
                <p className="text-lg text-[#1E3A8A]">Demo Video Coming Soon</p>
                <p className="mt-2 text-sm text-[#64748B]">
                  Replace this placeholder with your actual demo video
                </p>
              </div>
            </div>

            {/* Uncomment and use this for actual video
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/path-to-your-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            */}
          </div>

          {/* Decorative glow effect */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-linear-to-r from-[#2563EB]/20 via-[#3B82F6]/20 to-[#60A5FA]/20 opacity-50 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}

// Features Section Component
function FeaturesSection() {
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

// How It Works Section Component
function HowItWorksSection() {
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

// CTA Section Component
function CTASection() {
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
