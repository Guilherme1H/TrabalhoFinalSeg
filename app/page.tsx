"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import {
  PlusCircle,
  Clock,
  Utensils,
  TrendingUp,
  AlertCircle,
  Trash2,
  Calendar,
  Settings,
  LogOut,
  Download,
  LogIn,
} from "lucide-react";

export default function FitTrackApp() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    setMounted(true);
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const qMeals = query(
          collection(db, "meals"),
          where("userId", "==", u.uid)
        );
        const unsubMeals = onSnapshot(qMeals, (snap) => {
          setMeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsubMeals();
      }
    });
    return () => unsubAuth();
  }, []);

  if (!mounted) return null;

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleLogout = () => signOut(auth);

  const exportData = () => {
    const data = JSON.stringify({ meals, dailyGoal }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fit-track-data.json`;
    link.click();
  };

  const addMeal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addDoc(collection(db, "meals"), {
      userId: user.uid,
      date: `${fd.get("date")}T${fd.get("time")}`,
      description: fd.get("description"),
      calories: Number(fd.get("calories")),
      type: fd.get("type"),
    });
    setShowMealModal(false);
  };

  const deleteMeal = async (id: string) => {
    if (confirm("Deseja excluir este registro?")) {
      await deleteDoc(doc(db, "meals", id));
    }
  };

  const filteredMeals = meals.filter((m) => m.date.startsWith(filterDate));
  const totalCalsOnDate = filteredMeals.reduce((acc, m) => acc + m.calories, 0);

  const getChartData = () => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      return {
        day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
        fullDate: ds,
        cals: meals
          .filter((m) => m.date.startsWith(ds))
          .reduce((acc, m) => acc + m.calories, 0),
      };
    });
  };

  if (!user)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mb-8 flex items-center justify-center text-white text-4xl font-black">
          G
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tighter">
          FitTrack TSI
        </h1>
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white border-2 border-slate-200 px-10 py-4 rounded-2xl font-black hover:bg-slate-50 transition shadow-sm"
        >
          <LogIn size={20} /> Entrar com Google
        </button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <img src={user.photoURL} className="w-12 h-12 rounded-2xl" />
          <div>
            <h1 className="text-xl font-black">{user.displayName}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase">
              TSI Senac • Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={exportData}
            className="p-3 text-slate-300 hover:text-indigo-600 transition"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="p-3 text-slate-300 hover:text-rose-500 transition"
          >
            <LogOut size={20} />
          </button>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 ml-2">
            <Calendar size={18} className="text-indigo-500 ml-2" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-black text-slate-700 p-1"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <Utensils className="text-indigo-500" size={24} />
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-slate-300 hover:text-indigo-500 transition"
            >
              <Settings size={18} />
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Calorias Hoje
          </p>
          <h2 className="text-4xl font-black my-1">
            {totalCalsOnDate}{" "}
            <span className="text-sm font-bold text-slate-300">
              / {dailyGoal}
            </span>
          </h2>
          <div className="h-2 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                totalCalsOnDate > dailyGoal ? "bg-rose-500" : "bg-indigo-500"
              }`}
              style={{
                width: `${Math.min((totalCalsOnDate / dailyGoal) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Clock className="text-emerald-500 mb-4" size={24} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Jejum
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {["16:8", "18:6", "20:4", "24h"].map((t) => (
              <button
                key={t}
                className="py-2 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition text-[10px] uppercase"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <TrendingUp className="text-amber-500 mb-4" size={24} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Atividade Semanal
          </p>
          <div className="h-16 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <Bar
                  dataKey="cals"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                  onClick={(d: any) => setFilterDate(d.fullDate)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black uppercase tracking-[0.2em] text-xs">
              Progresso
            </h3>
            <button
              onClick={() => setShowMealModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl transition shadow-indigo-100"
            >
              <PlusCircle size={18} /> Novo Registro
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
                  dy={10}
                />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                  }}
                />
                <ReferenceLine
                  y={dailyGoal}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="cals"
                  stroke="#4f46e5"
                  strokeWidth={5}
                  dot={{
                    r: 6,
                    fill: "#4f46e5",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black uppercase tracking-[0.2em] text-xs mb-8">
            Refeições de Hoje
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[350px] flex-1">
            {filteredMeals.length === 0 && (
              <p className="text-center py-20 text-slate-300 font-black uppercase text-[10px] italic">
                Vazio
              </p>
            )}
            {filteredMeals.map((m) => (
              <div
                key={m.id}
                className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:border-slate-200 border border-transparent transition"
              >
                <div>
                  <p className="font-bold text-sm">{m.description}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    {m.type} • {m.calories} kcal
                  </p>
                </div>
                <button
                  onClick={() => deleteMeal(m.id)}
                  className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-slate-500 flex flex-col md:flex-row gap-6 items-center">
        <AlertCircle className="text-indigo-500 shrink-0" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
          Este software é um protótipo acadêmico (TSI Senac). Não substitui
          orientação médica ou nutricional.
        </p>
      </footer>

      {showMealModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form
            onSubmit={addMeal}
            className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">
              Novo Registro
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="date"
                  type="date"
                  defaultValue={filterDate}
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                />
                <input
                  name="time"
                  type="time"
                  defaultValue="12:00"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                />
              </div>
              <input
                name="description"
                required
                placeholder="O que comeu?"
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="calories"
                  type="number"
                  required
                  placeholder="Kcal"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
                <select
                  name="type"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs uppercase tracking-widest"
                >
                  <option>Café</option>
                  <option>Almoço</option>
                  <option>Lanche</option>
                  <option>Jantar</option>
                  <option>Ceia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowMealModal(false)}
                className="flex-1 font-black text-slate-400 text-xs uppercase"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black mb-4 uppercase text-center tracking-tighter">
              Meta Diária
            </h2>
            <input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-black text-center text-3xl text-indigo-600"
            />
            <button
              onClick={() => setShowGoalModal(false)}
              className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
