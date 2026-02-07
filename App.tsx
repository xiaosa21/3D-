// App.tsx
import React, { useState, useEffect } from 'react';
import { CameraParams, GenerationResult } from './types';
import { ThreeScene } from './components/ThreeScene';
import { generateProfessionalPrompt } from './services/promptService';
// 引入新的 Service
import { generateImageWithNano } from './services/geminiService';
import { 
  RotateCw, Copy, Check, Image as ImageIcon,
  Zap, Trash2, Lock, Unlock, RefreshCcw,
  Download, KeyRound, Eye, EyeOff, Sliders
} from 'lucide-react';

const DEFAULT_PARAMS: CameraParams = {
  horizontalAngle: -45,
  verticalAngle: 15,
  distance: 6.5,
  zoom: 1.0,
  tilt: 0,
  quality: '2K',
  aspectRatio: '1:1'
};

const App: React.FC = () => {
  const [params, setParams] = useState<CameraParams>({ ...DEFAULT_PARAMS });
  const [isLocked, setIsLocked] = useState(false);
  // 移除 theme state，强制亮色
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [copied, setCopied] = useState(false);
  
  // 新增：重绘幅度 (Strength)
  const [strength, setStrength] = useState(0.75);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('photo_sim_results');
    if (saved) setResults(JSON.parse(saved));
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('photo_sim_results', JSON.stringify(results));
  }, [results]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value.trim();
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
    if (!apiKey) return alert("请配置 API Key。");

    setIsGenerating(true);
    try {
      // 调用新的 Nano Service
      const newImageUrl = await generateImageWithNano(
        apiKey, 
        sourceImage, 
        bilingualPrompt.en, // 使用英文 Prompt
        strength,           // 传入重绘幅度
        params.aspectRatio,
        params.quality
      );
      
      const newResult = { imageUrl: newImageUrl, prompt: bilingualPrompt.en, timestamp: Date.now() };
      setResults(prev => [newResult, ...prev].slice(0, 10));
    } catch (error: any) {
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 强制亮色主题配色变量
  const themeClasses = {
    bg: 'bg-gray-50', // 整体背景：极浅灰，比纯白更有质感
    textMain: 'text-gray-900', // 主文字：深黑
    textSub: 'text-gray-500', // 副文字
    border: 'border-gray-300', // 边框：加深，更清晰
    cardBg: 'bg-white', // 卡片背景：纯白
    accent: 'text-indigo-600', // 强调色
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    inputBg: 'bg-white',
  };

  return (
    <div className={`flex h-screen w-screen transition-all font-sans overflow-hidden ${themeClasses.bg} ${themeClasses.textMain}`}>
      
      {/* 左侧资源区 */}
      <aside className={`w-[340px] border-r flex flex-col ${themeClasses.cardBg} ${themeClasses.border} shadow-sm z-10`}>
        
        {/* Header */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-indigo-200 shadow-lg" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Nano Studio / Assets</h2>
          </div>
          
          {/* Asset Dropzone */}
          <div className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all ${sourceImage ? 'border-transparent' : 'border-gray-300 bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50/30'}`}>
            {sourceImage ? (
              <>
                <img src={sourceImage} className="w-full h-full object-contain p-4" alt="Source" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => setSourceImage(null)} className="p-3 bg-white text-red-500 rounded-xl shadow-lg hover:scale-110 transition-transform">
                    <Trash2 size={18} />
                  </button>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                <div className="mb-4 p-4 rounded-full bg-indigo-50 text-indigo-500"><ImageIcon size={24} /></div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-center">点击上传产品原图</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            )}
          </div>

          {/* API Key Panel */}
          <div className={`p-4 rounded-xl border ${themeClasses.border} ${themeClasses.inputBg} shadow-sm`}>
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                 <KeyRound size={12} /> API Access
               </div>
               {apiKey && <Check size={14} className="text-emerald-500" />}
             </div>
             
             <div className="relative">
               <input 
                 type={showKey ? "text" : "password"}
                 value={apiKey}
                 onChange={handleKeyChange}
                 placeholder="输入 Nano API Key"
                 className="w-full bg-transparent text-[11px] font-mono outline-none py-2 pr-8 border-b border-gray-200 focus:border-indigo-600 text-gray-800 placeholder-gray-300 transition-colors"
               />
               <button 
                 onClick={() => setShowKey(!showKey)}
                 className="absolute right-0 top-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
               >
                 {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
               </button>
             </div>
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100 bg-gray-50/50">
          <div className="p-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <RotateCw size={12} /> Render History
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {results.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                 <div className="w-12 h-1 border-2 border-dashed border-gray-300 w-8" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">暂无记录</span>
               </div>
            ) : results.map((res) => (
              <div key={res.timestamp} className="group rounded-xl border border-gray-200 bg-white p-2 shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[4/3] rounded-lg overflow-hidden relative mb-2 bg-gray-100">
                  <img src={res.imageUrl} className="w-full h-full object-cover" alt="Result" />
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = res.imageUrl;
                    link.download = `Nano_Render_${res.timestamp}.png`;
                    link.click();
                  }} className="absolute top-2 right-2 p-2 bg-white text-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all transform scale-90 group-hover:scale-100">
                    <Download size={14} />
                  </button>
                </div>
                <div className="px-1 text-[9px] font-mono text-gray-400 truncate">{res.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 右侧核心区 */}
      <main className="flex-1 flex flex-col relative bg-gray-50">
        {/* 3D Viewport */}
        <div className="flex-1 m-6 mb-0 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden relative group">
          {/* 传递 forceLight=true 给 ThreeScene (如果 ThreeScene 里还有 dark 判断，请记得去那里也改成永远传 'light') */}
          <ThreeScene params={params} setParams={setParams} imageUrl={sourceImage} isLocked={isLocked} theme={'light'} />
          
          <div className="absolute top-6 right-6 flex gap-3">
            <button onClick={() => setIsLocked(!isLocked)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all backdrop-blur-md shadow-sm ${isLocked ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white/80 border-gray-200 text-gray-500 hover:text-gray-900'}`}>
              {isLocked ? <Lock size={12} /> : <Unlock size={12} />} {isLocked ? '锁定视角' : '调整视角'}
            </button>
            <button onClick={() => setParams({...DEFAULT_PARAMS})} disabled={isLocked} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-200 bg-white/80 backdrop-blur-md text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
              <RefreshCcw size={12} /> 复位
            </button>
          </div>
        </div>

        {/* Control Center */}
        <div className={`p-8 space-y-6 transition-all duration-500 ${isLocked ? 'opacity-50 grayscale-[0.5] pointer-events-none' : 'opacity-100'}`}>
          
          {/* Slider Controls Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            {/* Horizontal */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">水平视角 (H)</label>
                <span className="text-indigo-600 font-mono text-[12px] font-bold bg-indigo-50 px-2 py-0.5 rounded">{params.horizontalAngle}°</span>
              </div>
              <input type="range" min="-180" max="180" value={params.horizontalAngle} onChange={e => setParams({...params, horizontalAngle: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            {/* Vertical */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">垂直机位 (V)</label>
                <span className="text-indigo-600 font-mono text-[12px] font-bold bg-indigo-50 px-2 py-0.5 rounded">{params.verticalAngle}°</span>
              </div>
              <input type="range" min="-90" max="90" value={params.verticalAngle} onChange={e => setParams({...params, verticalAngle: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            {/* Distance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">拍摄距离 (DIST)</label>
                <span className="text-indigo-600 font-mono text-[12px] font-bold bg-indigo-50 px-2 py-0.5 rounded">{Math.round(params.distance * 10)}mm</span>
              </div>
              <input type="range" min="4" max="20" step="0.1" value={params.distance} onChange={e => setParams({...params, distance: parseFloat(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            {/* Zoom */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">焦距系数 (ZOOM)</label>
                <span className="text-indigo-600 font-mono text-[12px] font-bold bg-indigo-50 px-2 py-0.5 rounded">{params.zoom.toFixed(1)}x</span>
              </div>
              <input type="range" min="0.5" max="3" step="0.1" value={params.zoom} onChange={e => setParams({...params, zoom: parseFloat(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>

          <div className="h-px bg-gray-200 w-full" />

          {/* Config Footer */}
          <div className="flex gap-6 items-end">
             {/* Strength Slider (New) */}
             <div className="w-48 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Sliders size={12}/> 重绘幅度</label>
                  <span className="text-indigo-600 font-mono text-[11px] font-bold">{strength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1.0" step="0.05" value={strength} onChange={e => setStrength(parseFloat(e.target.value))} className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
             </div>

            <div className="space-y-1.5 w-32">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">画幅</label>
              <select value={params.aspectRatio} onChange={e => setParams({...params, aspectRatio: e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[11px] font-bold outline-none focus:border-indigo-600 bg-white text-gray-700 shadow-sm">
                <option value="1:1">1:1 正方形</option>
                <option value="3:4">3:4 人像</option>
                <option value="4:3">4:3 风景</option>
                <option value="9:16">9:16 Story</option>
              </select>
            </div>
            
            <div className="rounded-xl p-3 flex-1 flex items-center justify-between border border-gray-200 bg-white shadow-sm">
              <div className="overflow-hidden flex-1 mr-4">
                <h3 className="text-[8px] font-bold text-indigo-500 uppercase mb-1 font-mono tracking-widest">Generated Prompt</h3>
                <p className="font-mono text-[10px] truncate leading-none text-gray-600 select-all">{bilingualPrompt.en}</p>
              </div>
              <button onClick={() => {navigator.clipboard.writeText(bilingualPrompt.en); setCopied(true); setTimeout(() => setCopied(false), 2000)}} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !sourceImage} 
              className={`w-64 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-200 ${
                isGenerating || !sourceImage 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-300'
              }`}
            >
              {isGenerating ? <RotateCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
              {isGenerating ? 'Rendering...' : `GENERATE IMAGE`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;