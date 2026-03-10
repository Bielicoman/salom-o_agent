import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, MessageSquare, Image, Terminal, Database,
  Settings, Sun, Moon, Plus, Copy, Check,
  Eye, EyeOff, Crown, Sparkles, Mic, MicOff,
  Globe, Key, Sliders, Palette, BookOpen, Zap,
  ChevronRight, AlertCircle
} from 'lucide-react';
import axios from 'axios';

function Avatar({ src, alt, fallbackIcon: FallbackIcon }) {
  const [error, setError] = useState(false);
  if (error || !src) return (
    <div className="avatar-fallback" style={{ background: 'var(--cyan-glow)' }}>
      {FallbackIcon ? <FallbackIcon size={20} color="var(--cyan-primary)" /> : 'S'}
    </div>
  );
  return <img src={src} alt={alt} onError={() => setError(true)} />;
}

// ─── Markdown-like renderer ───────────────────────────────
function renderMD(text) {
  if (!text || typeof text !== 'string') return text;

  const lines = text.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (triple backtick)
    if (line.startsWith('```')) {
      let codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <code key={`code-${i}`} className="msg-code">
          {codeLines.join('\n')}
        </code>
      );
      i++;
      continue;
    }

    // Heading ## or ###
    if (line.startsWith('### ')) {
      result.push(
        <p key={i} style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px', color: 'var(--cyan-primary)' }}>
          {inlineFormatLine(line.slice(4))}
        </p>
      );
      i++; continue;
    }
    if (line.startsWith('## ')) {
      result.push(
        <p key={i} style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px', color: 'var(--cyan-light)' }}>
          {inlineFormatLine(line.slice(3))}
        </p>
      );
      i++; continue;
    }

    // Bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(
        <p key={i} style={{ paddingLeft: '16px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, color: 'var(--cyan-dim)' }}>•</span>
          {inlineFormatLine(line.slice(2))}
        </p>
      );
      i++; continue;
    }

    // Empty line → break
    if (line.trim() === '') {
      result.push(<span key={i} style={{ display: 'block', height: '8px' }} />);
      i++; continue;
    }

    // Normal line
    result.push(<p key={i}>{inlineFormatLine(line)}</p>);
    i++;
  }

  return result;
}

function inlineFormatLine(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, idx) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={idx} style={{ color: 'var(--cyan-light)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={idx} className="msg-inline-code">{p.slice(1, -1)}</code>;
    return p;
  });
}

// ─── Render message content (images, videos, markdown) ────
function MessageContent({ content, apiBase }) {
  // Detect video URL
  const escapedBase = apiBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const videoRegex = new RegExp(`${escapedBase}/downloads/([^\\s]+)\\.mp4`, 'g');
  const imgRegex = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s]+)/g;

  let segments = [];
  let lastIdx = 0;
  let match;

  while ((match = videoRegex.exec(content)) !== null) {
    if (match.index > lastIdx) segments.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    segments.push({ type: 'video', url: match[0] });
    lastIdx = match.index + match[0].length;
  }

  const rest = content.slice(lastIdx);
  let imgLast = 0;
  let im;
  while ((im = imgRegex.exec(rest)) !== null) {
    if (im.index > imgLast) segments.push({ type: 'text', value: rest.slice(imgLast, im.index) });
    segments.push({ type: 'image', url: im[0] });
    imgLast = im.index + im[0].length;
  }
  segments.push({ type: 'text', value: rest.slice(imgLast) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'video') {
          return (
            <div key={i} className="media-block">
              <video controls style={{ maxWidth: '100%', display: 'block' }}>
                <source src={seg.url} type="video/mp4" />
              </video>
              <div className="media-block-action">
                <a href={seg.url} download className="btn-link-gold" style={{ color: 'var(--cyan-primary)' }}>⬇ Baixar Vídeo</a>
              </div>
            </div>
          );
        }
        if (seg.type === 'image') {
          return (
            <div key={i} className="media-block">
              <img src={seg.url} alt="Imagem Gerada" />
              <div className="media-block-action">
                <a href={seg.url} target="_blank" rel="noreferrer" className="btn-link-gold" style={{ color: 'var(--cyan-primary)' }}>↗ Abrir Original</a>
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderMD(seg.value)}
          </div>
        );
      })}
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '💎', text: 'Qual a sabedoria de Provérbios para hoje?' },
  { icon: '💠', text: 'Crie uma LUT cinematográfica de azul profundo' },
  { icon: '🚀', text: 'Construa um componente React moderno e limpo' },
  { icon: '📘', text: 'Explique a história do Rei Salomão' },
  { icon: '🌌', text: 'Gere uma imagem de um castelo azul celestial' },
  { icon: '⚡', text: 'Como otimizar meu workflow com IA azul?' },
];

// ─── Nav items ────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat Central' },
  { id: 'lut', icon: Image, label: 'LUT Studio' },
  { id: 'web', icon: Globe, label: 'Web Master' },
  { id: 'atlas', icon: BookOpen, label: 'Atlas Sagrado' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

// ─── Default settings ─────────────────────────────────────
const DEFAULT_SETTINGS = {
  apiKey: '',
  backendUrl: 'https://salomaoagent-production.up.railway.app',
  showTimestamps: true,
  autoScroll: true,
  soundEnabled: false,
};

function loadSettings() {
  try {
    const s = localStorage.getItem('salomao_settings');
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

// ─── Format time ──────────────────────────────────────────
function fmtTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── CopyButton ───────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="btn-copy" onClick={handle}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('salomao_theme') || 'dark');
  const [view, setView] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Eu sou Salomão. A graça e a paz do Senhor Jesus Cristo estejam com você. Sou seu Engenheiro de Imagem, Web Master e Conselheiro Espiritual. Em que posso auxiliá-lo hoje?',
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('salomao_theme', theme);
  }, [theme]);

  // Auto-scroll
  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, settings.autoScroll]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const showToast = (msg, icon = '✓') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTestConnection = async (url) => {
    try {
      showToast('Testando conexão...', '⌛');
      await axios.get(`${url}/health`); // Assuming a health endpoint
      showToast('Conexão estabelecida!', '🟢');
    } catch (e) {
      showToast('Erro de conexão!', '🔴');
    }
  };

  // Send message
  const handleSend = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    const userMsg = { role: 'user', content, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const apiBase = settings.backendUrl || DEFAULT_SETTINGS.backendUrl;
    const headers = {};
    if (settings.apiKey) headers['X-API-Key'] = settings.apiKey;

    try {
      const response = await axios.post(`${apiBase}/chat`, {
        message: content,
        history: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      }, { headers });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        time: new Date(),
      }]);
    } catch (error) {
      const errMsg = error.response?.data?.detail
        || `❌ Erro de conexão com o servidor (${apiBase}). Verifique o backend nas configurações.`;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errMsg,
        time: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, settings]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Nova conversa iniciada. Como posso servi-lo, nobre visitante?',
      time: new Date(),
    }]);
    setView('chat');
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // ─── Sidebar ──────────────────────────────────────────
  const Sidebar = () => (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="logo-area">
          <div className="logo-img-wrap">
            <div className="logo-ring" />
            <Avatar src="/logo.png" alt="Salomão" fallbackIcon={Crown} />
          </div>
          <div className="logo-text">
            <div className="logo-title">SALOMÃO</div>
            <div className="logo-subtitle">O Sábio · v6.8</div>
          </div>
        </div>

        {/* New Chat */}
        <button className="btn-new-chat" onClick={() => { handleNewChat(); setSidebarOpen(false); }}>
          <Plus size={15} />
          Nova Conversa
        </button>

        {/* Navigation */}
        <nav className="nav-section">
          <div className="nav-section-label">Módulos</div>
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? 'active' : ''}`}
              onClick={() => { setView(id); setSidebarOpen(false); }}
            >
              <span className="nav-icon"><Icon size={17} /></span>
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-icon">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>
    </>
  );

  // ─── Chat View ──────────────────────────────────────
  const ChatView = () => {
    const apiBase = settings.backendUrl || DEFAULT_SETTINGS.backendUrl;
    const isEmpty = messages.length <= 1 && !isLoading;

    return (
      <div className="chat-view">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
        </button>

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-icon">
            <Crown size={18} />
          </div>
          <div className="chat-header-info">
            <h2>SALOMÃO</h2>
            <p>Engenheiro de Imagem · Web Master · Conselheiro Espiritual</p>
          </div>
        </div>

        {/* Messages or Empty state */}
        <div className="chat-messages">
          {isEmpty ? (
            <div className="empty-state">
              <img src="/logo.png" alt="Salomão" className="empty-logo" />
              <h1 className="empty-title">Como posso servi-lo?</h1>
              <p className="empty-sub">
                Sou Salomão, seu assistente de IA real. Domino artes de Engenharia de Imagem,
                Web Design, código, sabedoria espiritual e muito mais.
              </p>
              <div className="suggestion-chips">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="chip" onClick={() => handleSend(s.text)}>
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="avatar">
                    {msg.role === 'assistant'
                      ? <Avatar src="/logo.png" alt="Salomão" fallbackIcon={Crown} />
                      : <div className="user-avatar-initial">U</div>
                    }
                  </div>
                  <div className="message-body">
                    <div className="message-content">
                      <MessageContent content={msg.content} apiBase={apiBase} />
                    </div>
                    <div className="message-meta">
                      {settings.showTimestamps && msg.time && (
                        <span className="message-time">{fmtTime(msg.time)}</span>
                      )}
                      <CopyBtn text={msg.content} />
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message assistant">
                  <div className="avatar">
                    <Avatar src="/logo.png" alt="Salomão" fallbackIcon={Crown} />
                  </div>
                  <div className="message-body">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-form">
            <button className="input-btn input-btn-ghost" type="button"
              onClick={() => showToast('Módulo de anexo virá em breve!', '📋')} title="Anexar arquivo">
              <Plus size={18} />
            </button>
            <button className="input-btn input-btn-ghost" type="button"
              onClick={() => showToast('Módulo de Voz virá em breve!', '🎙️')} title="Voz (Beta)">
              <Mic size={18} />
            </button>
            <textarea
              ref={textareaRef}
              className="input-textarea"
              placeholder="Digite uma mensagem para Salomão... (Enter para enviar)"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <button
              className="input-btn input-btn-send"
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              title="Enviar"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="input-footer">
            Salomão v6.8 — Groq + LangChain · Respostas geradas por IA
          </div>
        </div>
      </div>
    );
  };

  // ─── Settings View ─────────────────────────────────
  const SettingsView = () => {
    const [local, setLocal] = useState({ ...settings });
    const [showKey, setShowKey] = useState(false);

    const save = () => {
      setSettings(local);
      localStorage.setItem('salomao_settings', JSON.stringify(local));
      showToast('Configurações salvas com sucesso!', '✓');
    };

    const toggle = (key) => setLocal(p => ({ ...p, [key]: !p[key] }));

    return (
      <div className="settings-view">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="settings-header">
            <h2>Configurações</h2>
            <p>Personalize sua experiência com o Sábio Salomão</p>
          </div>

          {/* API Settings */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Key size={16} /> Integração de API
            </div>

            <div className="form-group">
              <label className="form-label">Chave API Pessoal (Groq)</label>
              <div className="form-input-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  placeholder="gsk_••••••••••••••••••••••••••••••••"
                  value={local.apiKey}
                  onChange={e => setLocal(p => ({ ...p, apiKey: e.target.value }))}
                  style={{ paddingRight: 44 }}
                />
                <button className="input-eye-btn" onClick={() => setShowKey(s => !s)}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="form-hint">
                Sua chave Groq pessoal para uso ilimitado. Obtenha em{' '}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                  style={{ color: 'var(--cyan-primary)' }}>console.groq.com</a>.
                Se deixar vazio, será usada a chave padrão do servidor.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">URL do Backend</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://seu-backend.railway.app"
                value={local.backendUrl}
                onChange={e => setLocal(p => ({ ...p, backendUrl: e.target.value }))}
              />
              <p className="form-hint">
                Endereço do servidor backend Python (FastAPI). Use a URL do Railway, Render, ou localhost:8000 para desenvolvimento local.
              </p>
            </div>

            <button className="chip" style={{ width: 'fit-content', marginTop: 8 }}
              onClick={() => handleTestConnection(local.backendUrl)}>
              🔍 Testar Conexão
            </button>

            {/* Connection test indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 0' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: local.backendUrl ? 'var(--cyan-primary)' : '#555',
                boxShadow: local.backendUrl ? '0 0 8px var(--cyan-glow)' : 'none'
              }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {local.backendUrl ? `Configurado: ${local.backendUrl}` : 'Nenhum backend configurado'}
              </span>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Palette size={16} /> Aparência
            </div>
            <div className="theme-cards">
              <div
                className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className="theme-card-preview dark-preview">
                  <div className="preview-dot" style={{ background: '#00A7E1' }} />
                  <div className="preview-dot" style={{ background: '#004E92' }} />
                  <div className="preview-dot" style={{ background: '#060912' }} />
                </div>
                <div className="theme-card-name">🔵 Modo Escuro</div>
              </div>
              <div
                className={`theme-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className="theme-card-preview light-preview">
                  <div className="preview-dot" style={{ background: '#004E92' }} />
                  <div className="preview-dot" style={{ background: '#00A7E1' }} />
                  <div className="preview-dot" style={{ background: '#FFFFFF' }} />
                </div>
                <div className="theme-card-name">⚪ Modo Claro</div>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Sliders size={16} /> Comportamento do Chat
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <h4>Mostrar horário das mensagens</h4>
                <p>Exibe o horário de envio abaixo de cada mensagem</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={local.showTimestamps}
                  onChange={() => toggle('showTimestamps')} />
                <div className="toggle-track" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <h4>Rolagem automática</h4>
                <p>Rola para a última mensagem automaticamente</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={local.autoScroll}
                  onChange={() => toggle('autoScroll')} />
                <div className="toggle-track" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <h4>Sons de notificação</h4>
                <p>Toca um som ao receber uma nova resposta</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={local.soundEnabled}
                  onChange={() => toggle('soundEnabled')} />
                <div className="toggle-track" />
              </label>
            </div>
          </div>

          {/* Save */}
          <button className="btn-save" onClick={save}>
            <Check size={14} style={{ display: 'inline', marginRight: 8 }} />
            Salvar Configurações
          </button>
        </div>
      </div>
    );
  };

  // ─── Coming Soon View ───────────────────────────────
  const ComingSoon = ({ title, desc, icon: Icon, color }) => (
    <div className="coming-soon-view">
      <div className="coming-soon-icon" style={{ '--icon-color': color }}>
        <Icon size={36} color="var(--cyan-primary)" />
      </div>
      <h2 className="coming-soon-title">{title}</h2>
      <p className="coming-soon-desc">{desc}</p>
      <span className="badge-soon">Em Breve</span>
      <div style={{ marginTop: 12 }}>
        <button className="chip" onClick={() => setView('chat')}>
          💬 Usar o Chat enquanto isso
        </button>
      </div>
    </div>
  );

  // ─── Main render ────────────────────────────────────
  const renderView = () => {
    switch (view) {
      case 'chat':
        return <ChatView />;
      case 'lut':
        return (
          <ComingSoon
            title="LUT Studio"
            icon={Image}
            desc="Gere e aplique Lookup Tables cinematográficas de alta precisão com IA. Transforme a paleta de cores das suas imagens com a sabedoria visual do Mestre Salomão."
          />
        );
      case 'web':
        return (
          <ComingSoon
            title="Web Master"
            icon={Globe}
            desc="Geração de código React, CSS e componentes de nível mundial diretamente do chat. Design moderno e majestoso entregue em segundos."
          />
        );
      case 'atlas':
        return (
          <ComingSoon
            title="Atlas Sagrado"
            icon={BookOpen}
            desc="Banco de dados teológico e sabedoria milenar de Salomão. Pesquise Provérbios, Eclesiastes, e toda a tradição de sabedoria do Oriente Antigo."
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {renderView()}
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
