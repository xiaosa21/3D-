// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CameraParams, GenerationResult } from './types';
import { ThreeScene } from './components/ThreeScene';
import { generateProfessionalPrompt } from './services/promptService';
// 确保这里引用的是上一轮提供的 Nano 版本的 geminiService
import { generateImageWithNano } from './services/geminiService';
import { 
  RotateCw, Check, Image as ImageIcon,
  Zap, Trash2, Lock, Unlock, RefreshCcw,
  Download, KeyRound, Eye, EyeOff, Sliders,
  Maximize, Minimize
} from 'lucide-react';

const DEFAULT_PARAMS: CameraParams = {
  horizontalAngle: 45, // 默认改为 45 度侧视图，更美观
  verticalAngle: 20,
  distance: 6.5,
  zoom: 1.0,
  tilt: 0,
  quality: '2K',
  aspectRatio: '1:1'
};

const App: React.FC = () => {
  const [params, setParams] = useState<CameraParams>({ ...DEFAULT_PARAMS });
  const [isLocked, setIsLocked] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [strength, setStrength] = useState(0.75);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

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

  // --- 核心修复：强制下载功能 ---
  const handleDownload = async (url: string) => {
    try {
      // 1. Fetch 图片数据
      const response = await fetch(url);
      const blob = await response.blob();
      // 2. 创建本地 Blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      // 3. 创建临时 A 标签触发下载
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `AI_Render_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      // 4. 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("下载失败，尝试直接打开", e);
      window.open(url, '_blank');
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return alert("请先在左上角上传图片");
    if (!apiKey) return alert("请输入 API Key");

    setIsGenerating(true);
    try {
      const newImageUrl = await generateImageWithNano(
        apiKey, 
        sourceImage, 
        bilingualPrompt.en, 
        strength,
        params.aspectRatio,
        params.quality
      );
      setCurrentResult(newImageUrl);
    } catch (error: any) {
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8F9FA] text-slate-800 font-sans p-6 overflow-y-auto">
      
      {/* 顶部 API Key 栏 (模仿参考图) */}
      <div className="max-w-[1600px] mx-auto mb-6 bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
          <KeyRound size={16} /> API Key
        </div>
        <div className="relative flex-1 max-w-lg">
           <input 
             type={showKey ? "text" : "password"}
             value={apiKey}
             onChange={handleKeyChange}
             placeholder="Paste your Nano Banana API Key here..."
             className="w-full bg-slate-50 text-xs font-mono outline-none py-2 px-4 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
           />
           <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2 text-slate-400 hover:text-indigo-600">
             {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
           </button>
        </div>
        <div className="text-[10px] text-slate-400">Your key is stored locally in your browser.</div>
      </div>

      {/* 主布局：左右分栏 */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* === 左侧：输入与控制区 (占 7 列) === */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 上半部分：原图 + 3D 视窗 */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col relative overflow-hidden">
            
            {/* 浮动的原图上传入口 (左上角) */}
            <div className="absolute top-4 left-4 z-10">
              <div className={`w-24 h-24 rounded-lg border-2 border-dashed bg-white shadow-lg overflow-hidden transition-all group hover:scale-105 ${sourceImage ? 'border-indigo-500' : 'border-slate-300'}`}>
                {sourceImage ? (
                  <div className="relative w-full h-full">
                    <img src={sourceImage} className="w-full h-full object-cover" />
                    <button onClick={() => setSourceImage(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50">
                    <ImageIcon size={20} />
                    <span className="text-[8px] mt-1 font-bold uppercase">Upload</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            {/* 3D 场景 */}
            <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative">
              <ThreeScene params={params} setParams={setParams} imageUrl={sourceImage} isLocked={isLocked} theme="light" />
              
              {/* 3D 控制按钮 */}
              <div className="absolute top-4 right-4 flex gap-2">
                 <button onClick={() => setIsLocked(!isLocked)} className="bg-white/90 p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />} {isLocked ? 'Locked' : 'Free View'}
                 </button>
                 <button onClick={() => setParams({...DEFAULT_PARAMS})} className="bg-white/90 p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 backdrop-blur-sm">
                    <RefreshCcw size={14} />
                 </button>
              </div>
            </div>
          </div>

          {/* 下半部分：参数控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            
            {/* 角度滑块组 */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <span>Azimuth (H)</span> <span className="text-indigo-600">{params.horizontalAngle}°</span>
                </div>
                <input type="range" min="-180" max="180" value={params.horizontalAngle} onChange={e => setParams({...params, horizontalAngle: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <span>Elevation (V)</span> <span className="text-indigo-600">{params.verticalAngle}°</span>
                </div>
                <input type="range" min="-90" max="90" value={params.verticalAngle} onChange={e => setParams({...params, verticalAngle: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            </div>

            {/* 选项组：找回了 Quality 选项 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
               {/* 1. 重绘幅度 */}
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Sliders size={10}/> Strength</label>
                 <div className="flex items-center gap-2">
                   <input type="range" min="0.1" max="1.0" step="0.05" value={strength} onChange={e => setStrength(parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded cursor-pointer accent-indigo-600" />
                   <span className="text-xs font-mono w-8">{strength.toFixed(2)}</span>
                 </div>
               </div>
               
               {/* 2. 清晰度 (Quality) - 恢复! */}
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-slate-400">Image Quality</label>
                 <select value={params.quality} onChange={e => setParams({...params, quality: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-2 outline-none focus:border-indigo-500">
                   <option value="1K">1K (Fast)</option>
                   <option value="2K">2K (Balanced)</option>
                   <option value="4K">4K (High Res)</option>
                 </select>
               </div>

               {/* 3. 画幅 */}
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-slate-400">Aspect Ratio</label>
                 <select value={params.aspectRatio} onChange={e => setParams({...params, aspectRatio: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-2 outline-none focus:border-indigo-500">
                   <option value="1:1">1:1 Square</option>
                   <option value="3:4">3:4 Portrait</option>
                   <option value="16:9">16:9 Landscape</option>
                 </select>
               </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !sourceImage}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                isGenerating || !sourceImage 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isGenerating ? <RotateCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor"/>}
              {isGenerating ? 'Processing...' : 'Generate New View'}
            </button>
          </div>
        </div>

        {/* === 右侧：结果展示区 (占 5 列) === */}
        <div className="lg:col-span-5 flex flex-col h-full">
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col">
              <div className="px-4 py-3 flex justify-between items-center border-b border-slate-50 mb-2">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Generated Result</h3>
                 {currentResult && (
                   <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">Success</span>
                 )}
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                 {currentResult ? (
                   <>
                     <img src={currentResult} className="w-full h-full object-contain" />
                     {/* 悬浮操作栏 */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={() => handleDownload(currentResult)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 text-xs font-bold"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button 
                          onClick={() => window.open(currentResult, '_blank')}
                          className="p-2 bg-white text-slate-600 rounded-full shadow-lg hover:scale-105 text-xs font-bold"
                        >
                          <Maximize size={14} />
                        </button>
                     </div>
                   </>
                 ) : (
                   <div className="text-center opacity-40">
                      <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-3 animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-widest">Waiting for render</p>
                   </div>
                 )}
              </div>

              {/* Prompt 预览 */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-mono text-slate-400 line-clamp-2 select-all">
                  {bilingualPrompt.en}
                </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;