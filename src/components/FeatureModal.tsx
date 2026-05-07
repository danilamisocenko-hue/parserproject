import React, { useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const FeatureModal = ({ isOpen, onClose, title, description, extendedDetail }: { isOpen: boolean, onClose: () => void, title: string, description: string, extendedDetail?: string }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-[#0a0a0a] border border-white/10 p-8 md:p-10 rounded-[32px] w-full max-w-lg relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Modal Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none mix-blend-screen" />
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors bg-white/5 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                 <Search className="w-8 h-8 text-white relative z-10 opacity-70" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">{title}</h3>
              <p className="text-neutral-400 text-base mb-6 font-medium leading-relaxed">
                {description}
              </p>
              {extendedDetail && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-sm text-neutral-500 leading-relaxed font-mono">
                  {extendedDetail}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
