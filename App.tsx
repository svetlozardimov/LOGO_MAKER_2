
import React, { useState, useRef, useCallback } from 'react';
import { Download, RefreshCw, Wand2, Palette, Type, Settings2, Layout, Grid, ArrowRight, Sun, Moon } from 'lucide-react';
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

  // Combine structural config with light colors for the second preview
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
      // High resolution for PNG
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
      
      // Handle special characters in SVG data URI
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  }, [config, lightConfig]);

  const handleAIGenerate = async (mode: 'single' | 'variations') => {
    const effectivePrompt = prompt.trim() || (mode === 'variations' ? "Generate 10 distinct creative variations of the current logo style." : "");

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
      setError("Could not generate logo. Please check your API key or try a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_LOGO_CONFIG);
    setLightColors(DEFAULT_LIGHT_COLORS);
    setVariations([]);
    setPrompt('');
    setError(null);
  };

  const applyVariation = (varConfig: LogoConfig) => {
    setConfig(varConfig);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateColor = (key: keyof LogoColorConfig, value: string) => {
    if (activeColorTab === 'dark') {
      setConfig(prev => ({ ...prev, [key]: value }));
    } else {
      setLightColors(prev => ({ ...prev, [key]: value }));
    }
  };

  const currentColorConfig = activeColorTab === 'dark' ? config : lightColors;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center font-bold italic text-white">D</div>
            <h1 className="text-xl font-bold tracking-wide text-white">LogoForge <span className="text-red-500 font-normal text-sm ml-2">AI Edition</span></h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
             <span>Dimo V Construction Replicator</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Preview Section */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Dual Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dark Variant (Main) */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                <div className="absolute top-2 left-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-700">
                   <Moon size={12} /> Dark Variant
                </div>
                <div className="relative z-10 w-full aspect-[2/1] shadow-xl rounded-lg overflow-hidden border border-gray-700">
                   <LogoRenderer 
                     ref={darkSvgRef} 
                     config={config} 
                     className="w-full h-full"
                   />
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => handleDownload(DownloadFormat.PNG, 'dark')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
                >
                  <Download size={14} /> PNG
                </button>
                <button 
                  onClick={() => handleDownload(DownloadFormat.SVG, 'dark')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
                >
                  <Download size={14} /> SVG
                </button>
              </div>
            </div>

            {/* Light Variant (Secondary) */}
            <div className="space-y-4">
              <div className="bg-gray-200 border border-gray-300 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                <div className="absolute top-2 left-2 bg-white/80 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1 border border-gray-300 shadow-sm">
                   <Sun size={12} /> Light Variant
                </div>
                 <div className="relative z-10 w-full aspect-[2/1] shadow-xl rounded-lg overflow-hidden border border-gray-300">
                   <LogoRenderer 
                     ref={lightSvgRef} 
                     config={lightConfig} 
                     className="w-full h-full"
                   />
                </div>
              </div>
               <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => handleDownload(DownloadFormat.PNG, 'light')}
                  className="flex-1 bg-gray-100 hover:bg-white text-gray-800 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-300 flex items-center justify-center gap-2"
                >
                  <Download size={14} /> PNG
                </button>
                <button 
                  onClick={() => handleDownload(DownloadFormat.SVG, 'light')}
                  className="flex-1 bg-gray-100 hover:bg-white text-gray-800 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-300 flex items-center justify-center gap-2"
                >
                  <Download size={14} /> SVG
                </button>
              </div>
            </div>

          </div>

          {/* Variations Gallery */}
          {variations.length > 0 && (
            <div ref={variationsRef} className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-200">
                  <Grid size={20} className="text-purple-400" />
                  Generated Variations
                </h3>
                <span className="text-xs text-gray-500">Click to apply to Main</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {variations.map((v, i) => (
                  <div 
                    key={i}
                    onClick={() => applyVariation(v)}
                    className="group relative aspect-[2/1] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <div className="absolute inset-0 p-2">
                      <LogoRenderer config={v} width={200} height={100} className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-semibold text-xs flex items-center gap-1">
                        Apply <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Controls Section */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* AI Controller */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-4 text-purple-400">
              <Wand2 size={20} />
              <h2 className="font-bold text-lg uppercase tracking-wider">AI Modifier</h2>
            </div>
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Make it look more futuristic' (affects Main)"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none h-24 text-sm"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAIGenerate('single')}
                  disabled={isGenerating}
                  className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${
                    isGenerating 
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Wand2 size={16} />
                  )}
                  <span>Modify Main</span>
                </button>

                <button
                  onClick={() => handleAIGenerate('variations')}
                  disabled={isGenerating}
                  className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${
                    isGenerating 
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-600/20 active:scale-95'
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Grid size={16} />
                  )}
                  <span>10 Variations</span>
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs mt-2">{error}</p>
              )}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center space-x-2">
                <Settings2 size={20} />
                <h2 className="font-bold text-lg uppercase tracking-wider">Manual Edit</h2>
              </div>
              <button onClick={handleReset} className="text-xs hover:text-white underline">Reset Default</button>
            </div>

            {/* Content - Shared */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                <Type size={14} />
                <span>Content (Shared)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Main Name</label>
                    <input 
                      type="text" 
                      value={config.textMain}
                      onChange={(e) => setConfig({...config, textMain: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Symbol</label>
                    <input 
                      type="text" 
                      value={config.textSecondary}
                      onChange={(e) => setConfig({...config, textSecondary: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                    />
                 </div>
              </div>
              <div>
                  <label className="block text-xs text-gray-500 mb-1">Tagline</label>
                  <input 
                    type="text" 
                    value={config.textTagline}
                    onChange={(e) => setConfig({...config, textTagline: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
               </div>
            </div>

            <div className="border-t border-gray-700 pt-4"></div>

            {/* Typography & Spacing - Shared */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                <Layout size={14} />
                <span>Typography (Shared)</span>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Family</label>
                <select 
                  value={config.fontFamily}
                  onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Main Letter Spacing</label>
                <input 
                  type="range" 
                  min="-0.1" 
                  max="0.5" 
                  step="0.01"
                  value={config.letterSpacingMain}
                  onChange={(e) => setConfig({...config, letterSpacingMain: parseFloat(e.target.value)})}
                  className="w-full accent-red-500"
                />
              </div>

               <div>
                <label className="block text-xs text-gray-500 mb-1">Gap Size (Dimo - V)</label>
                <input 
                  type="range" 
                  min="-50" 
                  max="100" 
                  step="1"
                  value={config.gapSize}
                  onChange={(e) => setConfig({...config, gapSize: parseFloat(e.target.value)})}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Tagline Spacing</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={config.letterSpacingTagline}
                  onChange={(e) => setConfig({...config, letterSpacingTagline: parseFloat(e.target.value)})}
                  className="w-full accent-red-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4"></div>

            {/* Colors - Separate */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center space-x-2 text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <Palette size={14} />
                  <span>Colors</span>
                </div>
              </div>
              
              {/* Color Tabs */}
              <div className="flex p-1 bg-gray-900 rounded-lg mb-4">
                <button
                  onClick={() => setActiveColorTab('dark')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
                    activeColorTab === 'dark' 
                      ? 'bg-gray-700 text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Moon size={12} /> Main (Dark)
                </button>
                <button
                  onClick={() => setActiveColorTab('light')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
                    activeColorTab === 'light' 
                      ? 'bg-gray-200 text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Sun size={12} /> Variant (Light)
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">First Letter</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentColorConfig.colorMain}
                      onChange={(e) => updateColor('colorMain', e.target.value)}
                      className="h-8 w-8 bg-transparent cursor-pointer border-none"
                    />
                    <span className="text-xs font-mono text-gray-400">{currentColorConfig.colorMain}</span>
                  </div>
                </div>
                 <div>
                  <label className="block text-xs text-gray-500 mb-1">Rest of Name</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentColorConfig.colorMainRest}
                      onChange={(e) => updateColor('colorMainRest', e.target.value)}
                      className="h-8 w-8 bg-transparent cursor-pointer border-none"
                    />
                    <span className="text-xs font-mono text-gray-400">{currentColorConfig.colorMainRest}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Secondary (V)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentColorConfig.colorSecondary}
                      onChange={(e) => updateColor('colorSecondary', e.target.value)}
                      className="h-8 w-8 bg-transparent cursor-pointer border-none"
                    />
                    <span className="text-xs font-mono text-gray-400">{currentColorConfig.colorSecondary}</span>
                  </div>
                </div>
                 <div>
                  <label className="block text-xs text-gray-500 mb-1">Tagline</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentColorConfig.colorTagline}
                      onChange={(e) => updateColor('colorTagline', e.target.value)}
                      className="h-8 w-8 bg-transparent cursor-pointer border-none"
                    />
                    <span className="text-xs font-mono text-gray-400">{currentColorConfig.colorTagline}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Background</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentColorConfig.bgColor}
                      onChange={(e) => updateColor('bgColor', e.target.value)}
                      className="h-8 w-8 bg-transparent cursor-pointer border-none"
                    />
                    <span className="text-xs font-mono text-gray-400">{currentColorConfig.bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
