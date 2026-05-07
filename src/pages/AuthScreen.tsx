import React, { useState } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "motion/react";
import { Search, Mail, User, Lock, Loader2, MessageCircle } from "lucide-react";

export function AuthScreen({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { login, password } : { email, username: login, password };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
      } else {
        onLoginSuccess(data.user);
      }
    } catch (e: any) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseMove={handleMouseMove} className="flex h-screen items-center justify-center bg-[#050505] text-neutral-200 relative overflow-hidden">
      {/* Interactive Global Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(79,70,229,0.05),
              transparent 80%
            )
          `,
        }}
      />
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU5LjUgMGguNXY2MGgtLjVWMHptLTIwIDBoLjV2NjBoLS41VjB6bS0yMCAwaC41djYwaC0uNVYwem0tMTkgMGguNXY2MGgtLjVWMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNMCA1OS41aDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTE5aDYwdi41SDB2LS41eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 bg-black/60 border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-2xl z-10"
      >
        {/* Aesthetic glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-600/20 blur-[100px] pointer-events-none" />
        
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
             <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">PARSER</h1>
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mt-1">ecosystem by Fresko CT</p>
        </div>

        <div className="space-y-4 relative">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {!isLogin && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-700"
                />
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">{isLogin ? "Логин или Email" : "Логин"}</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ваш логин"
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-700"
              />
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl py-3 font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Войти в систему" : "Зарегистрироваться")}
          </button>

          <div className="flex items-center gap-4 my-6 opacity-30">
            <div className="flex-1 h-px bg-white" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Или</span>
            <div className="flex-1 h-px bg-white" />
          </div>

          <button 
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/auth/telegram/request", { method: "POST" });
                const { code, botUsername } = await res.json();
                
                const pollInterval = setInterval(async () => {
                  const statusRes = await fetch(`/api/auth/telegram/status/${code}`);
                  const statusData = await statusRes.json();
                  if (statusData.status === "completed") {
                    clearInterval(pollInterval);
                    onLoginSuccess(statusData.user);
                  }
                }, 2000);

                window.open(`https://t.me/${botUsername}?start=login_${code}`, "_blank");
              } catch (e) {
                setError("Ошибка инициализации Telegram");
              }
            }}
            className="w-full h-12 flex items-center justify-center bg-[#2481cc]/10 hover:bg-[#2481cc]/20 border border-[#2481cc]/30 text-[#2481cc] rounded-xl py-3 font-bold transition-all active:scale-95 gap-3"
          >
             <MessageCircle className="w-5 h-5" />
             Войти через Telegram
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            {isLogin ? "Нет аккаунта? Нажми для регистрации" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
