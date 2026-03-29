import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clipboard, Save, Search, Book, Copy, Check, Trash2, ExternalLink, Code2, Terminal, Cpu, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClipboardData {
  [key: string]: string;
}

export default function App() {
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<{ key: string, message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'curl' | 'nodejs' | 'python' | 'react'>('curl');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    document.title = "SyncClip | Universal Cloud Clipboard & Sync API";
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !message) return;

    setLoading(true);
    try {
      const res = await fetch('/api/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, message }),
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: `Successfully synced message with key: ${key}` });
        setKey('');
        setMessage('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus({ type: 'error', msg: errorData.error || 'Failed to sync message.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Network error. Check your connection.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchKey) return;

    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/clipboard/${encodeURIComponent(searchKey)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setStatus({ type: 'error', msg: 'Key not found in cloud storage.' });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Search failed. Please try again.' });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  const copyToClipboard = useCallback((text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const snippets = {
    curl: {
      get: `curl ${origin}/api/clipboard/YOUR_KEY`,
      post: `curl -X POST ${origin}/api/clipboard \\
  -H "Content-Type: application/json" \\
  -d '{"key": "YOUR_KEY", "message": "YOUR_MESSAGE"}'`
    },
    nodejs: {
      get: `const res = await fetch('${origin}/api/clipboard/YOUR_KEY');
const data = await res.json();
console.log(data.message);`,
      post: `await fetch('${origin}/api/clipboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'YOUR_KEY', message: 'YOUR_MESSAGE' })
});`
    },
    python: {
      get: `import requests
res = requests.get('${origin}/api/clipboard/YOUR_KEY')
print(res.json()['message'])`,
      post: `import requests
requests.post('${origin}/api/clipboard', 
  json={'key': 'YOUR_KEY', 'message': 'YOUR_MESSAGE'})`
    },
    react: {
      get: `useEffect(() => {
  fetch('${origin}/api/clipboard/YOUR_KEY')
    .then(res => res.json())
    .then(data => setMessage(data.message));
}, []);`,
      post: `const save = async () => {
  await fetch('${origin}/api/clipboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, message })
  });
};`
    }
  };

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* Back to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[60] w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 active:scale-95 transition-all"
            aria-label="Back to Top"
          >
            <Code2 className="w-5 h-5 rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Clipboard className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SyncClip</h1>
          </motion.div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-black/50">
            <a href="#save" className="hover:text-black transition-all hover:scale-105">Save</a>
            <a href="#browse" className="hover:text-black transition-all hover:scale-105">Browse</a>
            <a href="#api" className="hover:text-black transition-all hover:scale-105">API Docs</a>
            <a href="#how-it-works" className="hover:text-black transition-all hover:scale-105">How it Works</a>
          </nav>
          <div className="md:hidden">
            <button aria-label="Menu" className="p-2 bg-black/5 rounded-lg">
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-24 md:space-y-32">
        {/* Hero / Save Section */}
        <section id="save" className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                Universal <br />
                <span className="text-black/20 italic">Cloud Sync.</span>
              </h2>
              <p className="text-lg md:text-xl text-black/50 max-w-md leading-relaxed">
                The fastest way to sync text across devices. Free, secure, and developer-friendly cloud clipboard API.
              </p>
            </motion.div>
            
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSave} 
              className="space-y-5 bg-white p-6 md:p-8 rounded-[32px] border border-black/5 shadow-2xl shadow-black/5"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="key-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Access Key ID</label>
                  <input 
                    id="key-input"
                    type="text" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. my-private-key"
                    className="w-full px-5 py-4 rounded-2xl border border-black/5 bg-[#f9f9f9] focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/20 transition-all font-mono text-sm"
                    required
                    aria-label="Access Key"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Message Content</label>
                  <textarea 
                    id="message-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Paste your text, code, or notes here..."
                    rows={5}
                    className="w-full px-5 py-4 rounded-2xl border border-black/5 bg-[#f9f9f9] focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/20 transition-all resize-none text-sm leading-relaxed"
                    required
                    aria-label="Message Content"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                aria-label="Save Message"
                className="w-full bg-black text-white py-5 rounded-2xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/20 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : <><Save className="w-5 h-5" /> Sync to Cloud</>}
              </button>
              
              <AnimatePresence>
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-2xl text-xs font-bold text-center ${status.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                  >
                    {status.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 md:p-10 rounded-[40px] border border-black/5 shadow-sm space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-2xl tracking-tight">Cloud Search</h3>
              <div className="p-2 bg-black/5 rounded-full">
                <Search className="w-5 h-5 text-black/40" />
              </div>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Enter your private key..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full pl-12 pr-24 py-4 rounded-2xl border border-black/5 bg-[#f9f9f9] focus:outline-none focus:border-black/20 transition-all text-sm font-mono"
                aria-label="Search Key"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <button 
                type="submit"
                disabled={searchLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {searchLoading ? '...' : 'Search'}
              </button>
            </form>
            
            <div className="space-y-4 min-h-[100px] flex flex-col justify-center">
              {!searchResult && !searchLoading && (
                <div className="text-center py-10 text-black/20 italic flex flex-col items-center gap-4">
                  <Search className="w-10 h-10 opacity-10" />
                  <p className="text-sm">Enter a key to retrieve your message.</p>
                </div>
              )}

              {searchLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                </div>
              )}

              {searchResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group p-6 rounded-3xl border-2 border-black/5 bg-black/5 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 rounded-md">Result: {searchResult.key}</span>
                    <button 
                      aria-label={`Copy result`}
                      onClick={() => copyToClipboard(searchResult.message, 'search-result')}
                      className="p-2 bg-white rounded-xl shadow-sm hover:scale-110 transition-all active:scale-90"
                    >
                      {copiedKey === 'search-result' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-black/40" />}
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-black/5">
                    <p className="text-sm text-black/80 break-all font-medium leading-relaxed whitespace-pre-wrap">{searchResult.message}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Universal Sync</h2>
            <p className="text-black/40 font-medium">The most efficient way to move data between platforms.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { title: "1. Create Key", desc: "Choose any unique string as your key. This is your private identifier.", icon: <Cpu className="w-6 h-6" /> },
              { title: "2. Sync Data", desc: "Save your text or code. It's instantly available in the cloud.", icon: <Save className="w-6 h-6" /> },
              { title: "3. Access Anywhere", desc: "Retrieve your data via web or API from any device globally.", icon: <Globe className="w-6 h-6" /> }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white rounded-[32px] border border-black/5 space-y-4 hover:shadow-xl hover:shadow-black/5 transition-all">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                  {item.icon}
                </div>
                <h4 className="font-black text-xl">{item.title}</h4>
                <p className="text-sm text-black/50 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Browse Section - Hidden for Privacy as requested */}
        <section id="browse" className="space-y-10">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight">Private Access</h2>
              <p className="text-black/40 font-medium">Your data is only accessible via its unique key.</p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-black/5 p-12 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto">
              <Terminal className="w-10 h-10 text-black/20" />
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-2xl font-black">Privacy First</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                To protect your privacy, we no longer list all keys publicly. 
                Use the <strong>Cloud Search</strong> tool above to retrieve your specific message using your private key.
              </p>
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section id="api" className="bg-black text-white rounded-[40px] md:rounded-[60px] p-8 md:p-20 space-y-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -mr-[300px] -mt-[300px]" />
          
          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              <Terminal className="w-3 h-3" /> API Reference
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
              Developer-First <br />
              <span className="text-white/30">Cloud Clipboard.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 leading-relaxed font-medium">
              Integrate SyncClip into your CI/CD, scripts, or apps with our lightweight REST API.
            </p>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl w-fit">
              {(['curl', 'nodejs', 'python', 'react'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/40 hover:text-white/70'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-black text-lg flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black">GET</span>
                    Retrieve
                  </h4>
                  <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-white/5 font-mono text-xs leading-relaxed group relative">
                    <pre className="text-white/80 overflow-x-auto custom-scrollbar-dark">
                      <code>{snippets[activeTab].get}</code>
                    </pre>
                    <button 
                      aria-label="Copy GET Snippet"
                      onClick={() => copyToClipboard(snippets[activeTab].get, 'api-get')}
                      className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedKey === 'api-get' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-lg flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">POST</span>
                    Sync
                  </h4>
                  <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-white/5 font-mono text-xs leading-relaxed group relative">
                    <pre className="text-white/80 overflow-x-auto custom-scrollbar-dark">
                      <code>{snippets[activeTab].post}</code>
                    </pre>
                    <button 
                      aria-label="Copy POST Snippet"
                      onClick={() => copyToClipboard(snippets[activeTab].post, 'api-post')}
                      className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedKey === 'api-post' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-8 md:p-10 rounded-[40px] border border-white/10 space-y-8">
                <h4 className="font-black text-2xl flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-white/40" />
                  API Specs
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-white/80">key</span>
                      <span className="text-[10px] font-black uppercase text-white/20">String</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">Your unique identifier. Use a complex string for better privacy.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-white/80">message</span>
                      <span className="text-[10px] font-black uppercase text-white/20">String</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">The text payload to be stored in the cloud.</p>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-xs text-white/20 italic">
                      * SyncClip is a public utility. Do not store sensitive credentials without encryption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <Clipboard className="text-white w-4 h-4" />
              </div>
              <span className="font-black text-xl tracking-tight">SyncClip</span>
            </div>
            <p className="text-sm text-black/40 max-w-xs leading-relaxed font-medium">
              High-performance cloud clipboard for developers and power users. Sync anything, anywhere.
            </p>
            <div className="pt-4 border-t border-black/5">
              <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-2">Why SyncClip?</h6>
              <p className="text-[10px] text-black/20 leading-relaxed font-medium">
                SyncClip is a free, open-source cloud clipboard and sync API designed for speed and simplicity. 
                Whether you're a developer needing a quick sync API for scripts or a power user moving text between devices, 
                SyncClip provides the fastest, most reliable universal clipboard experience. 
                Optimized for performance and SEO, SyncClip is the top choice for cloud synchronization.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Features</h5>
            <ul className="space-y-4 text-sm font-bold text-black/60">
              <li><a href="#save" className="hover:text-black transition-colors">Sync Text</a></li>
              <li><a href="#browse" className="hover:text-black transition-colors">Cloud Explorer</a></li>
              <li><a href="#api" className="hover:text-black transition-colors">REST API</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Support</h5>
            <ul className="space-y-4 text-sm font-bold text-black/60">
              <li><a href="#" className="hover:text-black transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-20 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-black/30 font-bold uppercase tracking-widest">© 2026 SyncClip | Cloud Clipboard & Sync API</p>
          <div className="flex gap-6">
            <Globe className="w-4 h-4 text-black/20" />
            <ExternalLink className="w-4 h-4 text-black/20" />
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.1);
        }

        .custom-scrollbar-dark::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
