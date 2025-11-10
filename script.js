// script.js: handles chat functionality and authentication check

// Endpoint for the AI agent webhook
const WEBHOOK_URL = 'http://localhost:5678/webhook/ogt';

/**
 * Check if user is logged in. If not, redirect to the login page.
 */
function ensureAuthenticated() {
  const loggedIn = localStorage.getItem('isLoggedIn');
  if (loggedIn !== 'true') {
    // Not logged in; redirect to login page
    window.location.href = 'login.html';
  }
}

/**
 * Append a new message to the chat window.
 * @param {string} text The message text
 * @param {'user' | 'ai'} sender Who sent the message
 */
function appendMessage(text, sender) {
  const chatWindow = document.getElementById('chatWindow');
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.textContent = text;
  // Timestamp
  const timeSpan = document.createElement('span');
  timeSpan.classList.add('timestamp');
  const now = new Date();
  timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  bubble.appendChild(timeSpan);
  messageElem.appendChild(bubble);
  chatWindow.appendChild(messageElem);
  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Send the user's message to the AI backend and handle the response.
 * @param {string} message The message to send
 */
async function sendMessageToBackend(message) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    // Expect response as JSON or plain text
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      if (data.reply) {
        return data.reply;
      }
      // Fallback to string conversion
      return JSON.stringify(data);
    } else {
      data = await response.text();
      return data;
    }
  } catch (error) {
    console.error('Error communicating with backend:', error);
    return 'Sorry, there was an error processing your request.';
  }
}

/**
 * Handle the logout button click
 */
function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('google_credential');
  window.location.href = 'login.html';
}

// Initialize the chat page
function initChat() {
  ensureAuthenticated();
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', handleLogout);
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    appendMessage(message, 'user');
    chatInput.value = '';
    // Send to backend and append AI reply
    const aiReply = await sendMessageToBackend(message);
    appendMessage(aiReply, 'ai');
  });
}

// If on index.html, initialize chat page. We can check existence of chatForm.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatForm')) {
    initChat();
  }
});