// PESUmate — Chat with Slides (v4.0)
// Streaming responses, draggable sidebar, S-class UI
(function () {
    'use strict';
    if (window._pesuMateChatInitialized) return;
    window._pesuMateChatInitialized = true;

    var GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash';
    var DEFAULT_WIDTH = 440;
    var MIN_WIDTH = 320;
    var MAX_WIDTH = 800;

    // ─── Bridge ───
    var _msgId = 0, _pending = {};

    window.addEventListener('message', function (e) {
        if (e.source !== window || !e.data || e.data.direction !== 'pesumate-from-background') return;
        if (_pending[e.data.id]) { _pending[e.data.id](e.data.payload); delete _pending[e.data.id]; }
    });

    function bridge(msg, cb) {
        var id = 'pm_' + (++_msgId) + '_' + Date.now();
        _pending[id] = cb || function () { };
        window.postMessage({ direction: 'pesumate-to-background', id: id, payload: msg }, '*');
        setTimeout(function () { if (_pending[id]) { _pending[id]({}); delete _pending[id]; } }, 15000);
    }

    // Detect invalidated context errors
    function isContextInvalid(res) {
        return res && res.error === 'BRIDGE_ERROR' &&
            res.message && res.message.indexOf('invalidated') !== -1;
    }

    // ─── State ───
    var chatMessages = [];
    var slideContext = '';
    var selectedItems = [];
    var isProcessing = false;
    var currentItems = [];
    var sidebarOpen = false;
    var sidebarWidth = parseInt(localStorage.getItem('pesumate_sidebar_w')) || DEFAULT_WIDTH;
    var slideTexts = {}; // { title: extractedText }

    // ─── Persistent History ───
    function saveHistory(unit) {
        if (!unit || chatMessages.length === 0) return;
        bridge({
            type: 'SAVE_CHAT_HISTORY', unit: unit, data: {
                messages: chatMessages,
                context: slideContext,
                items: selectedItems.map(function (i) { return { id: i.id, title: i.title, isSlideUrl: i.isSlideUrl }; })
            }
        });
    }

    function loadHistory(unit, cb) {
        if (!unit) { cb(null); return; }
        bridge({ type: 'LOAD_CHAT_HISTORY', unit: unit }, function (r) { cb(r && r.data ? r.data : null); });
    }

    function clearHistory(unit) {
        if (unit) bridge({ type: 'CLEAR_CHAT_HISTORY', unit: unit });
    }

    function unitTab() {
        var $ = window.jQuery;
        return $ ? ($('#courselistunit li.active a').not('#pesu-dl-tab-btn a').text().trim() || '') : '';
    }

    // ─── Wait for PESUmate ───
    function waitReady(cb) {
        if (window._pesuMateInitialized && document.getElementById('pesu-dl-content')) { cb(); return; }
        var t = setInterval(function () {
            if (window._pesuMateInitialized && document.getElementById('pesu-dl-content')) { clearInterval(t); cb(); }
        }, 500);
    }

    // ─── Open Sidebar ───
    function openChat(items, restored) {
        if (sidebarOpen) return;
        sidebarOpen = true;
        selectedItems = items;

        // Auto-close the PESUmate panel to avoid overlap
        var panel = document.getElementById('pesu-dl-helper');
        var tabBtn = document.getElementById('pesu-dl-tab-btn');
        if (panel) panel.style.display = 'none';
        if (tabBtn) tabBtn.classList.remove('active');

        if (restored) {
            chatMessages = restored.messages || [];
            slideContext = restored.context || '';
        } else {
            chatMessages = [];
            slideContext = '';
        }

        var old = document.getElementById('pesu-chat-sidebar');
        if (old) old.remove();

        var sidebar = document.createElement('div');
        sidebar.className = 'pesu-chat-sidebar';
        sidebar.id = 'pesu-chat-sidebar';
        sidebar.style.width = sidebarWidth + 'px';

        // Drag handle
        var handle = document.createElement('div');
        handle.className = 'pesu-chat-drag-handle';
        sidebar.appendChild(handle);
        initDrag(handle, sidebar);

        // Header
        var header = document.createElement('div');
        header.className = 'pesu-chat-header';
        header.innerHTML =
            '<button class="close-btn" id="pesu-chat-close" title="Close">&times;</button>' +
            '<div class="title">PESUmate AI <span class="creator">by Mohit Paddhariya</span></div>' +
            '<div class="actions">' +
            '<button id="pesu-chat-history-btn">History</button>' +
            '<button id="pesu-chat-clear-btn">Clear</button>' +
            '</div>';
        sidebar.appendChild(header);

        // Context manager (expandable)
        var ctx = document.createElement('div');
        ctx.className = 'pesu-chat-context';
        ctx.id = 'pesu-chat-context';
        sidebar.appendChild(ctx);
        // renderContextBanner called after sidebar is in DOM (below)

        // Extract area
        var extract = document.createElement('div');
        extract.className = 'pesu-chat-extract-progress';
        extract.id = 'pesu-chat-extract';
        extract.style.display = 'none';
        sidebar.appendChild(extract);

        // Messages
        var msgs = document.createElement('div');
        msgs.className = 'pesu-chat-messages';
        msgs.id = 'pesu-chat-messages';
        sidebar.appendChild(msgs);

        // Typing
        var typing = document.createElement('div');
        typing.className = 'pesu-chat-typing';
        typing.id = 'pesu-chat-typing';
        typing.innerHTML = '<span class="label">Thinking</span><span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        sidebar.appendChild(typing);

        // Input
        var inputArea = document.createElement('div');
        inputArea.className = 'pesu-chat-input-area';
        inputArea.innerHTML =
            '<textarea id="pesu-chat-input" placeholder="Ask about your slides..." rows="1"></textarea>' +
            '<button class="pesu-chat-send-btn" id="pesu-chat-send-btn">&#x27A4;</button>';
        sidebar.appendChild(inputArea);

        document.body.appendChild(sidebar);
        document.body.classList.add('pesu-chat-open');
        document.body.style.marginRight = sidebarWidth + 'px';

        // Now render context banner (sidebar is in DOM)
        renderContextBanner();

        // Events
        document.getElementById('pesu-chat-close').onclick = closeChat;
        document.getElementById('pesu-chat-clear-btn').onclick = clearChat;
        document.getElementById('pesu-chat-send-btn').onclick = sendMessage;
        document.getElementById('pesu-chat-history-btn').onclick = toggleHistory;

        var input = document.getElementById('pesu-chat-input');
        input.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
        input.oninput = function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; };

        if (restored && restored.messages && restored.messages.length > 0) {
            restored.messages.forEach(function (m) { appendMessage(m.role === 'user' ? 'user' : 'ai', m.text); });
        } else {
            checkKeyAndProceed(items);
        }

        input.focus();
    }

    // ─── Drag Resize ───
    function initDrag(handle, sidebar) {
        var dragging = false;

        handle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            dragging = true;
            handle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var w = window.innerWidth - e.clientX;
            w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w));
            sidebarWidth = w;
            sidebar.style.width = w + 'px';
            document.body.style.marginRight = w + 'px';
        });

        document.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            handle.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            localStorage.setItem('pesumate_sidebar_w', sidebarWidth);
        });
    }

    // ─── API Key Check ───
    function checkKeyAndProceed(items) {
        bridge({ type: 'GET_API_KEY' }, function (r) {
            if (isContextInvalid(r)) {
                showError('Extension was reloaded. Please refresh this page (Ctrl+R).');
                return;
            }
            if (r && r.key) {
                extractAndWelcome(items);
            } else {
                showError('No API key set. Click the PESUmate icon in your toolbar to add one.');
            }
        });
    }

    function extractAndWelcome(items) {
        var m = document.getElementById('pesu-chat-messages');
        if (!m) return;
        m.innerHTML = '<div class="pesu-chat-welcome"><h4>Loading slides...</h4><p>Extracting text content</p></div>';
        extractSlides(items);
    }

    // ─── Close ───
    function closeChat() {
        saveHistory(unitTab());
        sidebarOpen = false;
        var sb = document.getElementById('pesu-chat-sidebar');
        if (sb) {
            sb.style.animation = 'none';
            sb.style.opacity = '0';
            sb.style.transform = 'translateX(40px)';
            sb.style.transition = 'opacity 0.2s, transform 0.2s';
            setTimeout(function () { sb.remove(); }, 200);
        }
        document.body.classList.remove('pesu-chat-open');
        document.body.style.marginRight = '';

        // Reopen the PESUmate panel
        var panel = document.getElementById('pesu-dl-helper');
        var tabBtn = document.getElementById('pesu-dl-tab-btn');
        if (panel) { panel.style.display = ''; jQuery(panel).slideDown(200); }
        if (tabBtn) tabBtn.classList.add('active');
        window.dispatchEvent(new Event('pesumate-rerender'));
    }

    // ─── History Panel ───
    function toggleHistory() {
        var existing = document.getElementById('pesu-chat-history-panel');
        if (existing) { existing.remove(); return; }

        bridge({ type: 'LIST_CHAT_HISTORY' }, function (res) {
            var entries = (res && res.entries) || [];
            var sidebar = document.getElementById('pesu-chat-sidebar');
            if (!sidebar) return;

            var panel = document.createElement('div');
            panel.id = 'pesu-chat-history-panel';
            panel.className = 'pesu-chat-history-panel';

            if (entries.length === 0) {
                panel.innerHTML = '<div class="pesu-chat-history-empty">No saved chats yet</div>';
            } else {
                var title = document.createElement('div');
                title.className = 'pesu-chat-history-title';
                title.textContent = 'Chat History';
                panel.appendChild(title);

                entries.forEach(function (entry) {
                    var row = document.createElement('div');
                    row.className = 'pesu-chat-history-row';

                    var item = document.createElement('button');
                    item.className = 'pesu-chat-history-item';
                    var msgCount = entry.data.messages ? entry.data.messages.length : 0;
                    var slideCount = entry.data.items ? entry.data.items.length : 0;
                    item.innerHTML =
                        '<div class="unit-name">' + entry.unit + '</div>' +
                        '<div class="meta">' + slideCount + ' slides \u00b7 ' + msgCount + ' messages</div>';
                    item.onclick = function () {
                        panel.remove();
                        openNewFromHistory(entry);
                    };

                    var delBtn = document.createElement('button');
                    delBtn.className = 'pesu-chat-history-delete';
                    delBtn.title = 'Delete this chat';
                    delBtn.innerHTML = '&#x1F5D1;';
                    delBtn.onclick = function (e) {
                        e.stopPropagation();
                        clearHistory(entry.unit);
                        row.style.transition = 'opacity 0.2s, transform 0.2s';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(20px)';
                        setTimeout(function () {
                            row.remove();
                            // If no entries left, show empty state
                            if (!panel.querySelector('.pesu-chat-history-row')) {
                                panel.innerHTML = '<div class="pesu-chat-history-empty">No saved chats yet</div>';
                            }
                        }, 200);
                    };

                    row.appendChild(item);
                    row.appendChild(delBtn);
                    panel.appendChild(row);
                });
            }

            // Insert after header
            var header = sidebar.querySelector('.pesu-chat-header');
            if (header && header.nextSibling) {
                sidebar.insertBefore(panel, header.nextSibling);
            } else {
                sidebar.appendChild(panel);
            }
        });
    }

    function openNewFromHistory(entry) {
        // Close current and open with restored data
        sidebarOpen = false;
        var sb = document.getElementById('pesu-chat-sidebar');
        if (sb) sb.remove();
        document.body.classList.remove('pesu-chat-open');
        document.body.style.marginRight = '';
        openChat(entry.data.items, entry.data);
    }

    // ─── Context Banner (expandable with add/remove) ───
    function renderContextBanner() {
        var ctx = document.getElementById('pesu-chat-context');
        if (!ctx) return;

        var count = selectedItems.length;
        var expanded = ctx.classList.contains('expanded');

        var html = '<div class="pesu-ctx-summary" id="pesu-ctx-toggle">' +
            '<strong>' + count + ' slide' + (count > 1 ? 's' : '') + '</strong> in context' +
            '<span class="pesu-ctx-arrow">' + (expanded ? '\u25B4' : '\u25BE') + '</span>' +
            '</div>';

        if (expanded) {
            html += '<div class="pesu-ctx-list">';
            selectedItems.forEach(function (item, idx) {
                var hasText = slideTexts[item.title] && slideTexts[item.title].length > 0;
                html += '<div class="pesu-ctx-slide">' +
                    '<span class="pesu-ctx-status ' + (hasText ? 'ok' : 'none') + '">' +
                    (hasText ? '\u2713' : '\u2013') + '</span>' +
                    '<span class="pesu-ctx-name">' + item.title + '</span>' +
                    '<button class="pesu-ctx-remove" data-idx="' + idx + '">\u00d7</button>' +
                    '</div>';
            });
            html += '<button class="pesu-ctx-add" id="pesu-ctx-add">+ Add slides</button>';
            html += '</div>';
        }

        ctx.innerHTML = html;

        // Toggle expand
        document.getElementById('pesu-ctx-toggle').onclick = function () {
            ctx.classList.toggle('expanded');
            renderContextBanner();
        };

        // Remove buttons
        if (expanded) {
            ctx.querySelectorAll('.pesu-ctx-remove').forEach(function (btn) {
                btn.onclick = function (e) {
                    e.stopPropagation();
                    var idx = parseInt(btn.dataset.idx);
                    removeSlide(idx);
                };
            });

            var addBtn = document.getElementById('pesu-ctx-add');
            if (addBtn) addBtn.onclick = addMoreSlides;
        }
    }

    function removeSlide(idx) {
        if (idx < 0 || idx >= selectedItems.length) return;
        var removed = selectedItems.splice(idx, 1)[0];
        delete slideTexts[removed.title];
        rebuildContext();
        renderContextBanner();

        if (selectedItems.length === 0) {
            closeChat();
        }
    }

    function rebuildContext() {
        var parts = [];
        selectedItems.forEach(function (item) {
            var text = slideTexts[item.title];
            if (text) parts.push('=== ' + item.title + ' ===\n' + text);
        });
        slideContext = parts.join('\n\n');
        if (slideContext.length > 500000) slideContext = slideContext.slice(0, 500000) + '\n[truncated]';
    }

    function addMoreSlides() {
        // Temporarily show the PESUmate panel for slide selection
        var panel = document.getElementById('pesu-dl-helper');
        var tabBtn = document.getElementById('pesu-dl-tab-btn');
        if (panel) { panel.style.display = ''; jQuery(panel).slideDown(200); }
        if (tabBtn) tabBtn.classList.add('active');

        // Add a one-time listener for the "add to context" action
        var banner = document.createElement('div');
        banner.className = 'pesu-ctx-add-banner';
        banner.id = 'pesu-ctx-add-banner';
        banner.innerHTML = '<span>Select slides below, then click</span>' +
            '<button id="pesu-ctx-add-confirm">Add to chat</button>' +
            '<button id="pesu-ctx-add-cancel">Cancel</button>';

        var ctx = document.getElementById('pesu-chat-context');
        if (ctx) ctx.parentNode.insertBefore(banner, ctx.nextSibling);

        document.getElementById('pesu-ctx-add-cancel').onclick = function () {
            banner.remove();
            if (panel) panel.style.display = 'none';
            if (tabBtn) tabBtn.classList.remove('active');
        };

        document.getElementById('pesu-ctx-add-confirm').onclick = function () {
            // Get checked items from the panel
            var cbs = document.querySelectorAll('#pesu-dl-content .pesu-dl-item-row input[type="checkbox"]');
            var newItems = [];
            cbs.forEach(function (cb) {
                if (cb.checked) {
                    var idx = parseInt(cb.dataset.i || cb.dataset.itemIndex);
                    if (currentItems[idx]) {
                        var existing = selectedItems.some(function (s) { return s.title === currentItems[idx].title; });
                        if (!existing) newItems.push(currentItems[idx]);
                    }
                }
            });

            banner.remove();
            if (panel) panel.style.display = 'none';
            if (tabBtn) tabBtn.classList.remove('active');

            if (newItems.length > 0) {
                selectedItems = selectedItems.concat(newItems);
                renderContextBanner();
                extractNewSlides(newItems);
            }
        };
    }

    async function extractNewSlides(newItems) {
        var msgs = document.getElementById('pesu-chat-messages');
        if (!msgs) return;

        for (var i = 0; i < newItems.length; i++) {
            var item = newItems[i];
            try {
                var url = item.isSlideUrl ? item.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + item.id;
                var resp = await fetch(url, { credentials: 'same-origin' });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var buf = await resp.arrayBuffer();
                var hdr = new Uint8Array(buf.slice(0, 5));
                var isPdf = hdr[0] === 0x25 && hdr[1] === 0x50 && hdr[2] === 0x44 && hdr[3] === 0x46;
                var isZip = hdr[0] === 0x50 && hdr[1] === 0x4B;
                var text = isPdf ? await extractPdf(buf) : isZip ? await extractPptx(buf) : '';
                slideTexts[item.title] = text.trim() || '';
            } catch (e) {
                slideTexts[item.title] = '';
            }
        }

        rebuildContext();
        renderContextBanner();
        saveHistory(unitTab());
    }

    function clearChat() {
        chatMessages = [];
        clearHistory(unitTab());
        var m = document.getElementById('pesu-chat-messages');
        if (!m) return;
        m.innerHTML = '<div class="pesu-chat-welcome"><h4>Chat cleared</h4><p>Context still loaded. Ask a new question.</p></div>';
        showChips(m);
    }

    // ─── Extraction ───
    async function extractSlides(items) {
        var ext = document.getElementById('pesu-chat-extract');
        var msgs = document.getElementById('pesu-chat-messages');
        if (!ext) return;

        ext.style.display = 'block';
        if (msgs) msgs.style.display = 'none';

        ext.innerHTML = '<div style="font-size:12px;font-weight:600;color:#111827;margin-bottom:10px">Extracting slides</div>';
        var rows = [];
        for (var i = 0; i < items.length; i++) {
            var row = document.createElement('div');
            row.className = 'pesu-chat-extract-item';
            row.innerHTML = '<span class="icon">&bull;</span><span class="name">' + items[i].title + '</span>';
            ext.appendChild(row);
            rows.push(row);
        }

        var allText = [], failed = 0, imgOnly = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i], row = rows[i];
            row.className = 'pesu-chat-extract-item active';
            row.querySelector('.icon').innerHTML = '<div class="spinner-sm"></div>';

            try {
                var url = item.isSlideUrl ? item.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + item.id;
                var resp = await fetch(url, { credentials: 'same-origin' });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var buf = await resp.arrayBuffer();
                var hdr = new Uint8Array(buf.slice(0, 5));
                var pdf = hdr[0] === 0x25 && hdr[1] === 0x50 && hdr[2] === 0x44 && hdr[3] === 0x46;
                var zip = hdr[0] === 0x50 && hdr[1] === 0x4B;

                var text = pdf ? await extractPdf(buf) : zip ? await extractPptx(buf) : '';

                if (text.trim()) {
                    allText.push('=== ' + item.title + ' ===\n' + text.trim());
                    slideTexts[item.title] = text.trim();
                    row.className = 'pesu-chat-extract-item done';
                    row.querySelector('.icon').textContent = '\u2713';
                } else {
                    allText.push('=== ' + item.title + ' ===\n[Image-based — no text]');
                    slideTexts[item.title] = '';
                    imgOnly.push(item.title);
                    failed++;
                    row.className = 'pesu-chat-extract-item failed';
                    row.querySelector('.icon').textContent = '\u2013';
                }
            } catch (err) {
                failed++;
                slideTexts[item.title] = '';
                row.className = 'pesu-chat-extract-item failed';
                row.querySelector('.icon').textContent = '\u2717';
            }
        }

        slideContext = allText.join('\n\n');
        if (slideContext.length > 500000) slideContext = slideContext.slice(0, 500000) + '\n[truncated]';

        renderContextBanner();

        ext.style.display = 'none';
        if (msgs) {
            msgs.style.display = 'block';
            msgs.innerHTML = '';

            if (imgOnly.length > 0 && imgOnly.length < items.length) {
                showWarning(msgs, imgOnly.length + ' slide' + (imgOnly.length > 1 ? 's are' : ' is') + ' image-based \u2014 text extraction not supported for those.');
            } else if (failed === items.length) {
                showWarning(msgs, 'These slides appear to be image-based. Try selecting slides with text content.');
            }

            if (failed < items.length) {
                var w = document.createElement('div');
                w.className = 'pesu-chat-welcome';
                w.innerHTML = '<h4>Ready</h4><p>' + (items.length - failed) + ' slide' + ((items.length - failed) > 1 ? 's' : '') + ' loaded as context</p>';
                msgs.appendChild(w);
                showChips(msgs);
            }
        }

        saveHistory(unitTab());
    }

    function showWarning(parent, msg) {
        var d = document.createElement('div');
        d.className = 'pesu-chat-image-warn';
        d.textContent = msg;
        parent.appendChild(d);
    }

    function showChips(parent) {
        var chips = ['Summarize all slides', 'What are the key concepts?', 'Quiz me on this'];
        var c = document.createElement('div');
        c.className = 'pesu-chat-suggestions';
        c.id = 'pesu-chat-suggestions';
        chips.forEach(function (t) {
            var b = document.createElement('button');
            b.className = 'pesu-chat-chip';
            b.textContent = t;
            b.onclick = function () {
                var inp = document.getElementById('pesu-chat-input');
                if (inp) { inp.value = t; sendMessage(); }
            };
            c.appendChild(b);
        });
        parent.appendChild(c);
    }

    // ─── pdf.js ───
    var _pdfjs = null;

    async function loadPdfJs() {
        if (_pdfjs) return _pdfjs;
        var meta = document.querySelector('meta[name="pesumate-extension-url"]');
        var base = meta ? meta.content : null;
        if (!base) {
            var links = document.querySelectorAll('link[href*="chrome-extension"]');
            for (var i = 0; i < links.length; i++) {
                var m = (links[i].href || '').match(/(chrome-extension:\/\/[^/]+)\//);
                if (m) { base = m[1] + '/'; break; }
            }
        }
        if (!base) return null;
        try {
            _pdfjs = await import(base + 'lib/pdf.min.js');
            if (_pdfjs.GlobalWorkerOptions) _pdfjs.GlobalWorkerOptions.workerSrc = base + 'lib/pdf.worker.min.js';
            return _pdfjs;
        } catch (e) { return null; }
    }

    async function extractPdf(buf) {
        var lib = await loadPdfJs();
        if (lib) {
            try {
                var doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
                var t = [];
                for (var p = 1; p <= doc.numPages; p++) {
                    var pg = await doc.getPage(p);
                    var tc = await pg.getTextContent();
                    var s = tc.items.map(function (i) { return i.str; }).join(' ');
                    if (s.trim()) t.push(s.trim());
                }
                if (t.join('').length > 10) return t.join('\n');
            } catch (e) { }
        }
        // Fallback
        var raw = '', bytes = new Uint8Array(buf);
        for (var i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
        var chunks = [], m;
        var re = /\(([^)]*)\)\s*Tj/g;
        while ((m = re.exec(raw)) !== null) chunks.push(m[1]);
        return chunks.join('\n');
    }

    async function extractPptx(buf) {
        try {
            var zip = await JSZip.loadAsync(buf);
            var files = [];
            zip.forEach(function (p) {
                if (/^ppt\/slides\/slide\d+\.xml$/i.test(p))
                    files.push({ path: p, num: parseInt(p.match(/slide(\d+)/)[1]) });
            });
            files.sort(function (a, b) { return a.num - b.num; });
            var out = [];
            for (var i = 0; i < files.length; i++) {
                var xml = await zip.file(files[i].path).async('text');
                var texts = [], m;
                var r = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
                while ((m = r.exec(xml)) !== null) texts.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
                if (texts.join('').trim()) out.push('Slide ' + files[i].num + ': ' + texts.join(' '));
            }
            return out.join('\n\n');
        } catch (e) { return ''; }
    }

    // ─── Streaming Send ───
    async function sendMessage() {
        var input = document.getElementById('pesu-chat-input');
        var text = input.value.trim();
        if (!text || isProcessing) return;

        chatMessages.push({ role: 'user', text: text });
        appendMessage('user', text);
        input.value = '';
        input.style.height = 'auto';

        // Remove welcome/chips
        var w = document.querySelector('#pesu-chat-messages .pesu-chat-welcome');
        if (w) w.remove();
        var s = document.getElementById('pesu-chat-suggestions');
        if (s) s.remove();

        isProcessing = true;
        document.getElementById('pesu-chat-send-btn').disabled = true;
        var typing = document.getElementById('pesu-chat-typing');
        if (typing) typing.style.display = 'flex';

        // Get API key
        bridge({ type: 'GET_API_KEY' }, async function (res) {
            if (isContextInvalid(res)) {
                isProcessing = false;
                document.getElementById('pesu-chat-send-btn').disabled = false;
                if (typing) typing.style.display = 'none';
                showError('Extension was reloaded. Please refresh this page (Ctrl+R).');
                chatMessages.pop();
                return;
            }
            var apiKey = res && res.key;
            if (!apiKey) {
                isProcessing = false;
                document.getElementById('pesu-chat-send-btn').disabled = false;
                if (typing) typing.style.display = 'none';
                showError('No API key set. Click the PESUmate icon to add one.');
                chatMessages.pop();
                return;
            }

            try {
                await streamResponse(apiKey);
            } catch (err) {
                isProcessing = false;
                document.getElementById('pesu-chat-send-btn').disabled = false;
                if (typing) typing.style.display = 'none';
                showError(err.message || 'Something went wrong.');
                chatMessages.pop();
            }
        });
    }

    async function streamResponse(apiKey) {
        var typing = document.getElementById('pesu-chat-typing');
        var contents = buildContents(slideContext, chatMessages);

        var resp = await fetch(GEMINI_API + ':streamGenerateContent?alt=sse&key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 8192 },
                systemInstruction: { parts: [{ text: PESUMATE_SYSTEM_PROMPT }] }
            })
        });

        if (!resp.ok) {
            var errText = await resp.text();
            if (resp.status === 429) throw new Error('Rate limit exceeded. Wait a moment or change your API key in the popup.');
            if (resp.status === 403) throw new Error('API key is invalid. Check your key in the popup.');
            throw new Error('API error (' + resp.status + ')');
        }

        if (typing) typing.style.display = 'none';

        // Create AI message bubble for streaming
        var msgArea = document.getElementById('pesu-chat-messages');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'pesu-chat-msg ai';

        var label = document.createElement('div');
        label.className = 'pesu-chat-msg-label';
        label.textContent = 'PESUMATE AI';

        var bubble = document.createElement('div');
        bubble.className = 'pesu-chat-msg-bubble';
        bubble.innerHTML = '<span class="streaming-cursor"></span>';

        msgDiv.appendChild(label);
        msgDiv.appendChild(bubble);
        msgArea.appendChild(msgDiv);

        var fullText = '';
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        while (true) {
            var result = await reader.read();
            if (result.done) break;

            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line.startsWith('data: ')) continue;
                var jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') continue;

                try {
                    var chunk = JSON.parse(jsonStr);
                    var chunkText = chunk.candidates && chunk.candidates[0] &&
                        chunk.candidates[0].content && chunk.candidates[0].content.parts &&
                        chunk.candidates[0].content.parts[0] && chunk.candidates[0].content.parts[0].text;
                    if (chunkText) {
                        fullText += chunkText;
                        bubble.innerHTML = renderMarkdown(fullText) + '<span class="streaming-cursor"></span>';
                        msgArea.scrollTop = msgArea.scrollHeight;
                    }
                } catch (e) { }
            }
        }

        // Final render without cursor
        bubble.innerHTML = renderMarkdown(fullText);

        // Add copy button below
        var actions = document.createElement('div');
        actions.className = 'pesu-chat-msg-actions';
        var copyBtn = document.createElement('button');
        copyBtn.className = 'pesu-chat-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = function () {
            navigator.clipboard.writeText(fullText).then(function () {
                copyBtn.textContent = 'Copied';
                setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
            });
        };
        actions.appendChild(copyBtn);
        msgDiv.appendChild(actions);

        chatMessages.push({ role: 'model', text: fullText });
        saveHistory(unitTab());

        isProcessing = false;
        document.getElementById('pesu-chat-send-btn').disabled = false;
    }

    function buildContents(context, messages) {
        var out = [];
        if (context && messages.length > 0) {
            out.push({
                role: 'user',
                parts: [{ text: 'Here is the content from my course slides:\n\n---\n' + context + '\n---\n\nBased on the above, answer:\n' + messages[0].text }]
            });
            for (var i = 1; i < messages.length; i++) {
                out.push({ role: messages[i].role === 'user' ? 'user' : 'model', parts: [{ text: messages[i].text }] });
            }
        }
        return out;
    }

    // ─── Append Message ───
    function appendMessage(role, text) {
        var msgArea = document.getElementById('pesu-chat-messages');
        if (!msgArea) return;

        var d = document.createElement('div');
        d.className = 'pesu-chat-msg ' + (role === 'user' ? 'user' : 'ai');

        var label = document.createElement('div');
        label.className = 'pesu-chat-msg-label';
        label.textContent = role === 'user' ? 'YOU' : 'PESUMATE AI';

        var bubble = document.createElement('div');
        bubble.className = 'pesu-chat-msg-bubble';

        if (role === 'ai') {
            bubble.innerHTML = renderMarkdown(text);
            // Copy button
            var actions = document.createElement('div');
            actions.className = 'pesu-chat-msg-actions';
            var cb = document.createElement('button');
            cb.className = 'pesu-chat-copy-btn';
            cb.textContent = 'Copy';
            cb.onclick = function () {
                navigator.clipboard.writeText(text).then(function () {
                    cb.textContent = 'Copied';
                    setTimeout(function () { cb.textContent = 'Copy'; }, 1500);
                });
            };
            actions.appendChild(cb);
            d.appendChild(label);
            d.appendChild(bubble);
            d.appendChild(actions);
        } else {
            bubble.textContent = text;
            d.appendChild(label);
            d.appendChild(bubble);
        }

        msgArea.appendChild(d);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    // ─── Markdown ───
    function renderMarkdown(text) {
        var h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        h = h.replace(/```(\w*)\n([\s\S]*?)```/g, function (_, l, c) { return '<pre><code>' + c.trim() + '</code></pre>'; });
        h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
        h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        h = h.replace(/^[-•*]\s+(.+)/gm, '<li>$1</li>');
        h = h.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
        h = h.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');
        h = h.replace(/\n/g, '<br>');
        h = h.replace(/<\/pre><br>/g, '</pre>');
        h = h.replace(/<\/ul><br>/g, '</ul>');
        h = h.replace(/<\/h[123]><br>/g, function (m) { return m.replace('<br>', ''); });
        return h;
    }

    // ─── Error ───
    function showError(msg) {
        var m = document.getElementById('pesu-chat-messages');
        if (!m) return;
        var d = document.createElement('div');
        d.className = 'pesu-chat-error';
        d.textContent = msg;
        m.appendChild(d);
        m.scrollTop = m.scrollHeight;
    }

    // ─── Hook ───
    window.addEventListener('pesumate-items-rendered', function (e) {
        var items = e.detail.items;
        if (!items || !items.length) return;
        currentItems = items;
        injectControls(items);
    });

    // ─── Controls ───
    function injectControls(items) {
        var area = document.getElementById('pesu-dl-content');
        if (!area || area.querySelector('.pesu-select-all-row')) return;
        var $ = window.jQuery;
        if (!$) return;

        var chatBtn = document.createElement('button');
        chatBtn.className = 'pesu-chat-toggle-btn';
        chatBtn.id = 'pesu-chat-toggle-btn';
        chatBtn.textContent = 'Chat with Selected';
        chatBtn.style.display = 'none';

        var merge = area.querySelector('.pesu-dl-merge-btn');
        if (merge) merge.parentNode.insertBefore(chatBtn, merge.nextSibling);
        else area.insertBefore(chatBtn, area.firstChild);

        var selAll = document.createElement('label');
        selAll.className = 'pesu-select-all-row';
        selAll.style.display = 'flex';
        var selCb = document.createElement('input');
        selCb.type = 'checkbox';
        selAll.appendChild(selCb);
        var selText = document.createElement('span');
        selText.textContent = 'Select all for AI chat';
        selAll.appendChild(selText);
        chatBtn.parentNode.insertBefore(selAll, chatBtn.nextSibling);

        var btns = area.querySelectorAll('.pesu-dl-item');
        var cbs = [];

        btns.forEach(function (btn, idx) {
            if (btn.parentNode.classList && btn.parentNode.classList.contains('pesu-dl-item-row')) return;
            var row = document.createElement('div');
            row.className = 'pesu-dl-item-row';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.dataset.i = idx;
            cbs.push(cb);
            btn.parentNode.insertBefore(row, btn);
            row.appendChild(cb);
            row.appendChild(btn);
        });

        chatBtn.onclick = function () {
            var sel = [];
            cbs.forEach(function (c) { if (c.checked) { var i = parseInt(c.dataset.i); if (items[i]) sel.push(items[i]); } });
            if (sel.length > 0) openChat(sel);
        };

        // When user checks slides, show chatBtn
        function updateBtn() {
            var sel = cbs.filter(function (c) { return c.checked; });
            if (sel.length > 0) {
                chatBtn.style.display = 'flex';
                chatBtn.textContent = 'Chat with ' + sel.length + ' slide' + (sel.length > 1 ? 's' : '');
            } else {
                chatBtn.style.display = 'none';
            }
            selCb.checked = cbs.length > 0 && sel.length === cbs.length;
            selCb.indeterminate = sel.length > 0 && sel.length < cbs.length;
        }

        cbs.forEach(function (cb) { cb.onchange = updateBtn; });
        selCb.onchange = function () { cbs.forEach(function (c) { c.checked = selCb.checked; }); updateBtn(); };
    }

    // ─── Init ───
    waitReady(function () { console.log('[PESUmate Chat] v4.0 ready'); });
})();
