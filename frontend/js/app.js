// frontend/js/app.js
const API = 'http://localhost:5000/api'; // base API
const loader = document.getElementById('loader');

// Globals
let docsMapByFilename = {};
let selectedDocIds = [];

// Loader control (toggle CSS 'visible' class)
function showLoader(show = true) {
  if (!loader) return;
  loader.classList.toggle('visible', !!show);
}

// Section switcher
function showSection(id) {
  if (!localStorage.getItem('token') && (id === 'uploadSection' || id === 'chatSection')) {
    alert('Please login first.');
    id = 'loginSection';
  }
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  const userInfo = document.getElementById('userInfo');
  if (userInfo) userInfo.classList.add('hidden');
  showSection('loginSection');
}

function updateUserInfo() {
  const email = localStorage.getItem('userEmail');
  const userEmailEl = document.getElementById('userEmail');
  const userInfo = document.getElementById('userInfo');
  if (email && userEmailEl && userInfo) {
    userEmailEl.textContent = email;
    userInfo.classList.remove('hidden');
  }
}

// ---------- Auth ----------
async function register() {
  const username = document.getElementById('regUsername')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value.trim();
  if (!username || !email || !password) return alert('All fields are required');

  showLoader(true);
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Registered successfully. Please login.');
      document.getElementById('registerForm')?.reset();
      showSection('loginSection');
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    console.error('Registration error:', err);
    alert('Network error during registration.');
  } finally {
    showLoader(false);
  }
}

async function login() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value.trim();
  if (!email || !password) return alert('All fields are required');

  showLoader(true);
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email);
      updateUserInfo();
      document.getElementById('loginForm')?.reset();
      showSection('uploadSection');
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Network error during login.');
  } finally {
    showLoader(false);
  }
}

// ---------- File upload ----------
const fileInput = document.getElementById('documents');
const fileList = document.getElementById('fileList');

if (fileInput) fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
  const files = e.target.files;
  if (!fileList) return;

  fileList.innerHTML = '';
  if (files && files.length > 0) {
    fileList.classList.remove('hidden');
    Array.from(files).forEach(file => {
      const node = document.createElement('div');
      node.className = 'file-item';
      node.innerHTML = `
        <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" class="remove-file-btn" style="margin-left:8px;">Remove</button>
      `;
      const btn = node.querySelector('.remove-file-btn');
      btn.addEventListener('click', () => {
        node.remove();
        // Clear the input (simple approach)
        fileInput.value = '';
        if (fileList.children.length === 0) fileList.classList.add('hidden');
      });
      fileList.appendChild(node);
    });
  } else {
    fileList.classList.add('hidden');
  }
}

async function uploadFiles() {
  const files = fileInput ? fileInput.files : null;
  if (!files || files.length === 0) return alert('Please select files to upload');

  const formData = new FormData();
  Array.from(files).forEach(f => formData.append('documents', f));

  showLoader(true);
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');

    alert(data.message || 'Upload successful');
    fileInput.value = '';
    if (fileList) fileList.classList.add('hidden');

    loadChatSection();
  } catch (err) {
    console.error('Upload error:', err);
    alert(err.message || 'Upload failed. Please try again.');
  } finally {
    showLoader(false);
  }
}

// ---------- Fetch docs ----------
async function fetchDocs() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API}/upload/docs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const docs = await res.json();

    docsMapByFilename = {};
    docs.forEach(d => {
      const key = d.filename;
      // keep the most recent by uploaded_at
      if (!docsMapByFilename[key] || new Date(d.uploaded_at) > new Date(docsMapByFilename[key].uploaded_at)) {
        docsMapByFilename[key] = d;
      }
    });

    renderDocs(Object.values(docsMapByFilename));
  } catch (err) {
    console.error('Failed to fetch docs:', err);
  }
}

function renderDocs(docs) {
  const container = document.getElementById('docCheckboxes');
  const selectAllCheckbox = document.getElementById('selectAllDocs');
  if (!container) return;
  container.innerHTML = '';

  if (!docs || docs.length === 0) {
    container.innerHTML = '<div class="text-secondary">No documents uploaded yet.</div>';
    return;
  }

  docs.forEach(d => {
    const label = document.createElement('label');
    label.style.display = 'block';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.value = d.id;             // IMPORTANT: set value so later we collect .value
    chk.dataset.id = d.id;
    chk.addEventListener('change', (e) => {
      const id = e.target.value;
      if (e.target.checked) {
        if (!selectedDocIds.includes(id)) selectedDocIds.push(id);
      } else {
        selectedDocIds = selectedDocIds.filter(x => x !== id);
      }
    });
    label.appendChild(chk);
    label.appendChild(document.createTextNode(' ' + d.filename));
    container.appendChild(label);
  });

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.addEventListener('change', function () {
      const allChecks = container.querySelectorAll('input[type="checkbox"]');
      selectedDocIds = [];
      allChecks.forEach(chk => {
        chk.checked = this.checked;
        if (this.checked) selectedDocIds.push(chk.value);
      });
    });
  }
}

// ---------- Toggle doc list ----------
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'toggleDocSelectBtn') {
    const list = document.getElementById('docListContainer');
    if (!list) return;
    list.classList.toggle('hidden');
    e.target.textContent = list.classList.contains('hidden')
      ? 'Select Documents ▼'
      : 'Select Documents ▲';
  }
});

// ---------- Chat helpers ----------
function addMessageToChat(message, type = 'ai') {
  const cb = document.getElementById('chatBox');
  if (!cb) return;
  const d = document.createElement('div');
  d.className = `message ${type}`;
  d.textContent = message;
  cb.appendChild(d);
  cb.scrollTop = cb.scrollHeight;
}

async function askQuestion() {
  const questionInput = document.getElementById('questionInput');
  if (!questionInput) return;

  const q = questionInput.value.trim();
  if (!q) return;

  addMessageToChat(q, 'user');
  questionInput.value = '';

  // Collect checked doc IDs
  let chosen = [];
  const checkboxesContainer = document.getElementById('docCheckboxes');
  if (checkboxesContainer) {
    checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked')
      .forEach(cb => chosen.push(cb.value));
  }

  // if no docs selected, send undefined so backend uses all docs
  if (chosen.length === 0) chosen = undefined;

  showLoader(true);
  try {
    const payload = chosen ? { question: q, documentIds: chosen } : { question: q };
    const res = await fetch(`${API}/upload/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    addMessageToChat(data.answer || data.message || 'No response from AI.', 'ai');
  } catch (err) {
    console.error('❌ Ask error:', err);
    addMessageToChat('Error: Could not get a response.', 'ai');
  } finally {
    showLoader(false);
  }
}

async function loadChatHistory() {
  const cb = document.getElementById('chatBox');
  if (!cb) return;
  showLoader(true);
  try {
    const res = await fetch(`${API}/upload/history`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) {
      addMessageToChat('Could not retrieve chat history.', 'ai');
      return;
    }
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.history || []);
    if (items.length === 0) {
      addMessageToChat('No previous chat history found.', 'ai');
    } else {
      items.forEach(item => {
        if (item.question && item.answer) {
          addMessageToChat(item.question, 'user');
          addMessageToChat(item.answer, 'ai');
        } else if (item.content) {
          addMessageToChat(item.content, 'ai');
        } else {
          addMessageToChat(JSON.stringify(item), 'ai');
        }
      });
    }
  } catch (err) {
    console.error('History error:', err);
    addMessageToChat('Error loading history', 'ai');
  } finally {
    showLoader(false);
  }
}

function loadChatSection() {
  goToChat();
  loadChatHistory();
}

function goToChat() {
  showSection('chatSection');
  const cb = document.getElementById('chatBox');
  if (cb) cb.innerHTML = '';
  addMessageToChat('New chat session started. Ask me anything about your documents.', 'ai');
  fetchDocs();
  loadChatHistory();
}

// UX helpers
const textarea = document.getElementById('questionInput');
if (textarea) {
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });
}

// Enter-key handling for submit (no Shift)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    const active = document.querySelector('.section.visible');
    if (!active) return;
    e.preventDefault();

    const id = active.id;
    if (id === 'registerSection') register();
    else if (id === 'loginSection') login();
    else if (id === 'uploadSection') uploadFiles();
    else if (id === 'chatSection') askQuestion();
  }
});

// Attach form submit handlers
document.addEventListener('DOMContentLoaded', () => {
  updateUserInfo();

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      register();
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      login();
    });
  }

  if (localStorage.getItem('token')) {
    showSection('uploadSection');
  } else {
    showSection('registerSection');
  }
});

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all your previous chat history?')) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/upload/history', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    alert(data.message);

    // Clear chat window UI after deletion
    document.getElementById('chatWindow').innerHTML = '';
  } catch (err) {
    console.error('Error clearing history:', err);
    alert('Failed to clear history.');
  }
});

