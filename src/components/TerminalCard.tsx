import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring } from "motion/react";
import { Activity, Shield } from "lucide-react";

export function TerminalCard({ y }: { y: any }) {
  const [lines, setLines] = useState<string[]>([]);
  const baseLines = [
    "> initializing core modules...",
    "> connecting to VLESS nodes: [OK]",
    "> targeting search queries: ENABLED",
    "> bypassing anti-bot: ACTIVE",
    "> parsing in progress..."
  ];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const addLine = (index: number) => {
      if (index < baseLines.length) {
        setLines(prev => [...prev, baseLines[index]]);
        timeout = setTimeout(() => addLine(index + 1), 600 + Math.random() * 400);
      }
    };
    addLine(0);
    return () => clearTimeout(timeout);
  }, []);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const constY = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(constY, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    constY.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    constY.set(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      style={{ y, rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative lg:h-[600px] w-full perspective-1000 hidden lg:block cursor-crosshair"
    >
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-purple-600/10 rounded-[40px] border border-white/10 backdrop-blur-2xl p-8 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px]" />
        
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 mb-4">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
             <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
             <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
           </div>
           <div className="text-[10px] font-mono text-neutral-500">parser_engine_v1.sh</div>
        </div>

        <div className="relative z-10 font-mono text-xs text-indigo-300 space-y-3 opacity-90 flex-1">
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.p 
                key={i} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className={line.includes('ACTIVE') || line.includes('OK') ? 'text-green-400' : ''}
              >
                {line}
              </motion.p>
            ))}
            {lines.length === baseLines.length && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-indigo-500 rounded-full animate-pulse" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 relative z-10 grid grid-cols-2 gap-4" style={{ transform: "translateZ(30px)" }}>
           <div className="bg-black/60 rounded-2xl p-4 border border-white/5 backdrop-blur-xl hover:bg-black/80 transition-colors">
             <Activity className="w-6 h-6 text-indigo-400 mb-2" />
             <div className="text-2xl font-black text-white">49.2K</div>
             <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Обработано</div>
           </div>
           <div className="bg-black/60 rounded-2xl p-4 border border-white/5 backdrop-blur-xl hover:bg-black/80 transition-colors">
             <Shield className="w-6 h-6 text-purple-400 mb-2" />
             <div className="text-2xl font-black text-white">0</div>
             <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Блокировок</div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
