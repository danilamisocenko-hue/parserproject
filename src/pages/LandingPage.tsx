import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { Search, ChevronRight, Zap, Terminal, Cpu, Globe, Database, ArrowRight, Shield, Maximize, Activity, Server, Plus } from "lucide-react";
import { TopLevelView } from "../types";
import { TerminalCard } from "../components/TerminalCard";
import { PricingPlans } from "../components/PricingPlans";
import { cn } from "../lib/utils";
import { InteractiveCanvas } from "../components/InteractiveCanvas";
import { FeatureModal } from "../components/FeatureModal";

const TiltCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
    glowX.set(mouseX);
    glowY.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick(e);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative group rounded-[32px] overflow-hidden bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl transition-all duration-500 hover:border-white/10 hover:bg-white/[0.04] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] cursor-pointer", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-10"
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
      <div style={{ transform: "translateZ(50px)" }} className="relative z-20 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export function LandingPage({ onNavigate }: { onNavigate: (view: TopLevelView) => void }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', extendedDetail: '' });

  const openFeature = (title: string, description: string, extendedDetail: string) => {
    setModalContent({ title, description, extendedDetail });
    setModalOpen(true);
  };

  const cursorXLight = useSpring(mouseX, { stiffness: 1000, damping: 50 });
  const cursorYLight = useSpring(mouseY, { stiffness: 1000, damping: 50 });
  
  const cursorXHeavy = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const cursorYHeavy = useSpring(mouseY, { stiffness: 150, damping: 20 });

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  // Update cursor position inside style
  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen bg-[#000000] text-neutral-200 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans cursor-default sm:cursor-none">
      
      <FeatureModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title} 
        description={modalContent.description} 
        extendedDetail={modalContent.extendedDetail} 
      />

      <InteractiveCanvas />
      <motion.div 
        className="hidden sm:block pointer-events-none fixed z-[9999] w-4 h-4 bg-white rounded-full mix-blend-difference"
        style={{
           left: cursorXLight,
           top: cursorYLight,
           transform: "translate(-50%, -50%)"
        }}
      />
      <motion.div 
        className="hidden sm:block pointer-events-none fixed z-[9999] w-12 h-12 border border-indigo-400/50 rounded-full mix-blend-screen"
        style={{
           left: cursorXHeavy,
           top: cursorYHeavy,
           transform: "translate(-50%, -50%)"
        }}
      />

      {/* Interactive Global Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              1000px circle at ${mouseX}px ${mouseY}px,
              rgba(79,70,229,0.07),
              transparent 80%
            )
          `,
        }}
      />
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px] mix-blend-screen animate-[pulse_12s_ease-in-out_infinite]" />
      </div>
      
      {/* Interactive Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM5LjUgMGguNXY0MGgtLjVWMHptLTIwIDBoLjV2NDBoLS41VjB6bS0xOSAwaC41djQwaC0uNVYwem0LTM5LjUgNDBIMHYtLjVoNDB2LjV6bS0yMCAwaC0uNVYwaC41djQweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_20%,transparent_100%)] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center justify-between flex-1 md:flex-none">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-[12px] flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                    <div className="w-2 h-2 rounded-full bg-white opacity-50" />
                  </div>
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">FRESKO<span className="text-indigo-500">.CT</span></span>
              </div>
              
              <div className="flex bg-white/5 border border-white/10 rounded-full p-1 gap-1">
                <button className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full transition-colors">RU</button>
                <button className="text-neutral-400 hover:text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors">EN</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-6 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={(e) => {
                window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
                setTimeout(() => {
                  onNavigate("auth");
                }, 400);
              }}
              className="text-sm font-bold text-white hover:text-indigo-400 transition-colors bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full border border-white/10"
            >
              Войти
            </button>
            <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:block">Условия</a>
            <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:block">Политика</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-48 pb-32 px-6 min-h-screen flex text-center flex-col items-center justify-center z-10 perspective-1000">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto relative w-full flex flex-col items-center"
        >
          <div className="inline-flex flex-col items-center justify-center">
             <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(79,70,229,0.2)] mx-auto">
               <Zap className="w-4 h-4 fill-indigo-400" /> Самые быстрые услуги по минимальным ценам
             </div>
             
             <h1 className="text-[12vw] sm:text-[10vw] md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 text-center" style={{ transform: "skewX(-2deg)" }}>
               АБСОЛЮТНЫЙ <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-600 block mt-2">КОНТРОЛЬ ДАННЫХ</span>
             </h1>
             
             <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl leading-relaxed font-medium mx-auto">
               Самый качественный поставщик услуг автоматизации и сбора данных. Мы обеспечиваем скорость, безопасность и анонимность на максималках.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center w-full mt-6">
               <button 
                 onClick={(e) => {
                   window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'primary' } }));
                   setTimeout(() => {
                     onNavigate("auth");
                   }, 600);
                 }}
                 className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] text-[13px] group relative overflow-hidden"
               >
                 <span className="relative z-10 flex items-center justify-center gap-3">
                   ПОДКЛЮЧИТЬСЯ <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1" />
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
               </button>
               <button 
                 onClick={(e) => {
                   window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
                   setTimeout(() => {
                     document.getElementById('bento')?.scrollIntoView({ behavior: 'smooth' });
                   }, 300);
                 }}
                 className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/10 px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 text-[13px] backdrop-blur-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group relative overflow-hidden"
               >
                 <span className="relative z-10">БЫСТРЫЙ ЗАКАЗ</span>
               </button>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <div id="bento" className="py-32 px-6 relative z-10 perspective-1000">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase" style={{ transform: "skewX(-2deg)" }}>Наши преимущества</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg md:text-xl font-medium">Безупречная архитектура, созданная для максимальной эффективности.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[220px]">
             {/* Удобная панель */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Удобная панель', 'Наша панель использует все современные технологии', 'Мы разработали полностью кастомную экосистему, позволяющую быстро запускать и контролировать процессы, обеспечивая высокую стабильность.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] bottom-[-20%] text-white/5 pointer-events-none">
                 <Terminal className="w-64 h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-white mb-2">Удобная панель</h3>
                   <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-sm">Наша панель использует все современные технологии, обеспечивая высочайшую скорость работы.</p>
                 </div>
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex">
                   <ChevronRight className="w-6 h-6 text-white" />
                 </div>
               </div>
             </TiltCard>

             {/* Перепродавайте */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Перепродавайте', 'Предоставляем все условия для удобства реселлерам', 'Специальные API ключи и гибкие настройки биллинга позволят вам легко интегрировать наши сервисы в ваши проекты под собственной маркой.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] bottom-[-20%] text-white/5 pointer-events-none">
                 <Globe className="w-64 h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-white mb-2">Перепродавайте</h3>
                   <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-sm">Предоставляем все условия для удобства реселлерам. Арендуйте мощности оптом.</p>
                 </div>
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex">
                   <ChevronRight className="w-6 h-6 text-white" />
                 </div>
               </div>
             </TiltCard>

             {/* Лучшие цены */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Лучшие цены', 'Покупайте услуги с самых первых рук', 'Поскольку мы сами владеем инфраструктурой и не используем посредников, наши цены стабильно остаются ниже рыночных.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-2 p-10 flex flex-col items-start justify-start relative overflow-hidden group hover:border-indigo-500/30">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent z-10" />
               
               {/* Soft Glow */}
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] opacity-50 z-0 flex items-center justify-center pointer-events-none transition-transform duration-700 group-hover:scale-110">
                 <div className="absolute w-[80%] h-[80%] bg-indigo-500/20 blur-[80px] rounded-full" />
                 <Database className="w-32 h-32 text-indigo-400/30 absolute" />
               </div>

               <div className="relative z-20 w-full">
                 <div className="flex items-start justify-between">
                   <div>
                     <h3 className="text-3xl lg:text-4xl font-black text-white mb-3">Лучшие цены</h3>
                     <p className="text-neutral-300 text-base lg:text-lg font-medium max-w-sm">Покупайте услуги с самых первых рук без наценок за платформу.</p>
                   </div>
                   <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all hidden sm:flex shrink-0">
                     <ChevronRight className="w-6 h-6 text-white" />
                   </div>
                 </div>
               </div>
             </TiltCard>

             {/* Высшее качество */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Высшее качество', 'Мы постоянно следим за качеством услуг', 'Алгоритмы ротации прокси, защита от обнаружения (anti-detect) и гарантия Uptime 99.9%. При сбоях — возвращаем средства в автоматическом режиме.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-2 p-10 flex flex-col items-start justify-start relative overflow-hidden group hover:border-purple-500/30">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent z-10" />
               
               {/* Soft Glow */}
               <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] opacity-50 z-0 flex items-center justify-center pointer-events-none transition-transform duration-700 group-hover:scale-110">
                 <div className="absolute w-[80%] h-[80%] bg-purple-500/20 blur-[80px] rounded-full" />
                 <Shield className="w-32 h-32 text-purple-400/30 absolute" />
               </div>

               <div className="relative z-20 w-full">
                 <div className="flex items-start justify-between">
                   <div>
                     <h3 className="text-3xl lg:text-4xl font-black text-white mb-3">Высшее качество</h3>
                     <p className="text-neutral-300 text-base lg:text-lg font-medium max-w-sm">Аптайм 99.9%. Мы постоянно следим за качеством предоставляемых услуг.</p>
                   </div>
                   <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/50 transition-all hidden sm:flex shrink-0">
                     <ChevronRight className="w-6 h-6 text-white" />
                   </div>
                 </div>
               </div>
             </TiltCard>

             {/* Скидки */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Скидки', 'Лучшие предложения для активных пользователей', 'Кэшбэк до 20% от ежемесячных трат начисляется автоматически на баланс первого числа каждого месяца.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-8 flex flex-col text-left items-start justify-center overflow-hidden">
                <div className="absolute right-[-10%] top-[-20%] text-white/5 pointer-events-none">
                 <Activity className="w-64 h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-white mb-2">Скидки</h3>
                   <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-sm">Накопительная система скидок и лучшие предложения для активных пользователей.</p>
                 </div>
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex">
                   <ChevronRight className="w-6 h-6 text-white" />
                 </div>
               </div>
             </TiltCard>

             {/* Поддержка 24/7 */}
             <TiltCard onClick={(e) => {
               window.dispatchEvent(new CustomEvent('canvas-burst', { detail: { x: e.clientX, y: e.clientY, type: 'normal' } }));
               setTimeout(() => openFeature('Поддержка 24/7', 'Круглосуточная помощь через сайт и Telegram', 'Наши инженеры всегда на связи. Среднее время ответа в мессенджерах не превышает двух минут.'), 300);
             }} className="col-span-1 lg:col-span-2 row-span-1 p-8 flex flex-col text-left items-start justify-center overflow-hidden">
               <div className="absolute right-[-10%] top-[-20%] text-white/5 pointer-events-none">
                 <Server className="w-64 h-64" />
               </div>
               <div className="relative z-10 w-full flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-white mb-2">Поддержка 24/7</h3>
                   <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-sm">Круглосуточная помощь квалифицированных специалистов через систему тикетов.</p>
                 </div>
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex">
                   <ChevronRight className="w-6 h-6 text-white" />
                 </div>
               </div>
             </TiltCard>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-32 px-6 border-t border-white/5 relative z-10 backdrop-blur-md bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase" style={{ transform: "skewX(-2deg)" }}>Тарифы</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg md:text-xl font-medium">Начните мощную генерацию потока данных прямо сейчас.</p>
          </div>
          <div className="relative">
             <PricingPlans isLoggedIn={false} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 text-center relative z-10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-indigo-400/20 mb-8 opacity-80 mix-blend-screen">
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-full bg-white opacity-80" />
               <div className="w-3 h-3 rounded-full bg-white opacity-50" />
             </div>
           </div>
           <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-4 opacity-50">FRESKO.CT</h2>
           <p className="text-sm font-bold text-neutral-600 uppercase tracking-[0.3em] mb-10">Абсолютный контроль данных</p>
           
           <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-neutral-500">
             <a href="#" className="hover:text-white transition-colors">Условия</a>
             <a href="#" className="hover:text-white transition-colors">Политика</a>
             <a href="#" className="hover:text-white transition-colors">Контакты</a>
           </div>
           
           <div className="mt-16 text-[10px] text-neutral-700 font-mono">
             © 2026 FRESKO.CT PANEL. BUILD 1.0.5
           </div>
        </div>
      </footer>
    </div>
  );
}

