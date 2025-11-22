"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function DemoVideoSection() {
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
