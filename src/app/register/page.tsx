"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Terminal, Mail, Lock, User, ArrowRight, Layers, LayoutGrid, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen bg-bg-primary overflow-hidden">
      
      {/* ─── 1. RIGHT PANEL (AUTH FORM) ─── */}
      <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col justify-between px-8 py-10 md:px-16 border-l border-white/5 relative z-10 bg-bg-primary">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-neon-pink/50">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-400 to-neon-pink opacity-20" />
              <Terminal className="w-5 h-5 text-white relative z-10" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">تكامل<span className="text-neon-pink">.</span></span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-12">
          <h1 className="text-3xl font-black text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-400 text-sm mb-10">ابدأ رحلتك في بناء وتوليد إبداعاتك باستخدام أحدث النماذج.</p>
          
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 ml-1">الاسم الكامل</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full h-14 bg-black/50 border border-white/10 rounded-xl pr-12 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50 transition-all text-right"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 ml-1">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-14 bg-black/50 border border-white/10 rounded-xl pr-12 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50 transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 ml-1">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-black/50 border border-white/10 rounded-xl pr-12 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50 transition-all text-left tracking-widest"
                  dir="ltr"
                />
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full h-14 mt-4 bg-white text-black font-black text-base hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-xl"
            >
              إنشاء مساحة العمل
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative bg-bg-primary px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">أو عبر</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center justify-center gap-3 h-14 bg-[#111115] hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all font-bold text-sm text-gray-300 hover:text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-3 h-14 bg-[#111115] hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all font-bold text-sm text-gray-300 hover:text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Github
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 font-bold">
          لديك حساب مسبقاً؟ <Link href="/login" className="text-white hover:text-neon-pink underline decoration-white/20 transition-colors">دخول للوحة التحكم</Link>
        </p>
      </div>

      {/* ─── 2. LEFT PANEL (SHOWCASE DYNAMIC GRID) ─── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-20 bg-[#020204]">
        
        <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold z-50">
          <ArrowRight className="w-4 h-4" /> صفحة الغلاف
        </Link>
        
        {/* Massive Animated Gradients backdrop */}
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-primary-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-accent-400/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse" />

        {/* The Grid / Matrix Dots */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:30px_30px]" />

        {/* Floating Widgets Container */}
        <div className="relative w-full max-w-2xl aspect-square">
          
          {/* Main Central Sphere / Core */}
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/10 blur-[1px] bg-gradient-to-tr from-black to-primary-900/50 shadow-[0_0_100px_rgba(241,91,181,0.15)] flex items-center justify-center backdrop-blur-md"
          >
            <div className="w-56 h-56 rounded-full border border-neon-pink/20 bg-neon-pink/5 flex items-center justify-center animate-pulse">
              <Layers className="w-20 h-20 text-neon-pink" />
            </div>
          </motion.div>

          {/* Floating Widget 1: System Sync */}
          <motion.div 
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] w-64 glass-card p-5 border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent-400/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-400" />
              </div>
              <div className="text-sm font-bold text-white">تزامن الوكلاء</div>
            </div>
            <p className="text-xs text-gray-400 pl-11 mb-3">ربط مع أكثر من 120 نموذج لغوي في نفس مساحة العمل.</p>
            <div className="flex gap-2 pl-11">
              <div className="w-1/3 h-1.5 bg-accent-400 rounded-full" />
              <div className="w-1/3 h-1.5 bg-accent-400/50 rounded-full" />
              <div className="w-1/3 h-1.5 bg-accent-400/20 rounded-full" />
            </div>
          </motion.div>

          {/* Floating Widget 2: UI Generative Grid */}
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[25%] left-[25%] w-72 glass-card p-5 border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-neon-pink" />
                <span className="text-xs font-bold text-gray-400">Generative UI Render</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
              <div className="h-12 bg-white/5 rounded-lg border border-white/5 animate-pulse" style={{ animationDelay: "200ms"}} />
              <div className="h-12 bg-white/5 rounded-lg border border-white/5 animate-pulse" style={{ animationDelay: "400ms"}} />
              <div className="h-12 col-span-2 bg-gradient-to-r from-neon-pink/20 to-transparent rounded-lg border border-neon-pink/20" />
              <div className="h-12 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
