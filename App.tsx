import React, { useState, useEffect } from 'react';
import { CameraParams, GenerationResult } from './types';
import { ThreeScene } from './components/ThreeScene';
import { generateProfessionalPrompt } from './services/promptService';
import { generateImageWithGemini } from './services/geminiService';
import { 
  RotateCw, Copy, Check, Image as ImageIcon,
  Zap, Trash2, Lock, Unlock, RefreshCcw,
  Download, Sun, Moon, KeyRound, Eye, EyeOff
} from 'lucide-react';

const DEFAULT_PARAMS: CameraParams = {
  horizontalAngle: -45,
  verticalAngle: 15,
  distance: 6.5,
  zoom: 1.0,
  tilt: 0,
  quality: '4K',
  aspectRatio: '1:1'
};

const App: React.FC = () => {
  const [params, setParams] = useState<CameraParams>({ ...DEFAULT_PARAMS });
  const [isLocked, setIsLocked] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [copied, setCopied] = useState(false);
  
  // --- 新增：API Key 管理逻辑 ---
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false); // 控制密码显示/隐藏

  useEffect(() => {
    // 1. 读取历史记录
    const saved = localStorage.getItem('photo_sim_results');
    if (saved) setResults(JSON.parse(saved));
    
    // 2. 读取主题
    const savedTheme = localStorage.getItem('ui_theme') as any;
    if (savedTheme) setTheme(savedTheme || 'dark');

    // 3. 读取本地保存的 API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('photo_sim_results', JSON.stringify(results));
    localStorage.setItem('ui_theme', theme);
  }, [results, theme]);

  // 当用户输入 Key 时，自动保存到本地
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
  };

  const bilingualPrompt = generateProfessionalPrompt(params);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSourceImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return alert("请先上传素材图片。");
    if (!apiKey) return alert("请在左侧设置中输入您的 Google API Key。"); // 校验 Key

    setIsGenerating(true);
    try {
      // 将 apiKey 传给 Service
      const newImageUrl = await generateImageWithGemini(
        apiKey, 
        sourceImage, 
        bilingualPrompt.en, 
        params.quality, 
        params.aspectRatio
      );
      const newResult = { imageUrl: newImageUrl, prompt: bilingualPrompt.en, timestamp: Date.now() };
      setResults(prev => [newResult, ...prev].slice(0, 10));
    } catch (error: any) {
      alert(`渲染失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen w-screen transition-all duration-700 font-sans overflow-hidden ${isDark ? 'bg-[#02040a] text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      {/* 左侧资源区 (Side Deck) */}
      <aside className={`w-[320px] border-r flex flex-col transition-colors ${isDark ? 'bg-[#0b0e14]/50 border-white/5' : 'bg-white border-slate-200'}`}>
        
        {/* Header Section */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>素材管理 / Assets</h2>
            </div>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-white/20' : 'hover:bg-slate-100 text-slate-400'}`}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          
          {/* Asset Dropzone */}
          <div className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all ${isDark ? 'bg-black/20 border-white/5 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-500'}`}>
            {sourceImage ? (
              <>
                <img src={sourceImage} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" alt="Source" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button onClick={() => setSourceImage(null)} className="p-2.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/40 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer opacity-30 hover:opacity-100 transition-opacity">
                <div className="mb-3 p-3 rounded-full bg-current/5"><ImageIcon size={20} /></div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-center px-4">点击或拖拽上传原始文件</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            )}
          </div>

          {/* --- 修改后的 API Key 输入面板 --- */}
          <div className={`p-4 rounded-xl border transition-all ${isDark ? 'bg-black/30 border-white/5 focus-within:border-indigo-500/50' : 'bg-slate-100/50 border-slate-200 focus-within:border-indigo-500'}`}>
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">
                 <KeyRound size={12} /> API Configuration
               </div>
               {apiKey && <Check size={12} className="text-emerald-500" />}
             </div>
             
             <div className="relative">
               <input 
                 type={showKey ? "text" : "password"}
                 value={apiKey}
                 onChange={handleKeyChange}
                 placeholder="输入您的 Google Gemini API Key"
                 className={`w-full bg-transparent text-[10px] font-mono outline-none py-2 pr-8 border-b ${isDark ? 'border-white/10 text-white focus:border-indigo-500' : 'border-slate-300 text-slate-700 focus:border-indigo-500'}`}
               />
               <button 
                 onClick={() => setShowKey(!showKey)}
                 className="absolute right-0 top-1.5 opacity-40 hover:opacity-100 transition-opacity"
               >
                 {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
               </button>
             </div>

             <p className="text-[8px] mt-2 opacity-30 italic leading-relaxed">
               Key 仅存储在您的本地浏览器中。获取 Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-400">Google AI Studio</a>
             </p>
          </div>
        </div>

        {/* History Section (保持不变) */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-current/5">
          <div className="p-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <RotateCw size={12} /> 渲染历史
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {results.length === 0 ? (
               <div className="h-full flex items-center justify-center opacity-10 text-[10px] font-bold uppercase tracking-widest italic">暂无记录</div>
            ) : results.map((res) => (
              <div key={res.timestamp} className={`group rounded-lg border p-1.5 transition-all ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                <div className="aspect-[4/3] rounded-md overflow-hidden relative mb-2">
                  <img src={res.imageUrl} className="w-full h-full object-cover" alt="Result" />
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = res.imageUrl;
                    link.download = `Render_${res.timestamp}.png`;
                    link.click();
                  }} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 hover:bg-indigo-600 transition-all">
                    <Download size={12} />
                  </button>
                </div>
                <div className="px-1 text-[8px] font-mono text-indigo-400/60 truncate">{res.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 右侧核心区 (保持不变) */}
      <main className="flex-1 flex flex-col relative">
        <div className={`flex-1 m-8 mb-0 rounded-2xl border overflow-hidden relative group transition-all duration-1000 ${isDark ? 'border-white/5 bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)]' : 'border-slate-200 bg-white shadow-xl'}`}>
          <ThreeScene params={params} setParams={setParams} imageUrl={sourceImage} isLocked={isLocked} theme={theme} />
          <div className="absolute top-6 right-6 flex gap-3">
            <button onClick={() => setIsLocked(!isLocked)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all backdrop-blur-md ${isLocked ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-black/40 border-white/10 text-white/50 hover:bg-black/60'}`}>
              {isLocked ? <Lock size={12} /> : <Unlock size={12} />} {isLocked ? '已锁定视角' : '锁定视角'}
            </button>
            <button onClick={() => setParams({...DEFAULT_PARAMS})} disabled={isLocked} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-black/40 backdrop-blur-md text-white/50 hover:bg-black/60 transition-all disabled:opacity-20">
              <RefreshCcw size={12} /> 复位
            </button>
          </div>
        </div>

        <div className={`p-8 space-y-8 transition-all duration-500 ${isLocked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-2 gap-x-16 gap-y-6">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">水平视角 (HORIZONTAL)</label>
                <span className="text-indigo-400 font-mono text-[11px] font-bold">{params.horizontalAngle}°</span>
              </div>
              <input type="range" min="-180" max="180" value={params.horizontalAngle} onChange={e => setParams({...params, horizontalAngle: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">垂直机位 (VERTICAL)</label>
                <span className="text-indigo-400 font-mono text-[11px] font-bold">{params.verticalAngle}°</span>
              </div>
              <input type="range" min="-90" max="90" value={params.verticalAngle} onChange={e => setParams({...params, verticalAngle: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">模拟工作距离 (DISTANCE)</label>
                <span className="text-indigo-400 font-mono text-[11px] font-bold">{Math.round(params.distance * 10)}mm 等效</span>
              </div>
              <input type="range" min="4" max="20" step="0.1" value={params.distance} onChange={e => setParams({...params, distance: parseFloat(e.target.value)})} className="w-full" />
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">数字视野放大 (ZOOM)</label>
                <span className="text-indigo-400 font-mono text-[11px] font-bold">{params.zoom.toFixed(1)}x</span>
              </div>
              <input type="range" min="0.5" max="3" step="0.1" value={params.zoom} onChange={e => setParams({...params, zoom: parseFloat(e.target.value)})} className="w-full" />
            </div>
          </div>

          <div className="flex gap-8 items-center pt-6 border-t border-white/5">
            <div className="flex-1 flex gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[9px] font-bold text-white/10 uppercase tracking-widest">渲染画幅</label>
                <select value={params.aspectRatio} onChange={e => setParams({...params, aspectRatio: e.target.value as any})} className={`w-full border rounded-lg px-3 py-2 text-[10px] font-bold outline-none transition-all ${isDark ? 'bg-white/[0.03] border-white/10 text-white/60 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <option value="1:1">1:1 正方形</option>
                  <option value="3:4">3:4 人像</option>
                  <option value="4:3">4:3 风景</option>
                  <option value="9:16">9:16 短视频</option>
                  <option value="16:9">16:9 电影级</option>
                </select>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[9px] font-bold text-white/10 uppercase tracking-widest">模型质量</label>
                <select value={params.quality} onChange={e => setParams({...params, quality: e.target.value as any})} className={`w-full border rounded-lg px-3 py-2 text-[10px] font-bold outline-none transition-all ${isDark ? 'bg-white/[0.03] border-white/10 text-white/60 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <option value="1K">1024px 标准</option>
                  <option value="2K">2048px 高清</option>
                  <option value="4K">4096px 极致</option>
                </select>
              </div>
            </div>
            
            <div className={`rounded-xl p-3 flex-1 flex items-center justify-between border ${isDark ? 'bg-black/40 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
              <div className="overflow-hidden flex-1 mr-4">
                <h3 className="text-[8px] font-bold text-indigo-500/50 uppercase mb-1 font-mono tracking-widest">Perspective Prompt (EN)</h3>
                <p className={`font-mono text-[10px] truncate leading-none ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{bilingualPrompt.en}</p>
              </div>
              <button onClick={() => {navigator.clipboard.writeText(bilingualPrompt.en); setCopied(true); setTimeout(() => setCopied(false), 2000)}} className="p-2 transition-colors hover:text-indigo-500 opacity-40">
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !sourceImage || !apiKey} 
            className={`group relative w-full py-4.5 rounded-xl font-bold text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all active:scale-[0.99] shadow-2xl ${
              isGenerating || !sourceImage || !apiKey
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5' 
              : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
            }`}
          >
            {isGenerating ? <RotateCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
            {isGenerating ? '正在重塑光影与透视...' : `执行 ${params.quality} 级商业重绘 (EXECUTE RENDER)`}
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;