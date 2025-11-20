
import React, { useState, useRef, useCallback } from 'react';
import { Download, RefreshCw, Wand2, Palette, Type, Settings2, Layout, Grid, ArrowRight, Sun, Moon, FileCode, Save, Upload } from 'lucide-react';
import { DEFAULT_LOGO_CONFIG, DEFAULT_LIGHT_COLORS, FONT_OPTIONS } from './constants';
import { LogoConfig, LogoColorConfig, DownloadFormat } from './types';
import { LogoRenderer } from './components/LogoRenderer';
import { generateLogoModification, generateLogoVariations } from './services/geminiService';

export default function App() {
  const [config, setConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG);
  const [lightColors, setLightColors] = useState<LogoColorConfig>(DEFAULT_LIGHT_COLORS);
  const [activeColorTab, setActiveColorTab] = useState<'dark' | 'light'>('dark');
  
  const [variations, setVariations] = useState<LogoConfig[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const darkSvgRef = useRef<SVGSVGElement>(null);
  const lightSvgRef = useRef<SVGSVGElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lightConfig: LogoConfig = {
    ...config,
    ...lightColors
  };

  const handleDownload = useCallback((format: DownloadFormat, variant: 'dark' | 'light') => {
    const svgElement = variant === 'dark' ? darkSvgRef.current : lightSvgRef.current;
    const currentConfig = variant === 'dark' ? config : lightConfig;

    if (!svgElement) return;

    const suffix = variant === 'light' ? '_light' : '_dark';

    if (format === DownloadFormat.SVG) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentConfig.textMain}_${currentConfig.textSecondary}${suffix}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === DownloadFormat.PNG) {
      const canvas = document.createElement('canvas');
      const scale = 4;
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width * scale;
      canvas.height = svgRect.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = currentConfig.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${currentConfig.textMain}_${currentConfig.textSecondary}${suffix}.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } else if (format === DownloadFormat.TXT) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentConfig.textMain}_${currentConfig.textSecondary}${suffix}_code.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [config, lightConfig]);

  const handleExportConfig = () => {
    const data = {
      dark: config,
      light: lightColors
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dimo_v_config_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.dark) setConfig(json.dark);
        if (json.light) setLightColors(json.light);
      } catch (err) {
        alert("Invalid configuration file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleAIGenerate = async (mode: 'single' | 'variations') => {
    const effectivePrompt = prompt.trim() || (mode === 'variations' ? "Generate 10 distinct creative variations." : "");
    if (!effectivePrompt) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      if (mode === 'single') {
        const newConfig = await generateLogoModification(config, effectivePrompt);
        setConfig(newConfig);
      } else {
        const newVariations = await generateLogoVariations(config, effectivePrompt, 10);
        setVariations(newVariations);
        setTimeout(() => {
          variationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError("Could not generate logo. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateColor = (key: keyof LogoColorConfig, value: string) => {
    if (activeColorTab === 'dark') {
      setConfig(prev => ({ ...prev, [key]: value }));
    } else {
      setLightColors(prev => ({ ...prev, [key]: value }));
    }
  };

  const currentColorConfig = activeColorTab === 'dark' ? config : lightColors;

  // Helper for sliders with numeric input
  const SliderControl = ({ label, value, min, max, step = 1, onChange, accent = "accent-blue-500" }: any) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] text-gray-500 uppercase font-bold">{label}</label>
        <input 
          type="number"
          value={value}
          step={step}
          onChange={onChange}
          className="w-14 bg-gray-900 border border-gray-700 text-right text-[10px] px-1 py-0.5 rounded text-gray-300 focus:ring-1 focus:ring-purple-500 outline-none"
        />
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} onChange={onChange}
        className={`w-full ${accent} cursor-pointer h-1.5 bg-gray-700 rounded-lg appearance-none`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center font-bold italic text-white">D</div>
            <h1 className="text-xl font-bold tracking-wide text-white">LogoForge <span className="text-red-500 font-normal text-sm ml-2">AI Edition</span></h1>
          </div>
          <div className="flex gap-2">
             <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportConfig}
                accept=".json"
                className="hidden"
             />
             <button onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded text-gray-300 transition-colors">
               <Upload size={14} /> Load
             </button>
             <button onClick={handleExportConfig} className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded text-gray-300 transition-colors">
               <Save size={14} /> Save
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Preview Section */}
        <section className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dark */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                <div className="absolute top-2 left-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-700">
                   <Moon size={12} /> Dark
                </div>
                <div className="relative z-10 w-full aspect-[2/1] shadow-xl rounded-lg overflow-hidden border border-gray-700">
                   <LogoRenderer ref={darkSvgRef} config={config} className="w-full h-full" />
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => handleDownload(DownloadFormat.PNG, 'dark')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium border border-gray-700 flex items-center justify-center gap-2"><Download size={14} /> PNG</button>
                <button onClick={() => handleDownload(DownloadFormat.SVG, 'dark')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium border border-gray-700 flex items-center justify-center gap-2"><Download size={14} /> SVG</button>
                <button onClick={() => handleDownload(DownloadFormat.TXT, 'dark')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium border border-gray-700 flex items-center justify-center gap-2"><FileCode size={14} /> Code</button>
              </div>
            </div>

            {/* Light */}
            <div className="space-y-4">
              <div className="bg-gray-200 border border-gray-300 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                <div className="absolute top-2 left-2 bg-white/80 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-300 shadow-sm">
                   <Sun size={12} /> Light
                </div>
                 <div className="relative z-10 w-full aspect-[2/1] shadow-xl rounded-lg overflow-hidden border border-gray-300">
                   <LogoRenderer ref={lightSvgRef} config={lightConfig} className="w-full h-full" />
                </div>
              </div>
               <div className="flex gap-2 justify-center">
                <button onClick={() => handleDownload(DownloadFormat.PNG, 'light')} className="flex-1 bg-gray-100 hover:bg-white text-gray-800 py-2 rounded-lg text-xs font-medium border border-gray-300 flex items-center justify-center gap-2"><Download size={14} /> PNG</button>
                <button onClick={() => handleDownload(DownloadFormat.SVG, 'light')} className="flex-1 bg-gray-100 hover:bg-white text-gray-800 py-2 rounded-lg text-xs font-medium border border-gray-300 flex items-center justify-center gap-2"><Download size={14} /> SVG</button>
                <button onClick={() => handleDownload(DownloadFormat.TXT, 'light')} className="flex-1 bg-gray-100 hover:bg-white text-gray-800 py-2 rounded-lg text-xs font-medium border border-gray-300 flex items-center justify-center gap-2"><FileCode size={14} /> Code</button>
              </div>
            </div>
          </div>

          {/* Variations */}
          {variations.length > 0 && (
            <div ref={variationsRef} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-200"><Grid size={20} className="text-purple-400" /> Generated Variations</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {variations.map((v, i) => (
                  <div key={i} onClick={() => { setConfig(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group relative aspect-[2/1] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10">
                    <div className="absolute inset-0 p-2"><LogoRenderer config={v} width={200} height={100} className="w-full h-full" /></div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white font-semibold text-xs flex items-center gap-1">Apply <ArrowRight size={12} /></span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Controls */}
        <aside className="lg:col-span-4 space-y-6">
          {/* AI */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-4 text-purple-400"><Wand2 size={20} /><h2 className="font-bold text-lg uppercase tracking-wider">AI Modifier</h2></div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe changes..." className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 transition-all resize-none h-24 text-sm mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAIGenerate('single')} disabled={isGenerating} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2">{isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Wand2 size={14}/>} Modify</button>
              <button onClick={() => handleAIGenerate('variations')} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2">{isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Grid size={14}/>} Variations</button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          {/* Manual Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg space-y-6 overflow-y-auto max-h-[800px]">
             {/* General Text & Font */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-400 text-xs uppercase font-bold tracking-wider mb-1"><Type size={14} /><span>Base Text & Font</span></div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={config.textMain} onChange={(e) => setConfig({...config, textMain: e.target.value})} className="bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white" placeholder="Dimo" />
                <input type="text" value={config.textSecondary} onChange={(e) => setConfig({...config, textSecondary: e.target.value})} className="bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white" placeholder="V" />
              </div>
              <input type="text" value={config.textTagline} onChange={(e) => setConfig({...config, textTagline: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white" placeholder="TAGLINE" />
              <select value={config.fontFamily} onChange={(e) => setConfig({...config, fontFamily: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white">
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="border-t border-gray-700"></div>

            {/* First Letter Controls */}
            <div className="space-y-2">
              <h4 className="text-xs text-red-400 font-bold uppercase">First Letter ('{config.textMain.charAt(0)}')</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-900/50 p-3 rounded-lg">
                <div className="col-span-2">
                   <SliderControl label="X Position" min={-150} max={150} value={config.xOffsetMainFirst} onChange={(e: any) => setConfig({...config, xOffsetMainFirst: parseFloat(e.target.value)})} accent="accent-red-500" />
                </div>
                <SliderControl label="Size" min={20} max={150} value={config.fontSizeMainFirst} onChange={(e: any) => setConfig({...config, fontSizeMainFirst: parseFloat(e.target.value)})} accent="accent-red-500" />
                <SliderControl label="Slant (Skew)" min={-45} max={45} value={config.skewMainFirst} onChange={(e: any) => setConfig({...config, skewMainFirst: parseFloat(e.target.value)})} accent="accent-red-500" />
              </div>
            </div>

            {/* Rest of Name Controls */}
            <div className="space-y-2">
              <h4 className="text-xs text-blue-400 font-bold uppercase">Rest of Name ('{config.textMain.slice(1)}')</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-900/50 p-3 rounded-lg">
                <div className="col-span-2">
                  <SliderControl label="X Position" min={-150} max={150} value={config.xOffsetMainRest} onChange={(e: any) => setConfig({...config, xOffsetMainRest: parseFloat(e.target.value)})} accent="accent-blue-500" />
                </div>
                <SliderControl label="Size" min={20} max={150} value={config.fontSizeMainRest} onChange={(e: any) => setConfig({...config, fontSizeMainRest: parseFloat(e.target.value)})} accent="accent-blue-500" />
                <SliderControl label="Slant (Skew)" min={-45} max={45} value={config.skewMainRest} onChange={(e: any) => setConfig({...config, skewMainRest: parseFloat(e.target.value)})} accent="accent-blue-500" />
                <div className="col-span-2">
                  <SliderControl label="Letter Spacing" min={-0.1} max={1} step={0.01} value={config.letterSpacingMainRest} onChange={(e: any) => setConfig({...config, letterSpacingMainRest: parseFloat(e.target.value)})} accent="accent-blue-500" />
                </div>
              </div>
            </div>

            {/* Symbol Controls */}
            <div className="space-y-2">
              <h4 className="text-xs text-green-400 font-bold uppercase">Symbol ('{config.textSecondary}')</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-900/50 p-3 rounded-lg">
                <div className="col-span-2">
                   <SliderControl label="X Position" min={-150} max={150} value={config.xOffsetSecondary} onChange={(e: any) => setConfig({...config, xOffsetSecondary: parseFloat(e.target.value)})} accent="accent-green-500" />
                </div>
                <SliderControl label="Size" min={20} max={150} value={config.fontSizeSecondary} onChange={(e: any) => setConfig({...config, fontSizeSecondary: parseFloat(e.target.value)})} accent="accent-green-500" />
                <SliderControl label="Slant (Skew)" min={-45} max={45} value={config.skewSecondary} onChange={(e: any) => setConfig({...config, skewSecondary: parseFloat(e.target.value)})} accent="accent-green-500" />
              </div>
            </div>

            {/* Tagline Controls */}
            <div className="space-y-2 border-t border-gray-700 pt-2">
              <h4 className="text-xs text-gray-400 font-bold uppercase">Tagline</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-900/50 p-3 rounded-lg">
                <div className="col-span-2">
                   <SliderControl label="Vertical Position" min={20} max={100} value={config.taglineOffset} onChange={(e: any) => setConfig({...config, taglineOffset: parseFloat(e.target.value)})} accent="accent-gray-500" />
                </div>
                 <SliderControl label="Size" min={10} max={50} value={config.fontSizeTagline} onChange={(e: any) => setConfig({...config, fontSizeTagline: parseFloat(e.target.value)})} accent="accent-gray-500" />
                 <SliderControl label="Spacing" min={0} max={1} step={0.05} value={config.letterSpacingTagline} onChange={(e: any) => setConfig({...config, letterSpacingTagline: parseFloat(e.target.value)})} accent="accent-gray-500" />
              </div>
            </div>

            {/* Colors */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex p-1 bg-gray-900 rounded mb-3">
                <button onClick={() => setActiveColorTab('dark')} className={`flex-1 py-1 text-[10px] font-bold rounded ${activeColorTab === 'dark' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>MAIN (DARK)</button>
                <button onClick={() => setActiveColorTab('light')} className={`flex-1 py-1 text-[10px] font-bold rounded ${activeColorTab === 'light' ? 'bg-gray-200 text-black' : 'text-gray-500'}`}>VARIANT (LIGHT)</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                 {/* Color Inputs simplified */}
                 {[
                   { k: 'colorMain', l: 'First' }, { k: 'colorMainRest', l: 'Rest' }, 
                   { k: 'colorSecondary', l: 'Symbol' }, { k: 'colorTagline', l: 'Tag' }, 
                   { k: 'bgColor', l: 'BG' }
                 ].map(({k, l}) => (
                   <div key={k} className="text-center">
                     <input type="color" value={(currentColorConfig as any)[k]} onChange={(e) => updateColor(k as keyof LogoColorConfig, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                     <div className="text-[8px] text-gray-500 uppercase">{l}</div>
                   </div>
                 ))}
              </div>
            </div>

          </div>
        </aside>
      </main>
    </div>
  );
}
