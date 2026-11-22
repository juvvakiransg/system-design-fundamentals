import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Link2, ArrowRight, Copy, Check, ChartNoAxesColumnIncreasing, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import './styles.css';
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function App() {
  const [url, setUrl] = useState(''); const [result, setResult] = useState(null);
  const [code, setCode] = useState(''); const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [copied, setCopied] = useState(false);
  async function shorten(e) {
    e.preventDefault(); setBusy(true); setError(''); setResult(null); setStats(null);
    try { const r = await fetch(`${API}/api/v1/urls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalUrl: url.trim() }) }); const data = await r.json(); if (!r.ok) throw Error(data.error || 'Could not create short URL'); setResult(data); setCode(data.shortCode); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function loadStats(e) {
    e.preventDefault(); setError(''); setStats(null);
    try { const parsed = code.trim().split('/').filter(Boolean).pop(); const r = await fetch(`${API}/api/v1/urls/${encodeURIComponent(parsed)}/stats`); const data = await r.json(); if (!r.ok) throw Error(data.error || 'Could not load stats'); setStats(data); }
    catch (e) { setError(e.message); }
  }
  async function copy() { if (!result) return; try { await navigator.clipboard.writeText(result.shortUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setError('Clipboard access denied. Please copy the link manually.'); } }
  return <div className="shell"><header className="topbar"><div className="brand"><span className="brand-icon"><Link2 size={22}/></span> LinkScale <span className="brand-sub">/ developer POC</span></div><a href="https://github.com" target="_blank" rel="noreferrer" className="nav-link">GitHub-ready <ExternalLink size={14}/></a></header>
    <main><div className="eyebrow"><span className="dot"/> SYSTEM DESIGN FUNDAMENTALS · FULL-STACK POC</div><h1>Short links.<br/><span>Big possibilities.</span></h1><p className="intro">Turn long URLs into short, shareable links. Built to explore APIs, databases, caching, and scalable system architecture.</p>
    <section className="panel"><div className="section-head"><div className="section-icon"><Link2 size={20}/></div><div><h2>Create a short link</h2><p>Paste a public URL to get started</p></div></div><form onSubmit={shorten}><label htmlFor="url">DESTINATION URL</label><div className="input-row"><input id="url" type="url" placeholder="https://example.com/your-very-long-url" value={url} onChange={e => setUrl(e.target.value)} required/><button disabled={busy} type="submit">{busy ? 'Creating…' : 'Shorten URL'} <ArrowRight size={17}/></button></div></form>
    {result && <div className="result"><div><small>YOUR SHORT LINK</small><a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl} <ExternalLink size={15}/></a></div><button className="copy" onClick={copy}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy'}</button></div>}
    {error && <p className="error" role="alert">{error}</p>}</section>
    <section className="panel stats-panel"><div className="section-head"><div className="section-icon purple"><ChartNoAxesColumnIncreasing size={20}/></div><div><h2>Link analytics</h2><p>Track how often your link gets visited</p></div></div><form onSubmit={loadStats}><label htmlFor="code">SHORT CODE OR LINK</label><div className="input-row"><input id="code" placeholder="aB7x9K" value={code} onChange={e => setCode(e.target.value)} required/><button className="secondary" type="submit">View stats <ArrowRight size={17}/></button></div></form>{stats && <div className="stats-result"><div><small>TOTAL CLICKS</small><strong>{stats.clicks.toLocaleString()}</strong></div><div><small>CREATED</small><strong className="date">{new Date(stats.createdAt).toLocaleDateString()}</strong></div></div>}</section>
    <div className="features"><article><div className="feature-icon"><Zap size={20}/></div><h3>Fast by design</h3><p>Redis cache-aside reads keep popular redirects responsive.</p></article><article><div className="feature-icon"><ShieldCheck size={20}/></div><h3>Built with guardrails</h3><p>URL validation, rate limits, and parameterized database queries.</p></article><article><div className="feature-icon"><ChartNoAxesColumnIncreasing size={20}/></div><h3>Measure impact</h3><p>Track clicks with PostgreSQL-backed analytics.</p></article></div></main><footer>LINKSCALE · SYSTEM DESIGN LEARNING PROJECT <span>React · Express · PostgreSQL · Redis</span></footer></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
