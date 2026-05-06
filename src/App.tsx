import { useState, useEffect } from "react";
import { 
  Search, 
  Settings, 
  Database, 
  Activity, 
  Play, 
  Trash2, 
  Plus, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileSpreadsheet,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "dashboard" | "parser" | "proxies" | "results";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tasks, setTasks] = useState<any[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [keyword, setKeyword] = useState("");
  const [engine, setEngine] = useState("google");
  const [country, setCountry] = useState("all");
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<string[]>(["email", "phone", "telegram", "whatsapp"]);
  const [proxyName, setProxyName] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");

  const fetchData = async () => {
    try {
      const [t, p, r] = await Promise.all([
        fetch("/api/tasks").then(res => res.json()),
        fetch("/api/proxies").then(res => res.json()),
        fetch("/api/results").then(res => res.json())
      ]);
      setTasks(t);
      setProxies(p);
      setResults(r);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTask = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, engine, limit, filters, country })
      });
      setKeyword("");
      setActiveTab("parser");
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (f: string) => {
    setFilters(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]);
  };

  const handleExport = () => {
    window.location.href = "/api/results/export";
  };

  const handleAddProxy = async () => {
    if (!proxyName || !proxyUrl) return;
    await fetch("/api/proxies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: proxyName, url: proxyUrl })
    });
    setProxyName("");
    setProxyUrl("");
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
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

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={<Activity className="w-4 h-4" />} 
            label="Главная" 
          />
          <NavItem 
            active={activeTab === "parser"} 
            onClick={() => setActiveTab("parser")} 
            icon={<Terminal className="w-4 h-4" />} 
            label="Парсинг" 
            count={tasks.filter(t => t.status !== "завершено").length}
          />
          <NavItem 
            active={activeTab === "proxies"} 
            onClick={() => setActiveTab("proxies")} 
            icon={<ShieldCheck className="w-4 h-4" />} 
            label="VLESS Ключи" 
          />
          <NavItem 
            active={activeTab === "results"} 
            onClick={() => setActiveTab("results")} 
            icon={<Database className="w-4 h-4" />} 
            label="Результаты" 
            count={results.length}
          />
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-3">
          <a 
            href="https://t.me/Fresko_CT" 
            target="_blank" 
            className="block bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl p-3 transition-colors group"
          >
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Developer</p>
            <p className="text-xs font-bold text-indigo-200 group-hover:text-white transition-colors">@Fresko_CT</p>
          </a>
          <div className="bg-neutral-800/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Система готова</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-950">
        <header className="h-16 border-b border-neutral-800 px-8 flex items-center justify-between bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
            PARSER • {activeTab === "dashboard" && "Панель управления"}
            {activeTab === "parser" && "Очередь задач"}
            {activeTab === "proxies" && "Управление прокси"}
            {activeTab === "results" && "Сбор разведданных"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">V1.0.4 - RELEASE</span>
            <Settings className="w-4 h-4 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <StatCard title="Всего контактов" value={results.length} icon={<Database className="text-blue-400" />} />
                <StatCard title="Активные задачи" value={tasks.filter(t => t.status !== "завершено" && t.status !== "ошибка").length} icon={<Activity className="text-orange-400" />} />
                <StatCard title="Узлы VLESS" value={proxies.length} icon={<ShieldCheck className="text-green-400" />} />

                <div className="col-span-1 md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-400" />
                    Настройка быстрой задачи
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Поисковый запрос</label>
                      <input 
                        type="text" 
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="например: услуги бухгалтера москва"
                        className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-neutral-200"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Лимит контактов</label>
                        <input 
                          type="number" 
                          value={limit}
                          onChange={(e) => setLimit(parseInt(e.target.value))}
                          className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none text-neutral-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Движок</label>
                        <select 
                          value={engine}
                          onChange={(e) => setEngine(e.target.value)}
                          className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none text-neutral-200"
                        >
                          <option value="google">Google</option>
                          <option value="duckduckgo">DuckDuckGo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Страна поиска</label>
                        <select 
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none text-neutral-200"
                        >
                          <option value="all">Весь мир (Global)</option>
                          <option value="ru">Россия (RU)</option>
                          <option value="us">США (USA)</option>
                          <option value="de">Германия (DE)</option>
                          <option value="ua">Украина (UA)</option>
                          <option value="kz">Казахстан (KZ)</option>
                          <option value="pl">Польша (PL)</option>
                          <option value="gb">Великобритания (UK)</option>
                          <option value="fr">Франция (FR)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-3 block tracking-widest">Типы контактов</label>
                      <div className="flex flex-wrap gap-3">
                        {["email", "phone", "telegram", "whatsapp"].map(f => (
                          <button
                            key={f}
                            onClick={() => toggleFilter(f)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-xs font-bold border transition-all uppercase tracking-tighter",
                              filters.includes(f) 
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                                : "bg-neutral-800 border-neutral-700 text-neutral-500"
                            )}
                          >
                            {f === "email" && "E-mail"}
                            {f === "phone" && "Телефон"}
                            {f === "telegram" && "Telegram"}
                            {f === "whatsapp" && "WhatsApp"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleStartTask}
                      disabled={loading || !keyword}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      Запустить парсинг
                    </button>
                  </div>
                </div>

                <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-indigo-400">Установка на ПК</h3>
                  <div className="space-y-4 text-xs leading-relaxed text-neutral-400">
                    <p>Чтобы превратить этот парсер в полноценную программу на твоем компе:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Нажми <span className="text-white font-bold">Export Zip</span> в меню настроек.</li>
                      <li>Распакуй скачанный архив в папку.</li>
                      <li>Запусти файл <span className="text-green-500 font-bold">INSTALL_AND_RUN.bat</span>.</li>
                      <li>Прога создаст ярлык на рабочем столе и сама запустится.</li>
                    </ol>
                    <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                      <p className="text-[9px] uppercase font-bold text-neutral-600 mb-1">Разработчик</p>
                      <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold">
                        FRESKO CT (@Fresko_CT)
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "parser" && (
              <motion.div 
                key="parser"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Активные процессы</h3>
                  <button onClick={() => setTasks([])} className="text-[10px] font-bold text-neutral-500 hover:text-red-400 flex items-center gap-2 uppercase tracking-widest bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                    <Trash2 className="w-3 h-3" /> Очистить историю
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {tasks.length === 0 ? (
                    <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-16 text-center text-neutral-600">
                      Нет активных задач. Запустите парсинг на главной.
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "p-3 rounded-xl shadow-inner",
                                task.status === "завершено" ? "bg-green-500/10 text-green-500" : 
                                task.status === "ошибка" ? "bg-red-500/10 text-red-500" : "bg-indigo-500/10 text-indigo-400"
                              )}>
                                {task.status === "завершено" ? <CheckCircle2 className="w-6 h-6" /> : 
                                 task.status === "ошибка" ? <XCircle className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">{task.keyword}</h4>
                                <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
                                  {task.engine} • {task.id.slice(0, 8)} • ЛИМИТ: {task.limit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-white">{task.resultsCount}</span>
                              <span className="text-xs text-neutral-500 ml-2 uppercase font-bold tracking-tighter">Найдено</span>
                              <p className={cn(
                                "text-[10px] font-bold uppercase tracking-widest mt-1",
                                task.status === "завершено" ? "text-green-500" : "text-indigo-400 animate-pulse"
                              )}>{task.status}</p>
                            </div>
                          </div>
                          <div className="space-y-2 mb-6">
                            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] rounded-full"
                              />
                            </div>
                            <div className="flex justify-between text-[8px] uppercase tracking-[0.2em] font-black text-neutral-600">
                              <span className={cn(task.progress >= 5 && "text-indigo-400")}>Инициализация</span>
                              <span className={cn(task.progress >= 20 && "text-indigo-400")}>Поиск</span>
                              <span className={cn(task.progress > 20 && task.progress < 100 && "text-indigo-400")}>Сбор</span>
                              <span className={cn(task.progress === 100 && "text-green-500")}>Готово</span>
                            </div>
                          </div>

                          {/* Logs / Terminal */}
                          {task.logs && task.logs.length > 0 && (
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-[10px] h-32 overflow-y-auto scrollbar-hide">
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-800/50">
                                <Terminal className="w-3 h-3 text-neutral-600" />
                                <span className="uppercase text-neutral-600 font-bold tracking-widest">Системный лог</span>
                              </div>
                              <div className="space-y-1">
                                {task.logs.map((log: string, idx: number) => (
                                  <div key={idx} className={cn(
                                    "transition-opacity",
                                    idx === 0 ? "text-indigo-300" : "text-neutral-500"
                                  )}>
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "proxies" && (
              <motion.div 
                key="proxies"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                    <Plus className="w-5 h-5 text-green-500" />
                    Добавить VLESS узел
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Название</label>
                      <input 
                        type="text" 
                        placeholder="например: Германия #1"
                        value={proxyName}
                        onChange={e => setProxyName(e.target.value)}
                        className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Ключ</label>
                      <textarea 
                        placeholder="vless://config-string..."
                        value={proxyUrl}
                        onChange={e => setProxyUrl(e.target.value)}
                        className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-4 py-3 h-32 font-mono text-xs leading-relaxed text-neutral-400 focus:text-neutral-200"
                      />
                    </div>
                    <button 
                      onClick={handleAddProxy}
                      className="w-full h-14 bg-white text-neutral-950 hover:bg-neutral-200 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                    >
                      Авторизовать узел
                    </button>
                    <p className="text-[10px] text-neutral-600 text-center uppercase tracking-tighter">
                      Все ключи хранятся локально в кэше приложения
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">Активные ноды</h3>
                  {proxies.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-2xl p-16 text-center text-neutral-700 italic">
                      Нет активных подключений.
                    </div>
                  ) : (
                    proxies.map(p => (
                      <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between group hover:border-neutral-700 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500">
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-neutral-200">{p.name}</p>
                            <p className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-500 transition-colors uppercase">{p.type} KEY</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                          <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">Онлайн</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "results" && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">База разведданных</h3>
                  <button 
                    onClick={handleExport}
                    className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl px-5 py-3 text-xs font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    Скачать в CSV
                  </button>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-800/30 text-[10px] uppercase font-bold text-neutral-500 tracking-widest border-b border-neutral-800">
                          <th className="px-6 py-5">Тип</th>
                          <th className="px-6 py-5">Значение</th>
                          <th className="px-6 py-5">Источник</th>
                          <th className="px-6 py-5">Дата</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {results.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-neutral-700 italic text-sm">Данные еще не собраны...</td>
                          </tr>
                        ) : (
                          results.map((r, i) => (
                            <motion.tr 
                              key={r.id} 
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(i * 0.05, 1) }}
                              className="hover:bg-neutral-800/20 transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter shadow-sm",
                                  r.type === "Email" ? "bg-blue-500/10 text-blue-400" :
                                  r.type === "Telegram" ? "bg-indigo-500/10 text-indigo-400" :
                                  r.type === "WhatsApp" ? "bg-green-500/10 text-green-400" :
                                  "bg-neutral-800 text-neutral-400"
                                )}>{r.type}</span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-neutral-300 font-mono tracking-tight">{r.value}</td>
                              <td className="px-6 py-4">
                                <a href={r.source} target="_blank" className="text-[10px] text-neutral-500 hover:text-indigo-400 flex items-center gap-2 transition-colors">
                                  Сайт-источник <Search className="w-3 h-3" />
                                </a>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-mono text-neutral-600">{r.foundAt}</td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
        active ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20" : "text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-transform group-active:scale-95", active && "text-indigo-400")}>{icon}</span>
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </div>
      {count !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-lg",
          active ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-500"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all hover:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{title}</h4>
        <div className="bg-neutral-800 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tighter text-neutral-100">{value}</div>
    </div>
  );
}
