const API = 'http://localhost:5000';
const loader = document.getElementById('loader');

// Utility functions
function showLoader(show = true) {
  loader.classList.toggle('visible', show);
}

function showSection(id) {
  if (!localStorage.getItem('token') && (id === 'uploadSection' || id === 'chatSection')) {
    alert("Please login first.");
    id = 'loginSection';
  }
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  document.getElementById('userInfo').classList.add('hidden');
  showSection('loginSection');
}

function updateUserInfo() {
  const email = localStorage.getItem('userEmail');
  if (email) {
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userInfo').classList.remove('hidden');
  }
}

// Form submissions
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await register();
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await login();
});

// Authentication functions
async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  
  if (!username || !email || !password) {
    alert("All fields are required");
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Registered successfully. Please login.");
      document.getElementById('registerForm').reset();
      showSection('loginSection');
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    console.error(err);
    alert('Network error during registration.');
  }
  showLoader(false);
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!email || !password) {
    alert("All fields are required");
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email);
      updateUserInfo();
      document.getElementById('loginForm').reset();
      showSection('uploadSection');
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Network error during login.');
  }
  showLoader(false);
}

// File upload functionality
const fileInput = document.getElementById('documents');
const fileList = document.getElementById('fileList');

// Ensure elements exist before adding event listeners
if (fileInput && fileList) {
  fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(e) {
  const files = e.target.files;
  const fileListContainer = document.getElementById('fileList');
  
  if (!fileListContainer) return;
  
  if (files.length > 0) {
    fileListContainer.classList.remove('hidden');
    fileListContainer.innerHTML = '';
    
    Array.from(files).forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button onclick="removeFile(this)" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Remove</button>
      `;
      fileListContainer.appendChild(fileItem);
    });
  } else {
    fileListContainer.classList.add('hidden');
  }
}

function removeFile(button) {
  button.parentElement.remove();
  if (fileInput) fileInput.value = '';
  const fileListContainer = document.getElementById('fileList');
  if (fileListContainer && fileListContainer.children.length === 0) {
    fileListContainer.classList.add('hidden');
  }
}

async function uploadFiles() {
  const files = fileInput ? fileInput.files : [];
  if (!files.length) {
    alert("Please select files to upload");
    return;
  }

  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('documents', file));

  showLoader(true);
  
  try {
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Upload failed');
    }
    
    const data = await res.json();
    alert(data.message || "Upload successful");
    
    // Clear file input and file list
    if (fileInput) fileInput.value = '';
    const fileListContainer = document.getElementById('fileList');
    if (fileListContainer) fileListContainer.classList.add('hidden');
    
    // Navigate to chat section
    goToChat();
    
  } catch (err) {
    const errorMessage = err.message || 'Upload failed. Please try again.';
    alert(errorMessage);
    console.error('Upload error:', err);
  } finally {
    showLoader(false);
  }
}

// Chat functionality
function addMessageToChat(message, type) {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function goToChat() {
  showSection('chatSection');
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;
  
  // Start a fresh conversation by clearing the chat box
  chatBox.innerHTML = '';
  
  // Optional: Add a welcome message for the new chat session
  addMessageToChat("New chat session started. Ask me anything about your documents.", 'ai');
}

async function loadChatHistory() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    chatBox.innerHTML = ''; // Clear current chat before loading history
    showLoader(true);
    try {
        const res = await fetch(`${API}/api/upload/history`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            const history = await res.json();
            if (history.length > 0) {
                history.forEach(msg => {
                    const type = msg.role === 'user' ? 'user' : 'ai';
                    addMessageToChat(msg.content, type);
                });
            } else {
                addMessageToChat("No previous chat history found.", 'ai');
            }
        } else {
            // Silently fail or log to console instead of alerting the user
            console.error('Failed to fetch chat history.');
            addMessageToChat("Could not retrieve chat history.", 'ai');
        }
    } catch (err) {
        console.error('Error fetching chat history:', err);
        addMessageToChat("An error occurred while fetching chat history.", 'ai');
    } finally {
        showLoader(false);
    }
}


async function askQuestion() {
  const questionInput = document.getElementById('questionInput');
  if (!questionInput) return;
  
  const question = questionInput.value.trim();
  if (!question) return;

  addMessageToChat(question, 'user');
  questionInput.value = '';

  showLoader(true);
  try {
    const res = await fetch(`${API}/api/upload/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ question })
    });
    
    const data = await res.json();
    addMessageToChat(data.answer || "No response from AI.", 'ai');
  } catch (err) {
    console.error(err);
    addMessageToChat("Error: Could not get a response.", 'ai');
  } finally {
    showLoader(false);
  }
}

// Auto-resize textarea
const textarea = document.getElementById('questionInput');
if (textarea) {
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
}

// Enter key handling
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    const active = document.querySelector('.section.visible');
    if (!active) return;

    if (document.activeElement === textarea) {
      e.preventDefault();
      askQuestion();
    }
  }
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  updateUserInfo();
  if (token) {
    showSection('uploadSection');
  } else {
    showSection('registerSection');
  }
});
