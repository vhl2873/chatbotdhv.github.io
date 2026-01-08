/**
 * Upload & RAG Chat Application
 * Handles file upload, drag & drop, and chat functionality
 */

// API Configuration - will be loaded from config.json
let API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const fileList = document.getElementById('fileList');
const clearBtn = document.getElementById('clearBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const uploadBtn = document.getElementById('uploadBtn');
const statusMessage = document.getElementById('statusMessage');
// Chat elements (may not exist in upload page)
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatSuggestions = document.getElementById('chatSuggestions');

// State
let selectedFiles = [];
let uploadedFiles = [];
let isUploading = false;
let currentDomain = "general"; // "general" or "vinh_university"

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_MB = 10;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load API config
    if (window.APIConfig) {
        const config = await window.APIConfig.loadAPIConfig();
        API_BASE_URL = config.baseUrl;
    }
    
    initializeEventListeners();
    updateUI();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Domain tabs
    const tabs = document.querySelectorAll('.domain-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchDomain(tab.dataset.domain);
        });
    });
    
    // Browse link button
    const browseLinkBtn = document.querySelector('.browse-link-btn');
    if (browseLinkBtn) {
        browseLinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput?.click();
        });
    }
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on browse button
            if (!e.target.closest('.browse-link-btn')) {
                fileInput?.click();
            }
        });
    }
    
    // Clear files
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFiles);
    }
    
    // Upload button
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUpload);
    }
    
    // Chat input
    if (chatInput) {
        chatInput.addEventListener('input', handleChatInput);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }
    
    // Suggestion chips
    if (chatSuggestions) {
        const suggestionChips = chatSuggestions.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                if (chatInput) {
                    chatInput.value = chip.textContent;
                    chatInput.focus();
                    handleSendMessage();
                }
            });
        });
    }
    
    // Metadata inputs validation
    const metadataInputs = document.querySelectorAll('#academicMetadata input, #academicMetadata select');
    metadataInputs.forEach(input => {
        input.addEventListener('change', validateMetadata);
        input.addEventListener('input', validateMetadata);
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
}

/**
 * Handle drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.add('drag-over');
    }
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
}

/**
 * Handle drop
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
    
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
}

/**
 * Validate and add files to selection
 * FILE PARSING GUARDRAILS: Validate file size and type
 */
function validateAndAddFiles(files) {
    const errors = [];
    const validFiles = [];
    
    files.forEach(file => {
        // Check if file already exists
        if (selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            return; // Skip duplicate
        }
        
        // FILE SIZE VALIDATION
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`"${file.name}" vượt quá ${MAX_FILE_SIZE_MB}MB. Vui lòng chọn file nhỏ hơn.`);
            return;
        }
        
        // FILE TYPE VALIDATION
        const ext = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['pdf', 'txt', 'md', 'docx'];
        if (!allowedTypes.includes(ext)) {
            errors.push(`"${file.name}" không phải định dạng được hỗ trợ (PDF, TXT, MD, DOCX).`);
            return;
        }
        
        validFiles.push(file);
    });
    
    // Show errors if any
    if (errors.length > 0) {
        showStatus(errors.join('\n'), 'error');
    }
    
    // Add valid files
    if (validFiles.length > 0) {
        selectedFiles.push(...validFiles);
        updateFilePreview();
        updateUI();
    }
}

/**
 * Update file preview
 */
function updateFilePreview() {
    if (!filePreviewContainer || !fileList) return;
    
    if (selectedFiles.length === 0) {
        filePreviewContainer.style.display = 'none';
        return;
    }
    
    filePreviewContainer.style.display = 'block';
    fileList.innerHTML = '';
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        fileList.appendChild(fileItem);
    });
}

/**
 * Create file item element
 */
function createFileItem(file, index) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const icon = getFileIcon(file.name);
    const size = formatFileSize(file.size);
    
    div.innerHTML = `
        <div class="file-icon">${icon}</div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${size}</div>
        </div>
        <button class="file-remove" data-index="${index}">✕</button>
    `;
    
    div.querySelector('.file-remove').addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        updateFilePreview();
        updateUI();
    });
    
    return div;
}

/**
 * Get file icon based on extension
 */
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'txt': '📝',
        'md': '📋',
        'docx': '📘'
    };
    return icons[ext] || '📄';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Clear all files
 */
function clearFiles() {
    selectedFiles = [];
    fileInput.value = '';
    updateFilePreview();
    updateUI();
    hideStatus();
}

/**
 * Switch domain
 */
function switchDomain(domain) {
    currentDomain = domain;
    
    // Update tabs
    document.querySelectorAll('.domain-tab').forEach(tab => {
        if (tab.dataset.domain === domain) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update title and subtitle
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadSubtitle = document.getElementById('uploadSubtitle');
    if (uploadTitle) {
        uploadTitle.textContent = domain === 'vinh_university' 
            ? 'Upload tài liệu học vụ – Đại học Vinh'
            : 'Upload tài liệu cho Chat Tổng';
    }
    if (uploadSubtitle) {
        uploadSubtitle.textContent = domain === 'vinh_university'
            ? 'Chọn file và điền thông tin metadata cho tài liệu học vụ'
            : 'Chọn file PDF, DOCX, TXT hoặc MD để upload';
    }
    
    // Show/hide warning
    const academicWarning = document.getElementById('academicWarning');
    if (academicWarning) {
        academicWarning.style.display = domain === 'vinh_university' ? 'block' : 'none';
    }
    
    // Show/hide metadata form
    const academicMetadata = document.getElementById('academicMetadata');
    if (academicMetadata) {
        academicMetadata.style.display = domain === 'vinh_university' ? 'block' : 'none';
    }
    
    // Clear metadata when switching
    if (domain !== 'vinh_university') {
        clearMetadata();
    }
    
    // Clear files when switching domain
    clearFiles();
    
    // Update UI
    updateUI();
}

/**
 * Clear metadata form
 */
function clearMetadata() {
    const facultySelect = document.getElementById('facultySelect');
    const majorInput = document.getElementById('majorInput');
    const courseInput = document.getElementById('courseInput');
    const docTypeSelect = document.getElementById('docTypeSelect');
    const metadataError = document.getElementById('metadataError');
    
    if (facultySelect) facultySelect.value = '';
    if (majorInput) majorInput.value = '';
    if (courseInput) courseInput.value = '';
    if (docTypeSelect) docTypeSelect.value = '';
    if (metadataError) {
        metadataError.style.display = 'none';
        metadataError.textContent = '';
    }
}

/**
 * Validate metadata for academic domain
 */
function validateMetadata() {
    if (currentDomain !== 'vinh_university') return true;
    
    const faculty = document.getElementById('facultySelect')?.value;
    const docType = document.getElementById('docTypeSelect')?.value;
    const metadataError = document.getElementById('metadataError');
    
    const errors = [];
    if (!faculty) {
        errors.push('Vui lòng chọn khoa');
    }
    if (!docType) {
        errors.push('Vui lòng chọn loại tài liệu');
    }
    
    if (errors.length > 0 && metadataError) {
        metadataError.style.display = 'block';
        metadataError.textContent = errors.join(', ');
        return false;
    } else if (metadataError) {
        metadataError.style.display = 'none';
        metadataError.textContent = '';
    }
    
    return true;
}

/**
 * Update UI based on state
 */
function updateUI() {
    // Validate metadata if academic domain
    const isValidMetadata = currentDomain === 'general' || validateMetadata();
    
    // Upload button
    if (uploadBtn) {
        uploadBtn.disabled = selectedFiles.length === 0 || isUploading || !isValidMetadata;
    }
    
    // Chat input (only if elements exist - not available in upload page)
    if (chatInput && sendBtn) {
        const canChat = uploadedFiles.length > 0 && !isUploading;
        chatInput.disabled = !canChat;
        sendBtn.disabled = !canChat || chatInput.value.trim() === '';
    }
    
    // Show suggestions if files are uploaded
    if (chatSuggestions && chatMessages) {
        const canChat = uploadedFiles.length > 0 && !isUploading;
        if (canChat) {
            const welcomeMsg = chatMessages.querySelector('.welcome-message');
            if (welcomeMsg) {
                chatSuggestions.style.display = 'flex';
            }
        }
    }
}

/**
 * Handle upload
 */
async function handleUpload() {
    if (selectedFiles.length === 0 || isUploading) return;
    
    isUploading = true;
    updateUI();
    
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    uploadBtn.disabled = true;
    
    try {
        let uploadedCount = 0;
        const totalFiles = selectedFiles.length;
        
        // Process each file
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            
            // Update progress before processing file
            const progressBefore = Math.floor((i / totalFiles) * 100);
            if (progressFill) progressFill.style.width = progressBefore + '%';
            if (progressPercent) progressPercent.textContent = progressBefore + '%';
            
            try {
                // FILE PARSING GUARDRAILS: Parse file content properly
                const text = await parseFileContent(file);
                
                // Validate parsed content
                if (!text || text.trim().length === 0) {
                    throw new Error('File không chứa nội dung văn bản hợp lệ.');
                }
                
                // Prepare request body
                const requestBody = {
                    id: `file_${Date.now()}_${i}`,
                    text: text,
                    source: file.name,
                    tags: [file.type || 'text'],
                    metadata: {
                        filename: file.name,
                        size: file.size,
                        type: file.type,
                        domain: currentDomain
                    },
                    chunk_size: 800,
                    overlap: 100
                };
                
                // Add academic metadata if domain is vinh_university
                if (currentDomain === 'vinh_university') {
                    const faculty = document.getElementById('facultySelect')?.value;
                    const major = document.getElementById('majorInput')?.value;
                    const course = document.getElementById('courseInput')?.value;
                    const docType = document.getElementById('docTypeSelect')?.value;
                    
                    requestBody.metadata.faculty = faculty;
                    requestBody.metadata.major = major || '';
                    requestBody.metadata.course = course || '';
                    requestBody.metadata.type = docType;
                }
                
                // Determine endpoint based on domain
                const endpoint = currentDomain === 'vinh_university' 
                    ? `${API_BASE_URL}/academic/upsert`
                    : `${API_BASE_URL}/upsert`;
                
                // Call endpoint to create embedding and save to Firestore
                // Thêm timeout để tránh hang (5 phút cho file lớn)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes
                
                console.log(`[UPLOAD] Starting upload for file ${i + 1}/${totalFiles}: ${file.name}`);
                console.log(`[UPLOAD] Text length: ${text.length} characters`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Failed to upload ${file.name}`);
                }
                
                const result = await response.json();
                console.log(`[UPLOAD] Response for ${file.name}:`, result);
                
                if (result.status === 'success') {
                    uploadedCount++;
                    uploadedFiles.push({
                        ...file,
                        docIds: result.document_ids || []
                    });
                    console.log(`[UPLOAD] Successfully uploaded ${file.name} (${uploadedCount}/${totalFiles})`);
                    showStatus(`✅ ${file.name}: Upload thành công`, 'success');
                } else {
                    throw new Error(result.message || `Failed to upload ${file.name}`);
                }
            } catch (fileError) {
                // ERROR HANDLING: Each file processed independently
                console.error(`[FILE ERROR] ${file.name}:`, fileError);
                
                // Record error but continue with other files
                let errorType = 'NETWORK_ERROR';
                let errorMessage = fileError.message;
                
                if (fileError.name === 'AbortError' || fileError.message.includes('timeout') || fileError.message.includes('aborted')) {
                    errorType = 'TIMEOUT_ERROR';
                    errorMessage = 'Upload quá thời gian chờ (timeout). File có thể quá lớn hoặc server đang xử lý.';
                } else if (fileError.message.includes('parse')) {
                    errorType = 'PARSE_ERROR';
                } else if (fileError.message.includes('size')) {
                    errorType = 'SIZE_ERROR';
                } else if (fileError.message.includes('metadata')) {
                    errorType = 'VALIDATION_ERROR';
                }
                
                showStatus(
                    `[ERROR] ${file.name}: ${errorMessage} (${errorType})`,
                    'error'
                );
                
                // Continue with next file (independent processing)
                continue;
            } finally {
                // Update progress after each file (success or error)
                const progress = Math.floor(((i + 1) / totalFiles) * 100);
                if (progressFill) progressFill.style.width = progress + '%';
                if (progressPercent) progressPercent.textContent = progress + '%';
            }
        }
        
        // Complete progress
        if (progressFill) progressFill.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';
        
        if (uploadedCount > 0) {
            selectedFiles = [];
            fileInput.value = '';
            
            showStatus(`Upload thành công ${uploadedCount}/${totalFiles} file(s)! Bạn có thể bắt đầu chat.`, 'success');
            updateFilePreview();
            
            // Update chat welcome message (if chatMessages exists - not available in upload page)
            if (chatMessages) {
                const welcomeMsg = chatMessages.querySelector('.welcome-message');
                if (welcomeMsg) {
                    welcomeMsg.innerHTML = `
                        <div class="welcome-icon">✅</div>
                        <h3>Tài liệu đã được upload!</h3>
                        <p>Bạn có thể hỏi đáp về nội dung trong tài liệu.</p>
                    `;
                }
            }
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showStatus('Lỗi khi upload: ' + error.message, 'error');
    } finally {
        isUploading = false;
        if (progressContainer) progressContainer.style.display = 'none';
        updateUI();
    }
}

/**
 * Parse file content based on file type
 * FILE PARSING GUARDRAILS: Only parse valid text content, reject binary files
 */
async function parseFileContent(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
        // TEXT FILES - Direct read
        if (ext === 'txt' || ext === 'md') {
            return await readFileAsText(file);
        }
        
        // PDF FILES - Need proper parser
        if (ext === 'pdf') {
            // Check if pdfjs-dist is available
            if (typeof pdfjsLib !== 'undefined') {
                return await parsePDF(file);
            } else {
                throw new Error('PDF parser không khả dụng. Vui lòng sử dụng file TXT hoặc MD.');
            }
        }
        
        // DOCX FILES - Need proper parser
        if (ext === 'docx') {
            // Check if mammoth is available
            if (typeof mammoth !== 'undefined') {
                return await parseDOCX(file);
            } else {
                throw new Error('DOCX parser không khả dụng. Vui lòng sử dụng file TXT hoặc MD.');
            }
        }
        
        throw new Error(`Định dạng file "${ext}" không được hỗ trợ.`);
        
    } catch (error) {
        // FILE PARSING GUARDRAILS: Reject if cannot parse
        throw new Error(`Không thể parse file "${file.name}": ${error.message}`);
    }
}

/**
 * Read text file as plain text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            if (!text || text.trim().length === 0) {
                reject(new Error('File rỗng hoặc không có nội dung văn bản.'));
            } else {
                resolve(text);
            }
        };
        reader.onerror = (e) => reject(new Error('Lỗi khi đọc file.'));
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Parse PDF file using pdfjs-dist
 */
async function parsePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += pageText + '\n';
        }
        
        if (!text || text.trim().length === 0) {
            throw new Error('PDF không chứa nội dung văn bản có thể đọc được.');
        }
        
        return text.trim();
    } catch (error) {
        throw new Error(`Lỗi khi parse PDF: ${error.message}`);
    }
}

/**
 * Parse DOCX file using mammoth
 */
async function parseDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
        
        if (result.messages && result.messages.length > 0) {
            console.warn('DOCX parse warnings:', result.messages);
        }
        
        const text = result.value;
        if (!text || text.trim().length === 0) {
            throw new Error('DOCX không chứa nội dung văn bản có thể đọc được.');
        }
        
        return text.trim();
    } catch (error) {
        throw new Error(`Lỗi khi parse DOCX: ${error.message}`);
    }
}

/**
 * Handle chat input
 */
function handleChatInput() {
    if (sendBtn && chatInput) {
        sendBtn.disabled = chatInput.value.trim() === '' || !uploadedFiles.length;
    }
}

/**
 * Handle send message
 */
async function handleSendMessage() {
    if (!chatInput || !uploadedFiles.length) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    updateUI();
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        // Call API - format for backend-day4
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: message,
                chat_history: [],
                limit: 3,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        // Backend-day4 returns: { status, answer, sources, model_used }
        const botResponse = data.answer || data.message || 'Xin lỗi, tôi không thể trả lời.';
        
        removeTypingIndicator(typingId);
        addMessage(botResponse, 'bot');
        
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addMessage(`Xin lỗi, có lỗi xảy ra: ${error.message}`, 'bot');
    }
}

/**
 * Add message to chat
 */
function addMessage(text, type) {
    if (!chatMessages) return;
    
    // Remove welcome message if exists
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    if (!chatMessages) return null;
    
    const typingId = 'typing-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = typingId;
    messageDiv.className = 'message bot';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    messageDiv.appendChild(typingDiv);
    chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
    
    return typingId;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
    const typingElement = document.getElementById(id);
    if (typingElement) {
        typingElement.remove();
    }
}

/**
 * Scroll to bottom
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            hideStatus();
        }, 5000);
    }
}

/**
 * Hide status message
 */
function hideStatus() {
    statusMessage.classList.remove('show');
}

