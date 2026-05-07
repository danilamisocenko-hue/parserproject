import React, { useState, useRef } from "react";
import { Loader2, Bitcoin, Wallet, X } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, useMotionTemplate } from "motion/react";

const TiltPlanCard: React.FC<{ children: React.ReactNode, className?: string, highlight?: boolean }> = ({ children, className, highlight }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
    glowX.set(mouseX);
    glowY.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn(
        "relative group p-8 rounded-[32px] border bg-white/[0.02] backdrop-blur-3xl transition-colors duration-500 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        highlight ? "border-indigo-400/30" : "border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04]",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-10 rounded-[32px]"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${glowX}px ${glowY}px,
              rgba(99,102,241,0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div style={{ transform: "translateZ(30px)" }} className="relative z-20 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

export const PricingPlans = ({ isLoggedIn = false }: { isLoggedIn?: boolean }) => {
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const handleMethodSelect = async (method: string) => {
    if (!isLoggedIn) {
      window.location.href = "/";
      return;
    }
    
    setLoadingMethod(method);
    try {
      if (method === 'cryptobot') {
        const res = await fetch("/api/billing/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlanId })
        });
        const data = await res.json();
        if (data.pay_url) {
          window.open(data.pay_url, "_blank");
        } else {
          alert("Ошибка создания счета");
        }
      } else {
        alert("В данный момент этот способ оплаты находится в разработке.");
      }
    } catch(e) {
      alert("Ошибка сети");
    } finally {
      setLoadingMethod(null);
    }
  };

  const plans = [
    { id: "1m", name: "1 Месяц", priceUSD: 30, priceRUB: 3000, duration: "30 дней" },
    { id: "3m", name: "3 Месяца", priceUSD: 60, priceRUB: 6000, duration: "90 дней" },
    { id: "1y", name: "1 Год", priceUSD: 200, priceRUB: 20000, duration: "365 дней" },
    { id: "forever", name: "Навсегда", priceUSD: 150, priceRUB: 15000, duration: "Бессрочно", highlight: true },
  ];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 text-left perspective-1000">
        {plans.map(p => (
           <TiltPlanCard key={p.id} highlight={p.highlight}>
             {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(79,70,229,0.5)]">Самый выгодный</div>}
             <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">{p.name}</h3>
             <p className="text-neutral-500 text-sm mb-6 font-mono font-medium">{p.duration}</p>
             <div className="mb-8 flex-1">
               <span className="text-5xl font-black text-white">{p.priceUSD}$</span>
               <span className="text-neutral-500 text-sm block mt-2 font-medium">(≈{p.priceRUB}₽)</span>
             </div>
             <button 
               onClick={() => isLoggedIn ? setSelectedPlanId(p.id) : (window.location.href = "/")} 
               className={cn("w-full py-4 rounded-2xl font-black transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center", p.highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]" : "bg-white/5 hover:bg-white/10 text-white border border-white/5")}
              >
               Оформить
             </button>
           </TiltPlanCard>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlanId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedPlanId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#0a0a0a] border border-white/10 p-8 md:p-10 rounded-[32px] w-full max-w-md relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <button onClick={() => setSelectedPlanId(null)} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors bg-white/5 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">Оплата</h3>
              <p className="text-neutral-400 text-sm mb-8 font-medium">Тариф «{plans.find(p => p.id === selectedPlanId)?.name}» • {plans.find(p => p.id === selectedPlanId)?.priceUSD}$ ({plans.find(p => p.id === selectedPlanId)?.priceRUB}₽)</p>
              
              <div className="space-y-4">
                <button 
                  disabled={loadingMethod !== null}
                  onClick={() => handleMethodSelect('cryptobot')}
                  className="w-full bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all group text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#2481cc]/10 flex items-center justify-center border border-[#2481cc]/20 group-hover:scale-110 transition-transform">
                      <Wallet className="w-6 h-6 text-[#2481cc]" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white group-hover:text-[#2481cc] transition-colors">CryptoBot</h4>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1 font-bold">TON, USDT, BTC</p>
                    </div>
                  </div>
                  {loadingMethod === 'cryptobot' && <Loader2 className="w-6 h-6 animate-spin text-[#2481cc]" />}
                </button>

                <button 
                  disabled={loadingMethod !== null}
                  onClick={() => handleMethodSelect('lzt')}
                  className="w-full bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all group text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <span className="font-black text-emerald-500 text-lg">LZT</span>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white group-hover:text-emerald-500 transition-colors">Lolzteam</h4>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1 font-bold">Баланс маркета</p>
                    </div>
                  </div>
                  {loadingMethod === 'lzt' && <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />}
                </button>

                <button 
                  disabled={loadingMethod !== null}
                  onClick={() => handleMethodSelect('crypto')}
                  className="w-full bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all group text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                      <Bitcoin className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white group-hover:text-amber-500 transition-colors">Криптовалюта</h4>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1 font-bold">Прямой перевод</p>
                    </div>
                  </div>
                  {loadingMethod === 'crypto' && <Loader2 className="w-6 h-6 animate-spin text-amber-500" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
