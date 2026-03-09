const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();

// The URL of our local Python FastAPI backend
const FASTAPI_URL = 'http://127.0.0.1:8000/chat';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const qrcodeImg = require('qrcode');
const fs = require('fs');

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('⏳ Gerando QR Code de autenticação...');
    qrcodeImg.toFile('./qrcode.png', qr, {
        color: {
            dark: '#000000',  // Black dots
            light: '#ffffff' // White background
        }
    }, function (err) {
        if (err) throw err;
        console.log('✅ QR Code salvo com sucesso em: qrcode.png (Abra este arquivo e escaneie com o WhatsApp - Dispositivos Conectados)');
    });
});

client.on('ready', () => {
    console.log('✅ Salomão (WhatsApp Microservice) está conectado e pronto!');
});

// History dictionary to maintain context per user
// In a production app, use Redis or a DB instead
const chatHistories = {};

client.on('message', async msg => {
    // Avoid responding to group messages for now unless mentioned
    const isGroup = msg.from.includes('@g.us');
    if (isGroup) {
        if (!msg.body.toLowerCase().includes('salomão') && !msg.body.toLowerCase().includes('salomao')) {
            return; // Ignore general group chatter unless explicitly mentioned
        }
    }

    // Initialize history array for this user if it doesn't exist
    if (!chatHistories[msg.from]) {
        chatHistories[msg.from] = [];
    }

    const currentHistory = chatHistories[msg.from];
    console.log(`[Nova Mensagem] <${msg.from}>: ${msg.body}`);

    try {
        // Send to FastAPI Backend
        const response = await axios.post(FASTAPI_URL, {
            message: msg.body,
            history: currentHistory
        });

        const replyText = response.data.response;
        console.log(`[Salomão Resposta]:`, replyText);

        // Push to local memory
        currentHistory.push({ role: 'user', content: msg.body });
        currentHistory.push({ role: 'assistant', content: replyText });

        // Keep only last 10 messages (5 pairs) to save memory/tokens
        if (currentHistory.length > 20) {
            chatHistories[msg.from] = currentHistory.slice(-20);
        }

        // Reply to the user
        await msg.reply(replyText);
    } catch (error) {
        console.error('Erro na comunicação com a API (Python Backend):', error.message);
        await msg.reply("❌ Perdoe-me. Meu núcleo central (API Local) encontra-se desligado no momento. Por favor, inicialize o servidor backend.");
    }
});

client.initialize();
