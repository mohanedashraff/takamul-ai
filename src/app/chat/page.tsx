"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, MessageSquare, Settings, Search, Paperclip, Mic, Send, 
  Sparkles, Terminal, FileText, Image as ImageIcon, ChevronDown, Check,
  MoreVertical, Share, Trash2, ArrowRight, PanelRightClose, PanelRightOpen
} from "lucide-react";

const MODELS = [
  { id: "claude-3-5", name: "Claude 3.5 Sonnet", desc: "أسرع وأذكى موديل للبرمجة والتحليل", icon: "✨", color: "text-accent-400" },
  { id: "gpt-4o", name: "GPT-4o", desc: "نموذج OpenAI المتقدم المتعدد الوسائط", icon: "🧠", color: "text-green-400" },
  { id: "gemini-1-5", name: "Gemini 1.5 Pro", desc: "نافذة سياق ضخمة تصل لـ 2 مليون توكن", icon: "⚡", color: "text-blue-400" },
  { id: "llama-3", name: "Llama 3 (70B)", desc: "مفتوح المصدر وسريع جداً للمهام العامة", icon: "🦙", color: "text-orange-400" },
];

const SUGGESTIONS = [
  { icon: Terminal, title: "كتابة سكريبت بايثون", desc: "لتحليل البيانات من ملف CSV" },
  { icon: FileText, title: "تلخيص مستند", desc: "استخراج النقاط الرئيسية من التقرير" },
  { icon: Sparkles, title: "عصف ذهني", desc: "أفكار لحملة تسويقية جديدة" },
  { icon: ImageIcon, title: "تحليل صورة", desc: "استخراج النصوص ووصف المحتوى" },
];

const HISTORY = [
  { id: 1, title: "تحليل بيانات السوق لتطبيق الذكاء الاصطناعي", time: "اليوم" },
  { id: 2, title: "كتابة كود React لصفحة الهبوط", time: "أمس" },
  { id: 3, title: "نقاش حول فيزياء الكم والجاذبية", time: "منذ 3 أيام" },
  { id: 4, title: "خطة التدريب الرياضي لمدة شهر", time: "الأسبوع الماضي" },
];

export default function ChatPage() {
  const router = useRouter();
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]); // To be implemented later

  return (
    <div className="h-screen w-full bg-[#050508] overflow-hidden flex flex-col font-sans" dir="rtl">
      
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ====== FLOATING BACK BUTTON ====== */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => router.push("/")}
            className="p-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all group pointer-events-auto"
            title="العودة للصفحة الرئيسية"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* ====== FLOATING OPEN SIDEBAR BUTTON ====== */}
        <div className={`absolute top-4 right-4 z-40 transition-all duration-500 ease-out flex ${sidebarOpen ? 'opacity-0 pointer-events-none translate-x-8' : 'opacity-100 pointer-events-auto translate-x-0'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] shadow-2xl rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all group lg:flex hidden items-center gap-2"
            title="إظهار القائمة الجانبية"
          >
            <PanelRightOpen className="w-5 h-5 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* ====== FLOATING RIGHT SIDEBAR (Chat History) ====== */}
        <div className={`absolute top-4 bottom-4 z-40 w-[280px] bg-[#111118]/80 backdrop-blur-3xl border border-white/[0.04] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex-col hidden lg:flex overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${sidebarOpen ? 'right-4 opacity-100 translate-x-0' : '-right-[320px] opacity-0 translate-x-10 pointer-events-none'}`}>
          <div className="p-4 pl-2 flex items-center justify-between gap-2">
            <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white shadow-sm rounded-xl py-3 px-4 flex items-center justify-between transition-all group">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center p-0.5">
                   <Plus className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-bold text-sm">محادثة جديدة</span>
               </div>
            </button>
            <button 
               onClick={() => setSidebarOpen(false)}
               className="p-3 shrink-0 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-colors text-white/50 hover:text-white"
               title="إخفاء القائمة"
            >
               <PanelRightClose className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-500 absolute right-3" />
              <input 
                type="text" 
                placeholder="ابحث في المحادثات..." 
                className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pr-9 pl-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-all font-light"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
            <div>
              <h3 className="text-[11px] font-bold text-gray-500 px-3 pb-2 uppercase tracking-widest">المحادثات السابقة</h3>
              <div className="space-y-0.5">
                {HISTORY.map((chat) => (
                  <button key={chat.id} className="w-full flex items-center justify-between text-right px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-primary-400 shrink-0 transition-colors" />
                      <span className="text-sm truncate">{chat.title}</span>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0a0a0f]">
            <button className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-semibold">إعدادات الحساب</span>
            </button>
          </div>
        </div>

        {/* ====== MAIN CHAT AREA ====== */}
        <div className={`flex-1 flex flex-col relative overflow-hidden bg-bg-primary h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${sidebarOpen ? 'lg:pr-[300px]' : 'lg:pr-0'}`}>
          
          {/* Subtle Ambient Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[150px] pointer-events-none" />


          {/* Chat Messages Area (Empty State for now) */}
          <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col custom-scrollbar">
            <div className="flex-1 flex flex-col items-center gap-8 justify-center min-h-[400px] p-6">
               <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center shadow-[0_0_40px_rgba(157,78,221,0.3)] animate-pulse-slow">
                 <Sparkles className="w-8 h-8 text-white" />
               </div>
               <div className="text-center">
                 <h2 className="text-3xl font-black text-white mb-2">كيف يمكنني مساعدتك اليوم؟</h2>
                 <p className="text-gray-400">أنا <strong className="text-white">{activeModel.name}</strong>، مساعدك الذكي عبر منصة تكامل.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-4">
                  {SUGGESTIONS.map((sug, i) => (
                    <button key={i} className="flex flex-col text-right p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                       <sug.icon className="w-5 h-5 text-gray-400 group-hover:text-accent-400 mb-3 transition-colors" />
                       <span className="text-sm font-bold text-white mb-1">{sug.title}</span>
                       <span className="text-xs text-gray-400">{sug.desc}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 w-full max-w-4xl mx-auto z-10 shrink-0">
             <div className="relative group">
                {/* Glow behind input */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col focus-within:border-white/20 transition-all p-2">
                  
                  {/* Model Selector Pill inside Input */}
                  <div className="relative mb-2 px-2 pt-2">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <span className="text-base leading-none">{activeModel.icon}</span>
                      <span className="text-xs font-bold text-white">{activeModel.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-[280px] bg-[#111118] border border-white/10 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1">
                        {MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => { setActiveModel(model); setIsModelDropdownOpen(false); }}
                            className={`w-full text-right flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors ${activeModel.id === model.id ? 'bg-primary-500/10' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                               <span className="text-2xl leading-none">{model.icon}</span>
                               <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-bold text-white">{model.name}</span>
                                  <span className="text-[11px] text-gray-400 font-light">{model.desc}</span>
                               </div>
                            </div>
                            {activeModel.id === model.id && <Check className="w-4 h-4 text-primary-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`أرسل رسالة إلى ${activeModel.name}...`}
                    className="w-full bg-transparent border-none text-white placeholder-gray-500 text-base max-h-[200px] min-h-[50px] resize-none focus:outline-none px-4 custom-scrollbar"
                    style={{ fieldSizing: "content" } as any}
                  />
                  
                  <div className="flex items-center justify-between p-3 border-t border-white/5">
                     <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="إرفاق ملف">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-accent-400 rounded-full hover:bg-white/10 transition-colors" title="إدخال صوتي">
                          <Mic className="w-5 h-5" />
                        </button>
                     </div>
                     <button 
                       className={`p-2.5 rounded-full flex items-center justify-center transition-all ${message.trim() ? 'bg-white text-black shadow-lg hover:scale-105' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                       disabled={!message.trim()}
                     >
                       <Send className="w-4 h-4 rtl:-scale-x-100 translate-x-[-1px] translate-y-[1px]" />
                     </button>
                  </div>
                </div>
             </div>
             <div className="text-center mt-3">
               <span className="text-[10px] text-gray-500">يمكن للذكاء الاصطناعي ارتكاب الأخطاء. يرجى التحقق من المعلومات الهامة.</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
