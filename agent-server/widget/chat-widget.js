/**
 * Chat Widget - Embeddable chat interface for ADK Agent
 * Usage: <script src="http://your-server.com/widget/chat-widget.js" data-server="http://your-server.com"></script>
 */
(function () {
    'use strict';

    // Configuration
    const scriptTag = document.currentScript;
    const SERVER_URL = scriptTag?.getAttribute('data-server') || 'http://localhost:3000';
    const WIDGET_TITLE = scriptTag?.getAttribute('data-title') || 'AI Assistant';
    const WELCOME_MESSAGE = scriptTag?.getAttribute('data-welcome') || 'Hi there! 👋 How can I help you today?';

    // State
    let isOpen = false;
    let sessionId = null;
    let isLoading = false;

    // Load CSS
    function loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${SERVER_URL}/widget/chat-widget.css`;
        document.head.appendChild(link);

        // Load Inter font
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);
    }

    // SVG Icons
    const icons = {
        chat: `<svg viewBox="0 0 24 24" class="chat-icon"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>`,
        close: `<svg viewBox="0 0 24 24" class="close-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
        send: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
        bot: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
        sparkle: `<svg viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/></svg>`
    };

    // Create widget structure
    function createWidget() {
        const container = document.createElement('div');
        container.className = 'chat-widget-container';
        container.innerHTML = `
      <button class="chat-widget-button" aria-label="Open chat">
        ${icons.chat}
        ${icons.close}
      </button>
      <div class="chat-widget-panel">
        <div class="chat-widget-header">
          <div class="chat-widget-avatar">
            ${icons.sparkle}
          </div>
          <div class="chat-widget-header-info">
            <div class="chat-widget-title">${WIDGET_TITLE}</div>
            <div class="chat-widget-status">Online</div>
          </div>
        </div>
        <div class="chat-widget-messages">
          <div class="chat-widget-welcome">
            <div class="chat-widget-welcome-icon">
              ${icons.sparkle}
            </div>
            <h3>Welcome!</h3>
            <p>${WELCOME_MESSAGE}</p>
          </div>
        </div>
        <div class="chat-widget-input-area">
          <textarea 
            class="chat-widget-input" 
            placeholder="Type your message..." 
            rows="1"
          ></textarea>
          <button class="chat-widget-send" aria-label="Send message">
            ${icons.send}
          </button>
        </div>
      </div>
    `;
        document.body.appendChild(container);
        return container;
    }

    // Initialize session
    async function initSession() {
        try {
            const response = await fetch(`${SERVER_URL}/api/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.success) {
                sessionId = data.sessionId;
                console.log('Chat session initialized:', sessionId);
            }
        } catch (error) {
            console.error('Failed to initialize session:', error);
        }
    }

    // Send message to API
    async function sendMessage(message) {
        if (!sessionId) {
            await initSession();
        }

        try {
            const response = await fetch(`${SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message })
            });
            const data = await response.json();
            return data.success ? data.response : 'Sorry, I encountered an error.';
        } catch (error) {
            console.error('Failed to send message:', error);
            return 'Sorry, I couldn\'t connect to the server.';
        }
    }

    // Add message to chat
    function addMessage(text, isUser = false) {
        const messagesContainer = document.querySelector('.chat-widget-messages');

        // Remove welcome message if it exists
        const welcome = messagesContainer.querySelector('.chat-widget-welcome');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-widget-message ${isUser ? 'user' : 'agent'}`;
        messageDiv.innerHTML = `<div class="chat-widget-bubble">${escapeHtml(text)}</div>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show/hide typing indicator
    function showTyping(show) {
        const messagesContainer = document.querySelector('.chat-widget-messages');
        let typing = messagesContainer.querySelector('.chat-widget-typing');

        if (show && !typing) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-widget-message agent';
            typingDiv.innerHTML = `
        <div class="chat-widget-typing">
          <span></span><span></span><span></span>
        </div>
      `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else if (!show && typing) {
            typing.closest('.chat-widget-message').remove();
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle send
    async function handleSend() {
        const input = document.querySelector('.chat-widget-input');
        const sendBtn = document.querySelector('.chat-widget-send');
        const message = input.value.trim();

        if (!message || isLoading) return;

        // Clear input and disable
        input.value = '';
        input.style.height = 'auto';
        isLoading = true;
        sendBtn.disabled = true;

        // Add user message
        addMessage(message, true);

        // Show typing indicator
        showTyping(true);

        // Get response
        const response = await sendMessage(message);

        // Hide typing and show response
        showTyping(false);
        addMessage(response, false);

        // Re-enable
        isLoading = false;
        sendBtn.disabled = false;
        input.focus();
    }

    // Toggle chat panel
    function toggleChat() {
        isOpen = !isOpen;
        const button = document.querySelector('.chat-widget-button');
        const panel = document.querySelector('.chat-widget-panel');

        button.classList.toggle('open', isOpen);
        panel.classList.toggle('open', isOpen);

        if (isOpen && !sessionId) {
            initSession();
        }

        if (isOpen) {
            setTimeout(() => {
                document.querySelector('.chat-widget-input')?.focus();
            }, 300);
        }
    }

    // Auto-resize textarea
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // Initialize widget
    function init() {
        loadStyles();
        const container = createWidget();

        // Event listeners
        container.querySelector('.chat-widget-button').addEventListener('click', toggleChat);

        const input = container.querySelector('.chat-widget-input');
        const sendBtn = container.querySelector('.chat-widget-send');

        sendBtn.addEventListener('click', handleSend);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        input.addEventListener('input', () => autoResize(input));

        console.log('Chat widget initialized');
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
