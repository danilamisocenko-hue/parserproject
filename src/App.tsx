import React, { useState, useEffect } from "react";
import { 
  Search, Settings, User, LogOut, MessageCircle, Menu, X, Download, ShieldCheck, Zap
} from "lucide-react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "./lib/utils";
import { TopLevelView, Tab } from "./types";
import { LandingPage } from "./pages/LandingPage";
import { AuthScreen } from "./pages/AuthScreen";
import { PricingPlans } from "./components/PricingPlans";
import { StatCard } from "./components/StatCard";
import { NavItem } from "./components/NavItem";

export default function App() {
  const [currentView, setCurrentView] = useState<TopLevelView>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const bgStyle = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(79,70,229,0.04),
      transparent 80%
    )
  `;

  const hasActivePlan = user?.plan && user.plan !== "FREE" && user.plan !== "NONE";

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        if (currentView === "landing" || currentView === "auth") {
          setCurrentView("app");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setUser(null);
  };

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  if (currentView === "landing") {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  if (!isLoggedIn || currentView === "auth") {
    return <AuthScreen onLoginSuccess={(u) => { setUser(u); setIsLoggedIn(true); setCurrentView("app"); }} />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div onMouseMove={handleMouseMove} className="flex h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden relative">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: bgStyle,
        }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU5LjUgMGguNXY2MGgtLjVWMHptLTIwIDBoLjV2NjBoLS41VjB6bS0yMCAwaC41djYwaC0uNVYwem0tMTkgMGguNXY2MGgtLjVWMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNMCA1OS41aDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTIwaDYwdi41SDB2LS41em0wLTE5aDYwdi41SDB2LS41eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.03] pointer-events-none" />

      {/* Mobile top header */}
      <div className="md:hidden flex h-[72px] items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-50">
         <div className="flex items-center gap-3">
           <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
             <Search className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="font-black text-xl tracking-tighter text-white">PARSER</h1>
             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] -mt-1">LK Panel</p>
           </div>
         </div>
         <button onClick={toggleSidebar} className="p-2 text-white bg-neutral-800/50 rounded-xl hover:bg-neutral-800 transition-colors">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </div>

      <div className="relative z-10 flex w-full h-full pt-[72px] md:pt-0">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col fixed top-[72px] md:top-0 md:relative h-[calc(100vh-72px)] md:h-screen z-40 transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="hidden md:block p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter text-white">PARSER</h1>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] -mt-1">by FRESKO CT</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
              active={activeTab === "dashboard"} 
              onClick={() => { setActiveTab("dashboard"); closeSidebar(); }} 
              icon={<User className="w-4 h-4" />} 
              label="Мой профиль" 
            />
            <NavItem 
              active={activeTab === "billing"} 
              onClick={() => { setActiveTab("billing"); closeSidebar(); }} 
              icon={<ShieldCheck className="w-4 h-4" />} 
              label="Подписка" 
            />
            <NavItem 
              active={activeTab === "download"} 
              onClick={() => { setActiveTab("download"); closeSidebar(); }} 
              icon={<Download className="w-4 h-4" />} 
              label="Скачать ПО"
            />
            {user?.plan === "ADMIN" && (
              <NavItem 
                active={activeTab === "admin"} 
                onClick={() => { setActiveTab("admin"); closeSidebar(); }} 
                icon={<Settings className="w-4 h-4" />} 
                label="Админ-панель"
              />
            )}
          </nav>

          <div className="p-4 border-t border-neutral-800 space-y-3 pb-8 md:pb-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                   {user?.username?.[0]?.toUpperCase() || "U"}
                 </div>
                 <div className="truncate">
                   <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                   <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">{!hasActivePlan ? <span className="text-red-400">НЕТ ПОДПИСКИ</span> : user?.plan + " PLAN"}</p>
                 </div>
               </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-colors font-bold text-xs"
            >
              <LogOut className="w-4 h-4" /> Выйти
            </button>
            <a 
              href="https://t.me/Fresko_CT" 
              target="_blank" 
              className="hidden md:block bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl p-3 transition-colors group"
            >
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Developer</p>
              <p className="text-xs font-bold text-indigo-200 group-hover:text-white transition-colors">@Fresko_CT</p>
            </a>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {isSidebarOpen && (
           <div onClick={closeSidebar} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" />
        )}

        <main className="flex-1 overflow-y-auto bg-neutral-950">
          <header className="hidden md:flex h-16 border-b border-neutral-800 px-8 items-center justify-between bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              PARSER • {activeTab === "dashboard" && "Мой профиль"}
              {activeTab === "billing" && "Управление подпиской"}
              {activeTab === "download" && "Скачать приложение"}
              {activeTab === "admin" && "Админ-панель"}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">V1.0.4 - RELEASE</span>
            </div>
          </header>

          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-600/10 blur-[50px] pointer-events-none" />
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-800 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-neutral-900 shadow-xl relative z-10">
                      <User className="w-8 h-8 md:w-10 md:h-10 text-neutral-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{user?.username}</h2>
                    <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-300">
                        План: <span className={hasActivePlan ? "text-indigo-400" : "text-red-400"}>{user?.plan === 'FREE' || user?.plan === 'NONE' || !user?.plan ? "НЕТ ПОДПИСКИ" : user?.plan}</span>
                      </span>
                    </div>
                    
                    <p className="text-neutral-500 text-xs md:text-sm mt-6 mb-6">Ваш аккаунт зарегистрирован. Email: {user?.email || "Не указан"}</p>
                    
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <button 
                        onClick={() => setActiveTab("billing")} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)] w-full text-sm"
                      >
                        {hasActivePlan ? "Продлить подписку" : "Оформить подписку"}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/auth/telegram/link", { method: "POST" });
                            const { code, botUsername } = await res.json();
                            
                            const pollInterval = setInterval(async () => {
                              const statusRes = await fetch(`/api/auth/telegram/link-status/${code}`);
                              const statusData = await statusRes.json();
                              if (statusData.status === "completed") {
                                clearInterval(pollInterval);
                                checkAuth();
                              }
                            }, 2000);
            
                            window.open(`https://t.me/${botUsername}?start=link_${code}`, "_blank");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl py-3.5 font-bold transition-all active:scale-95 w-full flex items-center justify-center gap-3 text-sm"
                      >
                         <MessageCircle className="w-5 h-5 text-[#2481cc]" />
                         {user?.telegram_id ? "Telegram привязан" : "Привязать Telegram"}
                      </button>

                      {hasActivePlan && (
                        <button 
                          onClick={() => setActiveTab("download")} 
                          className="bg-neutral-100 hover:bg-white text-black rounded-xl py-3.5 font-bold transition-all active:scale-95 w-full flex items-center justify-center gap-3 text-sm mt-4"
                        >
                           <Download className="w-5 h-5" />
                           Скачать ПО
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-red-500/10 rounded-3xl p-6">
                    <h3 className="text-red-400 font-bold mb-2">Опасная зона</h3>
                    <p className="text-neutral-500 text-xs mb-4">После удаления аккаунта все ваши данные будут безвозвратно удалены.</p>
                    <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl px-4 py-2 text-xs font-bold transition-colors">
                      Удалить аккаунт
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "billing" && (
                <motion.div 
                  key="billing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-10 mt-4 md:mt-10">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">Выберите подписку</h1>
                    <p className="text-neutral-400 max-w-2xl mx-auto text-sm md:text-base">Получите доступ к мощному приложению-парсеру для вашего ПК.</p>
                  </div>
                  <PricingPlans isLoggedIn={isLoggedIn} />
                </motion.div>
              )}

              {activeTab === "download" && (
                  <motion.div 
                    key="download"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto"
                  >
                    {!hasActivePlan ? (
                       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-16 text-center">
                         <ShieldCheck className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
                         <h2 className="text-2xl font-black text-white mb-4">Доступ закрыт</h2>
                         <p className="text-neutral-400 mb-8">Для скачивания приложения необходимо иметь активную подписку.</p>
                         <button 
                           onClick={() => setActiveTab("billing")}
                           className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg text-sm"
                         >
                           Перейти к тарифам
                         </button>
                       </div>
                    ) : (
                       <div className="bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 md:p-10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px]" />
                         <div className="relative z-10">
                           <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 mb-10">
                             <div>
                               <h2 className="text-3xl font-black text-white mb-2">Скачать Parser</h2>
                               <p className="text-neutral-400 text-sm">Версия 1.0.4 для Windows 10/11</p>
                             </div>
                             <a 
                               href="/api/results/export?taskId=all" // placeholder endpoint representing download, you can update it if needed
                               className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                             >
                               <Download className="w-6 h-6" /> .ZIP Архив
                             </a>
                           </div>

                           <div className="space-y-6">
                             <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6">
                               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Инструкция по установке</h3>
                               <ol className="list-decimal list-inside space-y-3 text-sm text-neutral-400 leading-relaxed">
                                 <li>Скачайте архив по кнопке выше.</li>
                                 <li>Распакуйте его в удобную папку на компьютере.</li>
                                 <li>Запустите файл <span className="text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded">INSTALL_AND_RUN.bat</span>.</li>
                                 <li>Программа установит необходимые компоненты и откроется автоматически.</li>
                                 <li>Для авторизации используйте логин и пароль от этого кабинета.</li>
                               </ol>
                             </div>
                           </div>
                         </div>
                       </div>
                    )}
                  </motion.div>
              )}

              {activeTab === "admin" && user?.plan === "ADMIN" && (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px]" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Админ-панель</h3>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Управление экосистемой</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-white mb-4">Статистика платформы</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Пользователей</span>
                            <span className="text-sm font-mono text-indigo-400">1,245</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Активных задач</span>
                            <span className="text-sm font-mono text-green-400">34</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Выручка (Месяц)</span>
                            <span className="text-sm font-mono text-green-500">$4,500</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/50 border border-neutral-800 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-white mb-4">Выдача подписок</h4>
                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="ID Пользователя (username/email)" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500"
                            id="adminTargetId"
                          />
                          <select 
                            id="adminPlanId"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 text-neutral-300"
                          >
                            <option value="1m">1 Месяц</option>
                            <option value="3m">3 Месяца</option>
                            <option value="1y">1 Год</option>
                            <option value="forever">Навсегда</option>
                            <option value="ADMIN">ADMIN (Доступ ко всему)</option>
                          </select>
                          <button 
                            onClick={async () => {
                              const targetId = (document.getElementById('adminTargetId') as HTMLInputElement).value;
                              const planId = (document.getElementById('adminPlanId') as HTMLSelectElement).value;
                              if (!targetId || !planId) return;
                              try {
                                const res = await fetch("/api/admin/grant-plan", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ targetId, planId })
                                });
                                const data = await res.json();
                                alert(data.message || data.error);
                              } catch(e) {
                                alert("Ошибка сети");
                              }
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                          >
                            Выдать план
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
