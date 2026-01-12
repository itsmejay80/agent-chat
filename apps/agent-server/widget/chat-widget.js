/**
 * Chat Widget - Embeddable chat interface for ADK Agent
 * Usage: <script src="http://your-server.com/widget/chat-widget.js" data-chatbot-id="your-chatbot-uuid" data-server="http://your-server.com"></script>
 */
(function () {
    'use strict';

    // Configuration
    const scriptTag = document.currentScript;
    const SERVER_URL = scriptTag?.getAttribute('data-server') || 'http://localhost:3001';
    const CHATBOT_ID = scriptTag?.getAttribute('data-chatbot-id') || '';
    const WIDGET_TITLE = scriptTag?.getAttribute('data-title') || 'AI Assistant';
    const WELCOME_MESSAGE = scriptTag?.getAttribute('data-welcome') || 'Hi there! How can I help you today?';

    // Session timeout configuration (5 minutes)
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

    // LocalStorage key for session persistence
    const STORAGE_KEY = `chat_widget_session_${CHATBOT_ID}`;

    // State
    let isOpen = false;
    let sessionId = null;
    let userId = null;
    let appName = null;
    let isLoading = false;
    let inactivityTimer = null;
    let isSessionEnded = false;

    // Save session to localStorage
    function saveSession() {
        if (sessionId && userId && appName) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                sessionId,
                userId,
                appName,
                timestamp: Date.now()
            }));
        }
    }

    // Load session from localStorage
    function loadSession() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Check if session is less than 24 hours old
                const maxAge = 24 * 60 * 60 * 1000;
                if (Date.now() - data.timestamp < maxAge) {
                    return data;
                } else {
                    // Session too old, clear it
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            console.error('Failed to load session from storage:', e);
        }
        return null;
    }

    // Clear session from localStorage
    function clearStoredSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // Load CSS
    function loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${SERVER_URL}/widget/chat-widget.css`;
        document.head.appendChild(link);
    }

    // SVG Icons
    const icons = {
        chat: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        close: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        send: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        bot: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="m8 10 4 4 4-4"/><circle cx="12" cy="14" r="8"/></svg>`,
        sparkle: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`
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

    // Reset inactivity timer
    function resetInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }

        // Only start timer if we have an active session
        if (sessionId && !isSessionEnded) {
            inactivityTimer = setTimeout(() => {
                handleSessionTimeout();
            }, INACTIVITY_TIMEOUT_MS);
        }
    }

    // Handle session timeout
    async function handleSessionTimeout() {
        if (isSessionEnded) return;

        // Show timeout message
        addSystemMessage('Your session has ended due to inactivity. Send a new message to start a fresh conversation.');

        // End session on backend
        await endSession();

        // Update status
        updateStatus('Session ended');
    }

    // End session on backend
    async function endSession() {
        if (!sessionId || isSessionEnded) return;

        isSessionEnded = true;

        // Clear timer
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }

        // Clear stored session
        clearStoredSession();

        try {
            await fetch(`${SERVER_URL}/api/session/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    userId,
                    appName
                })
            });
            console.log('Chat session ended:', sessionId);
        } catch (error) {
            console.error('Failed to end session:', error);
        }

        // Reset session state
        sessionId = null;
        userId = null;
        appName = null;
    }

    // Reset session state for new conversation
    function resetSession() {
        sessionId = null;
        userId = null;
        appName = null;
        isSessionEnded = false;

        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
    }

    // Initialize session
    async function initSession() {
        if (sessionId) return; // Already have a session

        // Try to restore session from localStorage
        const storedSession = loadSession();
        if (storedSession) {
            sessionId = storedSession.sessionId;
            userId = storedSession.userId;
            appName = storedSession.appName;
            isSessionEnded = false;
            console.log('Chat session restored from storage:', sessionId);

            // Start inactivity timer
            resetInactivityTimer();

            // Update status
            updateStatus('Online');
            return;
        }

        // Create new session
        try {
            const response = await fetch(`${SERVER_URL}/api/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatbotId: CHATBOT_ID,
                    pageUrl: window.location.href,
                    userAgent: navigator.userAgent
                })
            });
            const data = await response.json();
            if (data.success) {
                sessionId = data.sessionId;
                userId = data.userId;
                appName = data.appName;
                isSessionEnded = false;
                console.log('Chat session initialized:', sessionId);

                // Save to localStorage for persistence
                saveSession();

                // Start inactivity timer
                resetInactivityTimer();

                // Update status
                updateStatus('Online');
            } else {
                console.error('Failed to initialize session:', data.error);
                addSystemMessage('Failed to connect. Please try again.');
            }
        } catch (error) {
            console.error('Failed to initialize session:', error);
            addSystemMessage('Failed to connect to the server.');
        }
    }

    // Update status indicator
    function updateStatus(status) {
        const statusEl = document.querySelector('.chat-widget-status');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.classList.toggle('offline', status !== 'Online');
        }
    }

    // Send message to API
    async function sendMessage(message) {
        // If session ended, start a new one
        if (!sessionId || isSessionEnded) {
            resetSession();
            await initSession();
        }

        if (!sessionId) {
            return 'Sorry, I couldn\'t connect to the server. Please try again.';
        }

        // Reset inactivity timer on activity
        resetInactivityTimer();

        try {
            const response = await fetch(`${SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    userId,
                    appName,
                    message
                })
            });
            const data = await response.json();

            // Handle session not found (expired/deleted on backend)
            if (!data.success && data.error?.includes('Session not found')) {
                console.log('Session expired on backend, creating new session...');
                clearStoredSession();
                resetSession();
                await initSession();

                // Retry the message with new session
                if (sessionId) {
                    const retryResponse = await fetch(`${SERVER_URL}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId,
                            userId,
                            appName,
                            message
                        })
                    });
                    const retryData = await retryResponse.json();
                    resetInactivityTimer();
                    return retryData.success ? retryData.response : 'Sorry, I encountered an error.';
                }
            }

            // Reset timer again after response
            resetInactivityTimer();

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

    // Add system message (for timeout notifications, errors, etc.)
    function addSystemMessage(text) {
        const messagesContainer = document.querySelector('.chat-widget-messages');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-widget-message system';
        messageDiv.innerHTML = `<div class="chat-widget-bubble system">${escapeHtml(text)}</div>`;
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
        const wasOpen = isOpen;
        isOpen = !isOpen;
        const button = document.querySelector('.chat-widget-button');
        const panel = document.querySelector('.chat-widget-panel');

        button.classList.toggle('open', isOpen);
        panel.classList.toggle('open', isOpen);

        if (isOpen && !sessionId) {
            // Opening widget - initialize session if needed
            initSession();
        } else if (!isOpen && wasOpen) {
            // Closing widget - end the session
            endSession();
        }

        if (isOpen) {
            // Reset timer when opening
            resetInactivityTimer();

            setTimeout(() => {
                document.querySelector('.chat-widget-input')?.focus();
            }, 300);
        }
    }

    // Auto-resize textarea
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        textarea.style.overflowY = textarea.scrollHeight > 120 ? 'auto' : 'hidden';
    }

    // Initialize widget
    function init() {
        if (!CHATBOT_ID) {
            console.error('Chat Widget: data-chatbot-id attribute is required');
            return;
        }

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
            // Reset inactivity timer on any key press
            resetInactivityTimer();
        });

        input.addEventListener('input', () => {
            autoResize(input);
            // Reset inactivity timer on input
            resetInactivityTimer();
        });

        // Note: We no longer end sessions on page unload to persist conversation history
        // Sessions are ended only on:
        // 1. Explicit widget close (clicking close button)
        // 2. Inactivity timeout (5 minutes)
        // Session data is stored in localStorage and restored on page load

        console.log('Chat widget initialized for chatbot:', CHATBOT_ID);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
