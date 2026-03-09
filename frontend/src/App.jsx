import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, Settings, MessageSquare, Terminal, Database, Play } from 'lucide-react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Eu sou Salomão. A graça e a paz do Senhor Jesus Cristo estejam com você. Em que posso auxiliá-lo como Engenheiro de Imagem, Web Master e Conselheiro Espiritual hoje?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [placeholderText, setPlaceholderText] = useState('Digite sua pergunta...');
  const messagesEndRef = useRef(null);

  const placeholders = [
    '/CRIAR-LUT-64 imagem.jpg ou digite sua pergunta...',
    'Como posso aplicar a sabedoria de Provérbios hoje?',
    'Converta este pensamento em código...',
    'Quais os princípios para um Web Design majestoso?',
    'Pesquise as origens do hebraico antigo...',
    'Quero gerar uma imagem de um leão dourado...'
  ];

  useEffect(() => {
    // Pick a random placeholder on load
    const randomIdx = Math.floor(Math.random() * placeholders.length);
    setPlaceholderText(placeholders[randomIdx]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentView]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage.content,
        history: messages.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content }))
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);

      // Update placeholder randomly after a message
      const randomIdx = Math.floor(Math.random() * placeholders.length);
      setPlaceholderText(placeholders[randomIdx]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erro de conexão com o servidor (${API_BASE_URL}). Por favor, verifique se a API local está rodando e acessível.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content) => {
    // Basic detection for local video downloads dynamically matching the API_BASE_URL
    const escapedBaseUrl = API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const downloadRegex = new RegExp(`${escapedBaseUrl}/downloads/([^\\s]+)\\.mp4`, 'g');
    // Detection for Pollinations images
    const imgRegex = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s]+)/g;

    let parts = [];
    let lastIndex = 0;

    // First handle video
    let match;
    while ((match = downloadRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <div key={`video-${match.index}`} style={{ marginTop: '10px' }}>
          <video controls style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <source src={match[0]} type="video/mp4" />
            Seu navegador não suporta o formato de vídeo.
          </video>
          <div style={{ marginTop: '8px' }}>
            <a href={match[0]} download className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '14px', padding: '6px 12px' }}>Baixar Vídeo</a>
          </div>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    // Now handle possible images on the remaining text
    let remainingContent = content.slice(lastIndex);
    let imgParts = [];
    let imgLastIndex = 0;

    let imgMatch;
    while ((imgMatch = imgRegex.exec(remainingContent)) !== null) {
      if (imgMatch.index > imgLastIndex) {
        imgParts.push(remainingContent.slice(imgLastIndex, imgMatch.index));
      }
      imgParts.push(
        <div key={`img-${imgMatch.index}`} style={{ marginTop: '10px' }}>
          <img src={imgMatch[0]} alt="Imagem Gerada IA" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ marginTop: '8px' }}>
            <a href={imgMatch[0]} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '14px', padding: '6px 12px' }}>Abrir Imagem Original</a>
          </div>
        </div>
      );
      imgLastIndex = imgMatch.index + imgMatch[0].length;
    }
    imgParts.push(remainingContent.slice(imgLastIndex));

    parts = parts.concat(imgParts);
    return parts;
  };

  const renderContent = () => {
    if (currentView === 'chat') {
      return (
        <div className="chat-container glass">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="avatar">
                  {msg.role === 'assistant' ? <img src="/logo.png" alt="Salomão" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontWeight: 'bold' }}>U</span>}
                </div>
                <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`message assistant`}>
                <div className="avatar">
                  <img src="/logo.png" alt="Salomão" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                </div>
                <div className="message-content" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'fadeIn 1s infinite alternate' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'fadeIn 1s infinite alternate 0.2s' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'fadeIn 1s infinite alternate 0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <form className="input-box" onSubmit={handleSendMessage}>
              <button type="button" className="btn-icon">
                <Mic size={20} />
              </button>
              <input
                type="text"
                placeholder={placeholderText}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="btn-primary" disabled={isLoading || !inputMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Salomão v6.8 — Respostas geradas por IA local Groq c/ LangChain
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'lut') {
      return (
        <div className="chat-container glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Image size={64} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h2>Engenharia LUT</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '16px' }}>Solte imagens aqui para que Mestre Salomão gere Lookup Tables precisos (em breve).</p>
        </div>
      );
    }

    if (currentView === 'web') {
      return (
        <div className="chat-container glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Terminal size={64} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h2>Web Master</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '16px' }}>Geração de código React e CSS com design moderno nível mundial (em breve).</p>
        </div>
      );
    }

    if (currentView === 'atlas') {
      return (
        <div className="chat-container glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Database size={64} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h2>Atlas MED/ESC</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '16px' }}>Banco de dados teológico e sabedoria milenar de Salomão (em breve).</p>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="logo-container">
          <img src="/logo.png" alt="Salomão Logo" style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover' }} />
          <div style={{ marginLeft: '12px' }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0, background: 'linear-gradient(45deg, #FFD700, #FDB931)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SALOMÃO</h1>
            <span className="version" style={{ color: '#FFD700', fontSize: '0.7rem' }}>O SÁBIO (v6.8)</span>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" className={`nav-link ${currentView === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('chat'); }}><MessageSquare size={20} /> Chat Central</a>
          <a href="#" className={`nav-link ${currentView === 'lut' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('lut'); }}><Image size={20} /> Engenharia LUT</a>
          <a href="#" className={`nav-link ${currentView === 'web' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('web'); }}><Terminal size={20} /> Web Master</a>
          <a href="#" className={`nav-link ${currentView === 'atlas' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('atlas'); }}><Database size={20} /> Atlas MED/ESC</a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <a href="#" className="nav-link"><Settings size={20} /> Configurações</a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, display: 'flex' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
