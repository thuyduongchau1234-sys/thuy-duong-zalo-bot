/* ============================================================
   app.js — Frontend Application Logic for Landing Page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ── Hamburger Menu Toggle ────────────────────────────
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking nav link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').className = 'fa-solid fa-bars';
            });
        });
    }

    // ── AI Face Diagnosis Core Variables ─────────────────
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    const btnCamera = document.getElementById('btnCamera');
    const btnRunAnalysis = document.getElementById('btnRunAnalysis');
    
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const resultsLoading = document.getElementById('resultsLoading');
    const resultsContent = document.getElementById('resultsContent');
    const resultsText = document.getElementById('resultsText');
    const btnShareZalo = document.getElementById('btnShareZalo');

    // Camera Stream Elements
    const cameraStreamContainer = document.getElementById('cameraStreamContainer');
    const videoElement = document.getElementById('videoElement');
    const btnCapture = document.getElementById('btnCapture');
    const btnCancelCamera = document.getElementById('btnCancelCamera');

    let base64ImageString = null; // Store base64 data URL
    let latestAnalysisResult = ''; // Store the raw text result of analysis

    // ── Image Handling Functions ─────────────────────────
    function handleImageSelected(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn tệp hình ảnh hợp lệ.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            base64ImageString = e.target.result;
            imagePreview.src = base64ImageString;
            
            // Show preview, hide dropzone content
            dropzoneContent.style.display = 'none';
            previewContainer.style.display = 'flex';
            
            // Enable run analysis button
            btnRunAnalysis.classList.remove('disabled');
            btnRunAnalysis.removeAttribute('disabled');
        };
        reader.readAsDataURL(file);
    }

    // Drag and drop event listeners
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--gold-primary)';
                dropzone.style.background = 'rgba(255, 255, 255, 0.9)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'rgba(6, 64, 43, 0.15)';
                dropzone.style.background = 'rgba(255, 255, 255, 0.5)';
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleImageSelected(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImageSelected(e.target.files[0]);
            }
        });
    }

    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering file chooser
            e.preventDefault();
            
            base64ImageString = null;
            imagePreview.src = '';
            fileInput.value = '';
            
            previewContainer.style.display = 'none';
            dropzoneContent.style.display = 'flex';
            
            btnRunAnalysis.classList.add('disabled');
            btnRunAnalysis.setAttribute('disabled', 'true');
        });
    }

    // ── Camera Stream Logic ──────────────────────────────
    let localStream = null;

    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });
                videoElement.srcObject = localStream;
                cameraStreamContainer.style.display = 'flex';
            } catch (err) {
                console.error('Camera access error:', err);
                alert('Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh lên từ thư viện.');
            }
        });
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            if (!localStream) return;

            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth || 640;
            canvas.height = videoElement.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            
            // Draw video frame to canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Get base64 string
            base64ImageString = canvas.toDataURL('image/jpeg');
            imagePreview.src = base64ImageString;

            // Stop stream
            stopCamera();

            // Display preview
            dropzoneContent.style.display = 'none';
            previewContainer.style.display = 'flex';
            
            // Enable run button
            btnRunAnalysis.classList.remove('disabled');
            btnRunAnalysis.removeAttribute('disabled');
        });
    }

    if (btnCancelCamera) {
        btnCancelCamera.addEventListener('click', () => {
            stopCamera();
        });
    }

    function stopCamera() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        videoElement.srcObject = null;
        cameraStreamContainer.style.display = 'none';
    }

    // ── Custom Markdown Parser Helper ────────────────────
    function parseMarkdown(md) {
        const lines = md.split('\n');
        let html = '';
        let inList = false;

        for (let line of lines) {
            line = line.trim();
            if (!line) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                continue;
            }

            // Bold: **text**
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic: *text*
            line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');

            // Headings
            if (line.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h3>${line.substring(4)}</h3>`;
            } else if (line.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('# ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${line.substring(2)}</li>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += `<p>${line}</p>`;
            }
        }

        if (inList) {
            html += '</ul>';
        }

        return html;
    }

    // ── Call AI Analysis API ──────────────────────────────
    if (btnRunAnalysis) {
        btnRunAnalysis.addEventListener('click', async () => {
            if (!base64ImageString) return;

            // Setup UI states
            resultsPlaceholder.style.display = 'none';
            resultsContent.style.display = 'none';
            resultsLoading.style.display = 'flex';

            // Scroll to results panel
            const resultsPanel = document.getElementById('resultsPanel');
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

            try {
                const response = await fetch('/api/analyze-face', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64ImageString })
                });

                const data = await response.json();

                if (data.success) {
                    latestAnalysisResult = data.result;
                    
                    // Render markdown using our custom parser
                    resultsText.innerHTML = parseMarkdown(latestAnalysisResult);

                    resultsLoading.style.display = 'none';
                    resultsContent.style.display = 'flex';
                } else {
                    throw new Error(data.error || 'Lỗi không xác định.');
                }
            } catch (err) {
                console.error('Analysis error:', err);
                resultsLoading.style.display = 'none';
                resultsPlaceholder.style.display = 'flex';
                
                // Show temporary error message
                const errTitle = resultsPlaceholder.querySelector('h4');
                const errText = resultsPlaceholder.querySelector('p');
                errTitle.textContent = 'Phân tích thất bại';
                errText.textContent = err.message || 'Có lỗi xảy ra khi kết nối máy chủ.';
                
                alert('Phân tích hình ảnh thất bại: ' + err.message);
            }
        });
    }

    // ── Share Analysis Results with Zalo Admin ────────────
    if (btnShareZalo) {
        btnShareZalo.addEventListener('click', async () => {
            if (!latestAnalysisResult) return;

            // Ask user for name/phone if they haven't filled it out
            const name = prompt('Vui lòng nhập Họ và tên để gửi báo cáo cho chuyên gia:');
            if (!name) return;
            const phone = prompt('Vui lòng nhập Số điện thoại liên hệ:');
            if (!phone) return;

            btnShareZalo.classList.add('disabled');
            btnShareZalo.setAttribute('disabled', 'true');
            btnShareZalo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

            try {
                const response = await fetch('/api/contact-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        phone,
                        needs: 'Phân tích diện mạo AI',
                        analysis: latestAnalysisResult
                    })
                });

                const data = await response.json();
                if (data.success) {
                    alert('Báo cáo phân tích diện mạo đã được gửi đến Zalo chị Thùy Dương thành công! Chị ấy sẽ sớm xem và liên hệ tư vấn chuyên sâu cho anh/chị.');
                    btnShareZalo.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã gửi báo cáo';
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                alert('Gửi báo cáo thất bại: ' + err.message);
                btnShareZalo.classList.remove('disabled');
                btnShareZalo.removeAttribute('disabled');
                btnShareZalo.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi Bản Phân Tích Qua Zalo Admin';
            }
        });
    }

    // ── Lead Registration Form Submission ─────────────────
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const btnSubmitForm = document.getElementById('btnSubmitForm');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const payload = {
                name: formData.get('fullName'),
                phone: formData.get('phoneNumber'),
                email: formData.get('email'),
                needs: formData.get('needs')
            };

            // Loading state
            btnSubmitForm.classList.add('disabled');
            btnSubmitForm.setAttribute('disabled', 'true');
            submitText.style.display = 'none';
            submitSpinner.style.display = 'block';
            formStatus.className = 'form-status';
            formStatus.textContent = '';

            try {
                const response = await fetch('/api/contact-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    formStatus.className = 'form-status success';
                    formStatus.textContent = '🎉 Đăng ký thành công! Trợ lý của chị Thùy Dương sẽ liên hệ với bạn trong thời gian sớm nhất.';
                    contactForm.reset();
                } else {
                    throw new Error(data.error || 'Có lỗi xảy ra.');
                }
            } catch (err) {
                formStatus.className = 'form-status error';
                formStatus.textContent = '❌ Đăng ký thất bại: ' + err.message;
            } finally {
                btnSubmitForm.classList.remove('disabled');
                btnSubmitForm.removeAttribute('disabled');
                submitText.style.display = 'block';
                submitSpinner.style.display = 'none';
            }
        });
    }
});
