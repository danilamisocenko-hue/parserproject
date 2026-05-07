import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

export function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="group relative bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl overflow-hidden transition-all duration-500 hover:border-indigo-500/30"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(99,102,241,0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">
        <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-500 backdrop-blur-xl">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tighter">{title}</h3>
        <p className="text-neutral-400 text-sm leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
