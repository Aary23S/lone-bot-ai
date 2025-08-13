const API = 'http://localhost:5000/api'; // base API
const loader = document.getElementById('loader');

// Globals for document selection
let allDocs = [];    // all docs fetched from backend
let uniqueDocs = []; // unique filenames with first doc id

// Loader control
function showLoader(show = true) {
  if (!loader) return;
  loader.style.display = show ? 'block' : 'none';
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
        // Remove entire file input (simpler approach)
        node.remove();
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

    // After successful upload, go to chat and load docs
    loadChatSection();

  } catch (err) {
    console.error('Upload error:', err);
    alert(err.message || 'Upload failed. Please try again.');
  } finally {
    showLoader(false);
  }
}

// ---------- Chat ----------

const toggleDocSelectBtn = document.getElementById('toggleDocSelectBtn');
const docListContainer = document.getElementById('docListContainer');
const docCheckboxes = document.getElementById('docCheckboxes');
const selectAllDocsCheckbox = document.getElementById('selectAllDocs');

if (toggleDocSelectBtn) {
  toggleDocSelectBtn.addEventListener('click', () => {
    if (!docListContainer) return;
    const isHidden = docListContainer.classList.contains('hidden');
    if (isHidden) {
      docListContainer.classList.remove('hidden');
      toggleDocSelectBtn.textContent = 'Select Documents ▲';
    } else {
      docListContainer.classList.add('hidden');
      toggleDocSelectBtn.textContent = 'Select Documents ▼';
    }
  });
}

function toggleAllCheckboxes(checked) {
  if (!docCheckboxes) return;
  docCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = checked;
  });
}

//error may happend here
async function fetchAndRenderDocs() {
  if (!docCheckboxes) return;

  try {
    const res = await fetch(`${API}/upload/docs`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    const docs = await res.json();

    allDocs = docs || [];

    // Unique filenames, keep first doc id per filename
    const map = new Map();
    allDocs.forEach(doc => {
      if (!map.has(doc.filename)) map.set(doc.filename, doc.id);
    });
    uniqueDocs = Array.from(map.entries()).map(([filename, id]) => ({ filename, id }));

    // Render checkboxes
    docCheckboxes.innerHTML = '';
    uniqueDocs.forEach(({ filename, id }) => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${id}" /> ${filename}`;
      docCheckboxes.appendChild(label);
    });

    // Setup Select All toggle
    if (selectAllDocsCheckbox) {
      selectAllDocsCheckbox.checked = true;
      toggleAllCheckboxes(true);
      selectAllDocsCheckbox.addEventListener('change', (e) => {
        toggleAllCheckboxes(e.target.checked);
      });
    }
  } catch (err) {
    console.error('Error fetching docs:', err);
  }
}

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

  // Gather selected docs from checkbox
  let selectedDocIds = [];
  if (docCheckboxes) {
    docCheckboxes.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      selectedDocIds.push(cb.value);
    });
  }

  // If all or none selected, send no documentIds (backend treats as all docs)
  if (selectedDocIds.length === 0 || selectedDocIds.length === uniqueDocs.length) {
    selectedDocIds = undefined;
  }

  showLoader(true);
  try {
    const bodyPayload = selectedDocIds
      ? { question: q, documentIds: selectedDocIds }
      : { question: q };

    const res = await fetch(`${API}/upload/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(bodyPayload)
    });
    const data = await res.json();
    addMessageToChat(data.answer || 'No response from AI.', 'ai');
  } catch (err) {
    console.error('Ask error:', err);
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
      console.error('Failed to fetch history');
      addMessageToChat('Could not retrieve chat history.', 'ai');
      return;
    }
    const data = await res.json();

    // support both shapes: array or { user, history: [...] }
    const items = Array.isArray(data) ? data : (data.history || []);
    if (items.length === 0) {
      addMessageToChat('No previous chat history found.', 'ai');
    } else {
      items.forEach(item => {
        if (item.question && item.answer) {
          addMessageToChat(item.question, 'user');
          addMessageToChat(item.answer, 'ai');
        } else if (item.role && item.content) {
          addMessageToChat(item.content, item.role === 'user' ? 'user' : 'ai');
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
  fetchAndRenderDocs();
  loadChatHistory();
}

function goToChat() {
  showSection('chatSection');
  const cb = document.getElementById('chatBox');
  if (cb) cb.innerHTML = '';
  addMessageToChat('New chat session started. Ask me anything about your documents.', 'ai');
  fetchAndRenderDocs();
  loadChatHistory();
}

// ---------- UX helpers ----------

const textarea = document.getElementById('questionInput');
if (textarea) {
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });
}

// Enter key handling for actions
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

// Init
window.addEventListener('DOMContentLoaded', () => {
  updateUserInfo();
  if (localStorage.getItem('token')) {
    showSection('uploadSection');
  } else {
    showSection('registerSection');
  }
});
