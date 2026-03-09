import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, Settings, MessageSquare, Terminal, Database, Play } from 'lucide-react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Eu sou Salomão. A graça e a paz do Senhor Jesus Cristo estejam com você. Em que posso auxiliá-lo como Engenheiro de Imagem, Web Master e Conselheiro Espiritual hoje?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: userMessage.content,
        // Send history up to latest message to preserve context.
        history: messages.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content }))
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro de conexão com o servidor. Por favor, verifique se a API local está rodando.' }]);
    } finally {
      setIsLoading(false);
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
          <a href="#" className="nav-link active"><MessageSquare size={20} /> Chat Central</a>
          <a href="#" className="nav-link"><Image size={20} /> Engenharia LUT</a>
          <a href="#" className="nav-link"><Terminal size={20} /> Web Master</a>
          <a href="#" className="nav-link"><Database size={20} /> Atlas MED/ESC</a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <a href="#" className="nav-link"><Settings size={20} /> Configurações</a>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-container glass">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'assistant' ? <img src="/logo.png" alt="Salomão" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontWeight: 'bold' }}>U</span>}
              </div>
              <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
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
              placeholder="/CRIAR-LUT-64 imagem.jpg ou digite sua pergunta..."
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
      </main>
    </div>
  );
}

export default App;
