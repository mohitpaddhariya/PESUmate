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
    var PREVIEW_WIDTH = 480;
    var previewOpen = false;
    var FOCUS_WIDTH = 680;
    var inlinePreviewOpen = false;
    var splitRatio = parseFloat(localStorage.getItem('pesumate_split_ratio')) || 0.45;
    var fullscreenMode = false;

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
    var slideBuffers = {}; // { title: { buf, isPdf, isZip } }
    var slidePageTexts = {}; // { title: ['page1text', 'page2text', ...] } for per-page matching
    var _lastScrolledPage = null; // track last auto-scrolled target to avoid repeat scrolls

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
            '<button id="pesu-chat-fullscreen-btn" title="Fullscreen slides">&#x26F6;</button>' +
            '<button id="pesu-chat-slides-btn" title="Toggle slide preview">Slides</button>' +
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

        // Inline Preview (Focus Mode — slides rendered inside sidebar)
        var inlinePreview = document.createElement('div');
        inlinePreview.className = 'pesu-chat-inline-preview';
        inlinePreview.id = 'pesu-chat-inline-preview';
        sidebar.appendChild(inlinePreview);

        // DnD Splitter between preview and chat
        var splitterEl = document.createElement('div');
        splitterEl.className = 'pesu-chat-splitter';
        splitterEl.id = 'pesu-chat-splitter';
        splitterEl.innerHTML = '<div class="pesu-chat-splitter-handle"></div>';
        sidebar.appendChild(splitterEl);
        initSplitterDrag(splitterEl);

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
        document.getElementById('pesu-chat-slides-btn').onclick = toggleInlinePreview;
        document.getElementById('pesu-chat-fullscreen-btn').onclick = toggleFullscreen;

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
            if (previewOpen) w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.min(w, window.innerWidth - PREVIEW_WIDTH - 20)));
            else w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w));
            sidebarWidth = w;
            sidebar.style.width = w + 'px';
            updateBodyMargin();
            // Reposition preview panel
            var pp = document.getElementById('pesu-preview-panel');
            if (pp) pp.style.right = w + 'px';
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

    function updateBodyMargin() {
        if (previewOpen) {
            document.body.style.marginRight = (sidebarWidth + PREVIEW_WIDTH) + 'px';
        } else {
            document.body.style.marginRight = sidebarWidth + 'px';
        }
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
        previewOpen = false;
        inlinePreviewOpen = false;
        if (fullscreenMode) exitFullscreen();
        var sb = document.getElementById('pesu-chat-sidebar');
        if (sb) {
            sb.style.animation = 'none';
            sb.style.opacity = '0';
            sb.style.transform = 'translateX(40px)';
            sb.style.transition = 'opacity 0.2s, transform 0.2s';
            setTimeout(function () { sb.remove(); }, 200);
        }
        // Remove preview panel
        var pp = document.getElementById('pesu-preview-panel');
        if (pp) pp.remove();

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
                    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
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
                var hasBuf = !!slideBuffers[item.title];
                html += '<div class="pesu-ctx-slide" data-slide-idx="' + idx + '" data-slide-title="' + item.title.replace(/"/g, '&quot;') + '">' +
                    '<span class="pesu-ctx-status ' + (hasText ? 'ok' : 'none') + '">' +
                    (hasText ? '\u2713' : '\u2013') + '</span>' +
                    '<span class="pesu-ctx-name">' + item.title + '</span>' +
                    (hasBuf ? '<button class="pesu-ctx-preview" data-idx="' + idx + '" title="Preview">&#128065;</button>' : '') +
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

            // Preview buttons
            ctx.querySelectorAll('.pesu-ctx-preview').forEach(function (btn) {
                btn.onclick = function (e) {
                    e.stopPropagation();
                    var idx = parseInt(btn.dataset.idx);
                    if (selectedItems[idx]) {
                        if (inlinePreviewOpen) {
                            renderInlineSlides(selectedItems[idx].title);
                        } else {
                            openInlinePreview(selectedItems[idx].title);
                        }
                    }
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
        delete slideBuffers[removed.title];
        delete slidePageTexts[removed.title];
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

    // ─── Preview Panel (separate left-side panel with PDF/PPTX preview) ───
    function togglePreviewPanel() {
        if (previewOpen) {
            closePreviewPanel();
        } else {
            var first = selectedItems.find(function (it) { return !!slideBuffers[it.title]; });
            if (first) openPreview(first.title);
        }
    }

    function closePreviewPanel() {
        previewOpen = false;
        var pp = document.getElementById('pesu-preview-panel');
        if (pp) {
            pp.style.opacity = '0';
            pp.style.transform = 'translateX(-20px)';
            setTimeout(function () { pp.remove(); }, 200);
        }
        updateBodyMargin();
        // Update Slides button state
        var btn = document.getElementById('pesu-chat-slides-btn');
        if (btn) btn.classList.remove('active');
    }

    // ─── Inline Preview (Focus Mode — slides + chat unified in sidebar) ───
    function toggleInlinePreview() {
        if (inlinePreviewOpen) {
            closeInlinePreview();
        } else {
            var first = selectedItems.find(function (it) { return !!slideBuffers[it.title]; });
            if (first) openInlinePreview(first.title);
        }
    }

    function openInlinePreview(activeTitle) {
        var preview = document.getElementById('pesu-chat-inline-preview');
        var splitter = document.getElementById('pesu-chat-splitter');
        if (!preview || !splitter) return;

        // Close old side panel if open
        if (previewOpen) closePreviewPanel();

        inlinePreviewOpen = true;
        preview.style.display = 'flex';
        splitter.style.display = 'flex';

        // Widen sidebar for focus mode
        var sidebar = document.getElementById('pesu-chat-sidebar');
        if (sidebar && sidebarWidth < FOCUS_WIDTH) {
            sidebarWidth = FOCUS_WIDTH;
            sidebar.style.width = sidebarWidth + 'px';
            localStorage.setItem('pesumate_sidebar_w', sidebarWidth);
        }
        updateBodyMargin();
        applySplitRatio();

        // Update button state
        var btn = document.getElementById('pesu-chat-slides-btn');
        if (btn) { btn.classList.add('active'); btn.textContent = 'Slides \u2715'; }

        // Render slides
        if (activeTitle) renderInlineSlides(activeTitle);
    }

    function closeInlinePreview() {
        inlinePreviewOpen = false;
        // If in fullscreen, exit fullscreen too
        if (fullscreenMode) { exitFullscreen(); return; }
        var preview = document.getElementById('pesu-chat-inline-preview');
        var splitter = document.getElementById('pesu-chat-splitter');
        if (preview) { preview.style.display = 'none'; preview.style.height = ''; preview.style.flex = ''; }
        if (splitter) splitter.style.display = 'none';

        // Restore sidebar width
        var sidebar = document.getElementById('pesu-chat-sidebar');
        if (sidebar) {
            sidebarWidth = DEFAULT_WIDTH;
            sidebar.style.width = sidebarWidth + 'px';
            localStorage.setItem('pesumate_sidebar_w', sidebarWidth);
        }
        updateBodyMargin();

        // Reset messages flex
        var msgs = document.getElementById('pesu-chat-messages');
        if (msgs) { msgs.style.flex = ''; msgs.style.height = ''; }

        // Update button state
        var btn = document.getElementById('pesu-chat-slides-btn');
        if (btn) { btn.classList.remove('active'); btn.textContent = 'Slides'; }
    }

    // ─── Fullscreen Mode (slides fullpage + floating chat popup) ───
    function toggleFullscreen() {
        if (fullscreenMode) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    }

    function enterFullscreen() {
        // Ensure inline preview is open first
        if (!inlinePreviewOpen) {
            var first = selectedItems.find(function (it) { return !!slideBuffers[it.title]; });
            if (!first) return; // no slides to show
            openInlinePreview(first.title);
        }

        fullscreenMode = true;
        var sidebar = document.getElementById('pesu-chat-sidebar');
        if (!sidebar) return;

        // Save pre-fullscreen width
        sidebar.dataset.prefsWidth = sidebarWidth;

        // Add fullscreen class to sidebar — CSS handles the layout
        sidebar.classList.add('pesu-fullscreen');
        document.body.classList.add('pesu-fullscreen-active');
        document.body.style.marginRight = '0px';

        // Hide splitter in fullscreen
        var splitter = document.getElementById('pesu-chat-splitter');
        if (splitter) splitter.style.display = 'none';

        // Make inline preview expand fully and leave room for drawer
        var preview = document.getElementById('pesu-chat-inline-preview');
        if (preview) {
            preview.style.flex = '1';
            preview.style.height = '';
            preview.style.marginRight = '380px';
        }

        // Create right-side chat drawer (replaces old float popup)
        var msgsEl = document.getElementById('pesu-chat-messages');
        var typingEl = document.getElementById('pesu-chat-typing');
        var inputEl = sidebar.querySelector('.pesu-chat-input-area');
        if (msgsEl && typingEl && inputEl) {
            var chatDrawer = document.createElement('div');
            chatDrawer.className = 'pesu-chat-drawer';
            chatDrawer.id = 'pesu-chat-drawer';
            chatDrawer.style.width = '380px';

            // Resize handle on left edge
            var resizeHandle = document.createElement('div');
            resizeHandle.className = 'pesu-chat-drawer-resize';
            chatDrawer.appendChild(resizeHandle);
            initDrawerResize(resizeHandle, chatDrawer);

            // Drawer header with title + actions (add slides, history, clear, collapse)
            var drawerHeader = document.createElement('div');
            drawerHeader.className = 'pesu-chat-drawer-header';
            drawerHeader.innerHTML =
                '<span class="pesu-chat-drawer-title">Chat</span>' +
                '<div class="pesu-chat-drawer-actions">' +
                '<button class="pesu-chat-drawer-btn" id="pesu-fs-add-slides" title="Add slides to context">+ Slides</button>' +
                '<button class="pesu-chat-drawer-btn" id="pesu-fs-history" title="Chat history">History</button>' +
                '<button class="pesu-chat-drawer-btn" id="pesu-fs-clear" title="Clear chat">Clear</button>' +
                '<button class="pesu-chat-drawer-btn pesu-chat-drawer-collapse" id="pesu-chat-drawer-collapse" title="Collapse chat">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</button>' +
                '</div>';
            chatDrawer.appendChild(drawerHeader);

            chatDrawer.appendChild(msgsEl);
            chatDrawer.appendChild(typingEl);
            chatDrawer.appendChild(inputEl);
            sidebar.appendChild(chatDrawer);

            // Wire drawer buttons
            document.getElementById('pesu-chat-drawer-collapse').onclick = toggleChatDrawer;
            document.getElementById('pesu-fs-add-slides').onclick = addMoreSlides;
            document.getElementById('pesu-fs-history').onclick = toggleHistory;
            document.getElementById('pesu-fs-clear').onclick = clearChat;

            // FAB to reopen chat when collapsed (hidden initially)
            var fab = document.createElement('button');
            fab.className = 'pesu-chat-fab';
            fab.id = 'pesu-chat-fab';
            fab.title = 'Open chat';
            var fabIcon = document.createElement('img');
            var extMeta = document.querySelector('meta[name="pesumate-extension-url"]');
            var extBase = extMeta ? extMeta.content : '';
            fabIcon.src = extBase + 'icon.png';
            fabIcon.width = 36;
            fabIcon.height = 36;
            fabIcon.style.borderRadius = '50%';
            fab.appendChild(fabIcon);
            fab.onclick = toggleChatDrawer;
            sidebar.appendChild(fab);
        }

        // Update button states
        var fsBtn = document.getElementById('pesu-chat-fullscreen-btn');
        if (fsBtn) { fsBtn.classList.add('active'); fsBtn.innerHTML = '&#x2716;'; fsBtn.title = 'Exit fullscreen'; }

        // Re-render slides at full width — use rAF to guarantee CSS reflow
        var activeTab = document.querySelector('.pesu-inline-tab.active');
        if (activeTab) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    var content = document.getElementById('pesu-inline-content');
                    if (content && activeTab.dataset.title) {
                        renderInlineContent(activeTab.dataset.title, content);
                    }
                });
            });
        }

        // Listen for Esc key
        document.addEventListener('keydown', _fullscreenEscHandler);
    }

    function exitFullscreen() {
        fullscreenMode = false;
        var sidebar = document.getElementById('pesu-chat-sidebar');
        if (!sidebar) return;

        sidebar.classList.remove('pesu-fullscreen');
        document.body.classList.remove('pesu-fullscreen-active');

        // Unwrap chat drawer — move children back into sidebar (skip drawer header)
        var chatDrawer = document.getElementById('pesu-chat-drawer');
        if (chatDrawer) {
            var children = Array.from(chatDrawer.children);
            children.forEach(function (child) {
                if (!child.classList.contains('pesu-chat-drawer-header')) {
                    sidebar.insertBefore(child, chatDrawer);
                }
            });
            chatDrawer.remove();
        }
        // Remove FAB
        var fab = document.getElementById('pesu-chat-fab');
        if (fab) fab.remove();

        // Clear preview margin
        var preview = document.getElementById('pesu-chat-inline-preview');
        if (preview) preview.style.marginRight = '';

        // Restore previous width
        var prevW = parseInt(sidebar.dataset.prefsWidth) || FOCUS_WIDTH;
        sidebarWidth = prevW;
        sidebar.style.width = prevW + 'px';
        updateBodyMargin();

        // Restore splitter
        var splitter = document.getElementById('pesu-chat-splitter');
        if (splitter && inlinePreviewOpen) splitter.style.display = 'flex';

        // Restore inline preview height
        applySplitRatio();

        // Update button states
        var fsBtn = document.getElementById('pesu-chat-fullscreen-btn');
        if (fsBtn) { fsBtn.classList.remove('active'); fsBtn.innerHTML = '&#x26F6;'; fsBtn.title = 'Fullscreen slides'; }

        // Re-render slides at sidebar width — use rAF to guarantee reflow
        var activeTab = document.querySelector('.pesu-inline-tab.active');
        if (activeTab) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    var content = document.getElementById('pesu-inline-content');
                    if (content && activeTab.dataset.title) {
                        renderInlineContent(activeTab.dataset.title, content);
                    }
                });
            });
        }

        document.removeEventListener('keydown', _fullscreenEscHandler);
    }

    function toggleChatDrawer() {
        var drawer = document.getElementById('pesu-chat-drawer');
        var fab = document.getElementById('pesu-chat-fab');
        var preview = document.getElementById('pesu-chat-inline-preview');
        if (!drawer) return;
        var isCollapsed = drawer.classList.toggle('collapsed');
        if (fab) {
            if (isCollapsed) fab.classList.add('visible');
            else fab.classList.remove('visible');
        }
        // Adjust preview margin so slides aren't hidden behind drawer
        if (preview) {
            preview.style.marginRight = isCollapsed ? '0' : drawer.style.width;
        }
        // Re-render slides to fill new width after drawer collapses/expands
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var content = document.getElementById('pesu-inline-content');
                var activeTab = document.querySelector('.pesu-inline-tab.active');
                if (content && activeTab && activeTab.dataset.title) {
                    renderInlineContent(activeTab.dataset.title, content);
                }
            });
        });
    }

    function initDrawerResize(handle, drawer) {
        var dragging = false;
        var startX, startW;

        handle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startW = drawer.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            handle.classList.add('active');
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var delta = startX - e.clientX; // dragging left = wider
            var newW = Math.max(280, Math.min(600, startW + delta));
            drawer.style.width = newW + 'px';
            var preview = document.getElementById('pesu-chat-inline-preview');
            if (preview) preview.style.marginRight = newW + 'px';
        });

        document.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            handle.classList.remove('active');
            // Re-render slides at new width
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    var content = document.getElementById('pesu-inline-content');
                    var activeTab = document.querySelector('.pesu-inline-tab.active');
                    if (content && activeTab && activeTab.dataset.title) {
                        renderInlineContent(activeTab.dataset.title, content);
                    }
                });
            });
        });
    }

    function _fullscreenEscHandler(e) {
        if (e.key === 'Escape' && fullscreenMode) {
            e.preventDefault();
            exitFullscreen();
        }
    }

    function applySplitRatio() {
        var preview = document.getElementById('pesu-chat-inline-preview');
        if (!preview || !inlinePreviewOpen) return;
        var vpH = window.innerHeight;
        var previewH = Math.max(120, Math.min(vpH * 0.65, Math.round(vpH * splitRatio)));
        preview.style.flex = 'none';
        preview.style.height = previewH + 'px';
    }

    function initSplitterDrag(splitterEl) {
        var dragging = false;

        splitterEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            dragging = true;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            splitterEl.classList.add('active');
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var preview = document.getElementById('pesu-chat-inline-preview');
            if (!preview) return;
            var previewRect = preview.getBoundingClientRect();
            var newH = e.clientY - previewRect.top;
            var vpH = window.innerHeight;
            newH = Math.max(120, Math.min(vpH * 0.7, newH));
            preview.style.flex = 'none';
            preview.style.height = newH + 'px';
            splitRatio = newH / vpH;
        });

        document.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            splitterEl.classList.remove('active');
            localStorage.setItem('pesumate_split_ratio', splitRatio.toFixed(2));
        });
    }

    async function renderInlineSlides(activeTitle) {
        var container = document.getElementById('pesu-chat-inline-preview');
        if (!container) return;
        container.innerHTML = '';

        var titlesWithBuf = selectedItems.filter(function (it) { return !!slideBuffers[it.title]; });
        if (titlesWithBuf.length === 0) {
            container.innerHTML = '<div class="pesu-inline-empty">No slides to preview yet</div>';
            return;
        }

        // Tab bar
        var tabBar = document.createElement('div');
        tabBar.className = 'pesu-inline-tabs';
        tabBar.id = 'pesu-inline-tabs';
        titlesWithBuf.forEach(function (item) {
            var tab = document.createElement('button');
            tab.className = 'pesu-inline-tab' + (item.title === activeTitle ? ' active' : '');
            tab.textContent = item.title;
            tab.dataset.title = item.title;
            tab.onclick = function () {
                tabBar.querySelectorAll('.pesu-inline-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                renderInlineContent(item.title, content);
            };
            tabBar.appendChild(tab);
        });
        container.appendChild(tabBar);

        // Content area
        var content = document.createElement('div');
        content.className = 'pesu-inline-content';
        content.id = 'pesu-inline-content';
        container.appendChild(content);

        await renderInlineContent(activeTitle, content);
    }

    async function renderInlineContent(title, container) {
        container.innerHTML = '<div class="pesu-preview-loading"><div class="spinner-sm"></div> Loading...</div>';
        var data = slideBuffers[title];
        if (!data) { container.innerHTML = '<div class="pesu-inline-empty">No preview data</div>'; return; }

        if (data.isPdf) {
            await renderPdfInline(data.buf, container);
        } else if (data.isZip) {
            await renderPptxInline(data.buf, title, container);
        } else {
            container.innerHTML = '<div class="pesu-inline-empty">Unsupported format</div>';
        }
    }

    function getInlineRenderWidth(container) {
        // In fullscreen, compute width from viewport minus chat drawer
        if (fullscreenMode) {
            var drawer = document.getElementById('pesu-chat-drawer');
            var drawerW = (drawer && !drawer.classList.contains('collapsed')) ? drawer.offsetWidth : 0;
            return window.innerWidth - drawerW - 64;
        }
        return container.clientWidth || 400;
    }

    async function renderPdfInline(buf, container) {
        var lib = await loadPdfJs();
        if (!lib) { container.innerHTML = '<div class="pesu-inline-empty">PDF.js not available</div>'; return; }
        try {
            var doc = await lib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
            container.innerHTML = '';
            var pageCount = doc.numPages;
            var counter = document.createElement('div');
            counter.className = 'pesu-preview-page-count';
            counter.textContent = pageCount + ' page' + (pageCount > 1 ? 's' : '');
            container.appendChild(counter);

            var renderWidth = getInlineRenderWidth(container);
            var dpr = window.devicePixelRatio || 1;
            var hiresMultiplier = fullscreenMode ? Math.max(dpr, 2) : 2;
            for (var p = 1; p <= pageCount; p++) {
                var page = await doc.getPage(p);
                var viewport = page.getViewport({ scale: 1 });
                var fitScale = (renderWidth - 24) / viewport.width;
                var hiresVp = page.getViewport({ scale: fitScale * hiresMultiplier });

                var wrapper = document.createElement('div');
                wrapper.className = 'pesu-preview-page';
                wrapper.dataset.page = p;
                var label = document.createElement('div');
                label.className = 'pesu-preview-page-label';
                label.textContent = 'Page ' + p;
                wrapper.appendChild(label);

                var canvas = document.createElement('canvas');
                canvas.width = hiresVp.width;
                canvas.height = hiresVp.height;
                canvas.className = 'pesu-preview-canvas';
                wrapper.appendChild(canvas);
                container.appendChild(wrapper);

                var ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: hiresVp }).promise;
            }
        } catch (e) {
            container.innerHTML = '<div class="pesu-inline-empty">Failed to render PDF</div>';
        }
    }

    async function renderPptxInline(buf, title, container) {
        try {
            var containerWidth = getInlineRenderWidth(container);
            var canvasW = containerWidth - 24;
            var canvasH = Math.round(canvasW * 0.75);
            var slides = await window.pptxToHtml(buf, { width: canvasW, height: canvasH, scaleToFit: true, letterbox: false });
            container.innerHTML = '';

            var counter = document.createElement('div');
            counter.className = 'pesu-preview-page-count';
            counter.textContent = slides.length + ' slide' + (slides.length > 1 ? 's' : '');
            container.appendChild(counter);

            for (var i = 0; i < slides.length; i++) {
                var wrapper = document.createElement('div');
                wrapper.className = 'pesu-preview-pptx-wrapper';
                wrapper.dataset.page = (i + 1);
                var label = document.createElement('div');
                label.className = 'pesu-preview-page-label';
                label.textContent = 'Slide ' + (i + 1);
                wrapper.appendChild(label);
                var slideDiv = document.createElement('div');
                slideDiv.className = 'pesu-preview-pptx-canvas';
                slideDiv.style.aspectRatio = '4/3';
                slideDiv.innerHTML = slides[i];
                wrapper.appendChild(slideDiv);
                container.appendChild(wrapper);
            }
            if (slides.length === 0) {
                container.innerHTML = '<div class="pesu-inline-empty">No slides found</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="pesu-inline-empty">Failed to render PPTX</div>';
        }
    }

    async function openPreview(activeTitle) {
        // Remove existing preview
        var old = document.getElementById('pesu-preview-panel');
        if (old) old.remove();

        previewOpen = true;
        updateBodyMargin();

        var panel = document.createElement('div');
        panel.id = 'pesu-preview-panel';
        panel.className = 'pesu-preview-panel';
        panel.style.width = PREVIEW_WIDTH + 'px';
        panel.style.right = sidebarWidth + 'px';

        // Header
        var header = document.createElement('div');
        header.className = 'pesu-preview-header';
        var headerTitle = document.createElement('span');
        headerTitle.className = 'pesu-preview-title';
        headerTitle.textContent = 'Slide Preview';
        var closeBtn = document.createElement('button');
        closeBtn.className = 'pesu-preview-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () { closePreviewPanel(); };
        header.appendChild(headerTitle);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Tab bar (always show if multiple files)
        var titlesWithBuf = selectedItems.filter(function (it) { return !!slideBuffers[it.title]; });
        var tabBar = document.createElement('div');
        tabBar.className = 'pesu-preview-tabs';
        tabBar.id = 'pesu-preview-tabs';
        titlesWithBuf.forEach(function (item) {
            var tab = document.createElement('button');
            tab.className = 'pesu-preview-tab' + (item.title === activeTitle ? ' active' : '');
            tab.textContent = item.title;
            tab.dataset.title = item.title;
            tab.onclick = function () {
                tabBar.querySelectorAll('.pesu-preview-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                renderPreviewContent(item.title, content);
            };
            tabBar.appendChild(tab);
        });
        panel.appendChild(tabBar);

        // Content area
        var content = document.createElement('div');
        content.className = 'pesu-preview-content';
        content.id = 'pesu-preview-content';
        panel.appendChild(content);

        // Append to body as a separate fixed panel
        document.body.appendChild(panel);

        // Update Slides button state
        var slidesBtn = document.getElementById('pesu-chat-slides-btn');
        if (slidesBtn) slidesBtn.classList.add('active');

        await renderPreviewContent(activeTitle, content);
    }

    async function renderPreviewContent(title, container) {
        container.innerHTML = '<div class="pesu-preview-loading"><div class="spinner-sm"></div> Loading preview...</div>';
        var data = slideBuffers[title];
        if (!data) {
            container.innerHTML = '<div class="pesu-preview-empty">No preview data available</div>';
            return;
        }

        if (data.isPdf) {
            await renderPdfPreview(data.buf, container);
        } else if (data.isZip) {
            await renderPptxPreview(data.buf, title, container);
        } else {
            container.innerHTML = '<div class="pesu-preview-empty">Unsupported file format</div>';
        }
    }

    async function renderPdfPreview(buf, container) {
        var lib = await loadPdfJs();
        if (!lib) {
            container.innerHTML = '<div class="pesu-preview-empty">PDF.js not available</div>';
            return;
        }

        try {
            var doc = await lib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
            container.innerHTML = '';
            var pageCount = doc.numPages;

            // Page counter
            var counter = document.createElement('div');
            counter.className = 'pesu-preview-page-count';
            counter.textContent = pageCount + ' page' + (pageCount > 1 ? 's' : '');
            container.appendChild(counter);

            for (var p = 1; p <= pageCount; p++) {
                var page = await doc.getPage(p);
                var viewport = page.getViewport({ scale: 1 });
                // Scale to fit preview panel width
                var scale = (PREVIEW_WIDTH - 40) / viewport.width;
                var scaledViewport = page.getViewport({ scale: scale });

                // Render at 2x for sharper text (Retina-quality)
                var hiresScale = 2;
                var hiresViewport = page.getViewport({ scale: scale * hiresScale });

                var wrapper = document.createElement('div');
                wrapper.className = 'pesu-preview-page';

                var label = document.createElement('div');
                label.className = 'pesu-preview-page-label';
                label.textContent = 'Page ' + p;
                wrapper.appendChild(label);

                var canvas = document.createElement('canvas');
                canvas.width = hiresViewport.width;
                canvas.height = hiresViewport.height;
                canvas.style.width = scaledViewport.width + 'px';
                canvas.style.height = scaledViewport.height + 'px';
                canvas.className = 'pesu-preview-canvas';
                wrapper.appendChild(canvas);

                container.appendChild(wrapper);

                var ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: hiresViewport }).promise;
            }
        } catch (e) {
            container.innerHTML = '<div class="pesu-preview-empty">Failed to render PDF: ' + (e.message || e) + '</div>';
        }
    }

    async function renderPptxPreview(buf, title, container) {
        try {
            // Use @jvmr/pptx-to-html library
            var canvasW = PREVIEW_WIDTH - 40;
            var canvasH = Math.round(canvasW * 0.75); // 4:3 aspect ratio
            var slides = await window.pptxToHtml(buf, {
                width: canvasW,
                height: canvasH,
                scaleToFit: true,
                letterbox: false
            });

            container.innerHTML = '';

            var counter = document.createElement('div');
            counter.className = 'pesu-preview-page-count';
            counter.textContent = slides.length + ' slide' + (slides.length > 1 ? 's' : '');
            container.appendChild(counter);

            for (var i = 0; i < slides.length; i++) {
                var wrapper = document.createElement('div');
                wrapper.className = 'pesu-preview-pptx-wrapper';

                var label = document.createElement('div');
                label.className = 'pesu-preview-page-label';
                label.textContent = 'Slide ' + (i + 1);
                wrapper.appendChild(label);

                var slideDiv = document.createElement('div');
                slideDiv.className = 'pesu-preview-pptx-canvas';
                slideDiv.style.height = canvasH + 'px';
                slideDiv.innerHTML = slides[i];
                wrapper.appendChild(slideDiv);

                container.appendChild(wrapper);
            }

            if (slides.length === 0) {
                container.innerHTML = '<div class="pesu-preview-empty">No slides found in this PPTX</div>';
            }
        } catch (e) {
            console.error('PPTX preview error:', e);
            container.innerHTML = '<div class="pesu-preview-empty">Failed to render PPTX: ' + (e.message || e) + '</div>';
        }
    }

    // ─── Find referenced page within a slide (per-page text matching) ───
    function findReferencedPage(responseText, slideTitle) {
        var pages = slidePageTexts[slideTitle];
        if (!pages || pages.length === 0) return -1;

        var lowerResp = responseText.toLowerCase();
        var stopWords = ['the', 'a', 'an', 'of', 'and', 'in', 'to', 'for', 'is', 'on', 'at', 'by', 'with', 'from',
            'this', 'that', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'not', 'but', 'or', 'so',
            'if', 'its', 'it', 'as', 'can', 'will', 'which', 'their', 'them', 'they', 'we', 'you', 'he', 'she'];

        var bestPage = -1, bestScore = 0;

        for (var p = 0; p < pages.length; p++) {
            if (!pages[p]) continue;
            var words = pages[p].toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
            var unique = {};
            var signif = words.filter(function (w) {
                if (w.length < 3 || stopWords.indexOf(w) !== -1 || unique[w]) return false;
                unique[w] = true;
                return true;
            });

            var score = 0;
            for (var j = 0; j < signif.length; j++) {
                if (lowerResp.indexOf(signif[j]) !== -1) {
                    score += (signif[j].length > 6) ? 4 : (signif[j].length > 4) ? 2 : 1;
                }
            }
            // Normalize by word count to avoid long pages always winning
            if (signif.length > 0) score = score / Math.sqrt(signif.length);

            if (score > bestScore) {
                bestScore = score;
                bestPage = p;
            }
        }

        return bestScore > 1.5 ? bestPage : -1;
    }

    // ─── Auto-scroll inline preview to a specific page ───
    function autoScrollToPage(slideTitle, pageNum) {
        if (!inlinePreviewOpen) return;
        var key = slideTitle + ':' + pageNum;
        if (_lastScrolledPage === key) return; // avoid repeat scroll for same page
        _lastScrolledPage = key;

        // Switch tab if needed
        var inlineTabs = document.getElementById('pesu-inline-tabs');
        if (inlineTabs) {
            var activeTab = inlineTabs.querySelector('.pesu-inline-tab.active');
            if (!activeTab || activeTab.dataset.title !== slideTitle) {
                var tabs = inlineTabs.querySelectorAll('.pesu-inline-tab');
                tabs.forEach(function (t) {
                    if (t.dataset.title === slideTitle && !t.classList.contains('active')) {
                        t.click();
                    }
                });
                // Wait for render before scrolling
                setTimeout(function () { scrollToPageElement(pageNum); }, 300);
                return;
            }
        }
        scrollToPageElement(pageNum);
    }

    function scrollToPageElement(pageNum) {
        var content = document.getElementById('pesu-inline-content');
        if (!content) return;
        // pageNum is 0-indexed from findReferencedPage, data-page is 1-indexed
        var target = content.querySelector('[data-page=\"' + (pageNum + 1) + '\"]');
        if (!target) return;

        // Smooth scroll
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Add highlight pulse
        target.classList.add('pesu-page-auto-highlight');
        setTimeout(function () { target.classList.remove('pesu-page-auto-highlight'); }, 2500);
    }

    // ─── Source indicator pill (shows which page the AI is referencing) ───
    function addSourcePill(msgDiv, slideTitle, pageNum, isPdf) {
        var existing = msgDiv.querySelector('.pesu-source-pill');
        if (existing) existing.remove();

        var pill = document.createElement('div');
        pill.className = 'pesu-source-pill';
        var pageLabel = isPdf ? 'Page ' + (pageNum + 1) : 'Slide ' + (pageNum + 1);
        pill.innerHTML = '<span class="pesu-source-icon">\u25B6</span> <strong>' + pageLabel + '</strong> <span class="pesu-source-title">' + slideTitle + '</span>';
        pill.title = 'Click to scroll to this page';
        pill.onclick = function () { autoScrollToPage(slideTitle, pageNum); };

        // Insert before the bubble
        var bubble = msgDiv.querySelector('.pesu-chat-msg-bubble');
        if (bubble) msgDiv.insertBefore(pill, bubble);
    }

    // ─── Auto-highlight referenced slide ───
    function highlightReferencedSlide(responseText) {
        if (!responseText || selectedItems.length === 0) return;

        var referencedIdx = -1;

        if (selectedItems.length === 1) {
            // Only one slide — always reference it
            referencedIdx = 0;
        } else {
            // Multi-slide: score each slide by word overlap with AI response
            var lowerText = responseText.toLowerCase();
            var bestScore = 0;

            // Common stop words to ignore
            var stopWords = ['the', 'a', 'an', 'of', 'and', 'in', 'to', 'for', 'is', 'on', 'at', 'by', 'with', 'from'];

            for (var i = 0; i < selectedItems.length; i++) {
                var title = selectedItems[i].title;
                var score = 0;

                // Exact title match (highest priority)
                if (lowerText.indexOf(title.toLowerCase()) !== -1) {
                    score = 100;
                } else {
                    // Word-level scoring
                    var words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                    var significantWords = words.filter(function (w) {
                        return w.length > 2 && stopWords.indexOf(w) === -1;
                    });

                    for (var j = 0; j < significantWords.length; j++) {
                        if (lowerText.indexOf(significantWords[j]) !== -1) {
                            score += (significantWords[j].length > 5) ? 3 : 1; // Longer words worth more
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    referencedIdx = i;
                }
            }

            // Need at least some score to match
            if (bestScore === 0) referencedIdx = -1;
        }



        if (referencedIdx === -1) return;

        // Highlight referenced slide in context banner (if visible)
        var ctx = document.getElementById('pesu-chat-context');
        if (ctx && ctx.classList.contains('expanded')) {
            var slideEl = ctx.querySelector('.pesu-ctx-slide[data-slide-idx="' + referencedIdx + '"]');
            if (slideEl) {
                slideEl.classList.add('pesu-ctx-highlight');
                setTimeout(function () { slideEl.classList.remove('pesu-ctx-highlight'); }, 3000);
            }
        }

        // Auto-switch preview tab (ONLY if already open)
        var targetTitle = selectedItems[referencedIdx].title;
        if (inlinePreviewOpen) {
            var inlineTabs = document.getElementById('pesu-inline-tabs');
            if (inlineTabs) {
                var tabs = inlineTabs.querySelectorAll('.pesu-inline-tab');
                tabs.forEach(function (t) {
                    if (t.dataset.title === targetTitle && !t.classList.contains('active')) {
                        t.click();
                    }
                });
            }
        } else if (previewOpen) {
            var previewTabs = document.getElementById('pesu-preview-tabs');
            if (previewTabs) {
                var tabs = previewTabs.querySelectorAll('.pesu-preview-tab');
                tabs.forEach(function (t) {
                    if (t.dataset.title === targetTitle && !t.classList.contains('active')) {
                        t.click();
                    }
                });
            }
        }

        // Auto-scroll to the specific page within the slide
        if (inlinePreviewOpen) {
            var pageIdx = findReferencedPage(responseText, targetTitle);
            if (pageIdx !== -1) {
                autoScrollToPage(targetTitle, pageIdx);
            }
        }
    }

    // ─── Live page detection during streaming (debounced) ───
    var _streamPageTimer = null;
    function detectPageDuringStream(currentText, msgDiv) {
        if (_streamPageTimer) clearTimeout(_streamPageTimer);
        _streamPageTimer = setTimeout(function () {
            if (!inlinePreviewOpen || selectedItems.length === 0) return;

            // Find which slide file the text is mostly about
            var bestTitle = null, bestSlideScore = 0;
            for (var i = 0; i < selectedItems.length; i++) {
                var title = selectedItems[i].title;
                var pages = slidePageTexts[title];
                if (!pages) continue;
                // Quick check: how many page words appear in the response
                var score = 0;
                for (var p = 0; p < pages.length; p++) {
                    if (!pages[p]) continue;
                    var words = pages[p].toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
                    var sampled = words.length > 20 ? words.filter(function(_, idx) { return idx % Math.ceil(words.length / 20) === 0; }) : words;
                    for (var j = 0; j < sampled.length; j++) {
                        if (currentText.toLowerCase().indexOf(sampled[j]) !== -1) score++;
                    }
                }
                if (score > bestSlideScore) { bestSlideScore = score; bestTitle = title; }
            }

            if (!bestTitle || bestSlideScore < 3) return;

            var pageIdx = findReferencedPage(currentText, bestTitle);
            if (pageIdx !== -1) {
                autoScrollToPage(bestTitle, pageIdx);

                // Add/update source pill on the message
                if (msgDiv) {
                    var data = slideBuffers[bestTitle];
                    var isPdf = data && data.isPdf;
                    addSourcePill(msgDiv, bestTitle, pageIdx, isPdf);
                }
            }
        }, 600); // 600ms debounce while streaming
    }

    function addMoreSlides() {
        // Remove existing picker if any
        var existing = document.getElementById('pesu-slide-picker-overlay');
        if (existing) { existing.remove(); return; }

        if (!currentItems || currentItems.length === 0) {
            showError('No slides available. Make sure the PESUmate panel has loaded slides first.');
            return;
        }

        // Create modal overlay backdrop
        var overlay = document.createElement('div');
        overlay.id = 'pesu-slide-picker-overlay';
        overlay.className = 'pesu-slide-picker-overlay';

        // Modal card
        var picker = document.createElement('div');
        picker.id = 'pesu-slide-picker';
        picker.className = 'pesu-slide-picker';

        // Header
        var header = document.createElement('div');
        header.className = 'pesu-slide-picker-header';
        header.innerHTML = '<span>Add Slides to Context</span>' +
            '<button class="pesu-slide-picker-close" id="pesu-slide-picker-close">&times;</button>';
        picker.appendChild(header);

        // Slide list
        var list = document.createElement('div');
        list.className = 'pesu-slide-picker-list';

        var checkboxes = [];
        currentItems.forEach(function (item, idx) {
            var alreadySelected = selectedItems.some(function (s) { return s.title === item.title; });

            var row = document.createElement('label');
            row.className = 'pesu-slide-picker-row' + (alreadySelected ? ' already' : '');

            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.dataset.idx = idx;
            if (alreadySelected) {
                cb.checked = true;
                cb.disabled = true;
            }
            checkboxes.push(cb);

            var name = document.createElement('span');
            name.className = 'pesu-slide-picker-name';
            name.textContent = (idx + 1) + '. ' + item.title;

            var badge = document.createElement('span');
            badge.className = 'pesu-slide-picker-badge';
            badge.textContent = alreadySelected ? 'In context' : '';

            row.appendChild(cb);
            row.appendChild(name);
            row.appendChild(badge);
            list.appendChild(row);
        });
        picker.appendChild(list);

        // Footer with actions
        var footer = document.createElement('div');
        footer.className = 'pesu-slide-picker-footer';
        var addBtn = document.createElement('button');
        addBtn.className = 'pesu-slide-picker-add';
        addBtn.id = 'pesu-slide-picker-add';
        addBtn.textContent = 'Add Selected';
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'pesu-slide-picker-cancel';
        cancelBtn.textContent = 'Cancel';
        footer.appendChild(cancelBtn);
        footer.appendChild(addBtn);
        picker.appendChild(footer);

        // Mount: picker inside overlay, overlay on body
        overlay.appendChild(picker);
        document.body.appendChild(overlay);

        // Close on backdrop click
        overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

        // Events
        document.getElementById('pesu-slide-picker-close').onclick = function () { overlay.remove(); };
        cancelBtn.onclick = function () { overlay.remove(); };

        addBtn.onclick = function () {
            var newItems = [];
            checkboxes.forEach(function (cb) {
                if (cb.checked && !cb.disabled) {
                    var idx = parseInt(cb.dataset.idx);
                    if (currentItems[idx]) newItems.push(currentItems[idx]);
                }
            });

            overlay.remove();

            if (newItems.length > 0) {
                selectedItems = selectedItems.concat(newItems);
                renderContextBanner();
                extractNewSlides(newItems);
            }
        };

        // Update Add button label when checkboxes change
        function updateAddBtn() {
            var count = checkboxes.filter(function (c) { return c.checked && !c.disabled; }).length;
            addBtn.textContent = count > 0 ? 'Add ' + count + ' slide' + (count > 1 ? 's' : '') : 'Add Selected';
            addBtn.disabled = count === 0;
        }
        checkboxes.forEach(function (cb) { if (!cb.disabled) cb.onchange = updateAddBtn; });
        updateAddBtn();
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
                // Cache buffer copy for preview (slice to avoid detached ArrayBuffer)
                slideBuffers[item.title] = { buf: buf.slice(0), isPdf: isPdf, isZip: isZip };
                var result = isPdf ? await extractPdf(buf) : isZip ? await extractPptx(buf) : { text: '', pages: [] };
                var text = (typeof result === 'string') ? result : result.text;
                if (result.pages && result.pages.length > 0) slidePageTexts[item.title] = result.pages;
                slideTexts[item.title] = text.trim() || '';
            } catch (e) {
                slideTexts[item.title] = '';
            }
        }

        rebuildContext();
        renderContextBanner();
        saveHistory(unitTab());

        // Refresh inline preview to include new tabs
        var firstNew = newItems.find(function (it) { return !!slideBuffers[it.title]; });
        if (firstNew) {
            openInlinePreview(firstNew.title);
        } else if (inlinePreviewOpen) {
            var currentActive = selectedItems.find(function (it) { return !!slideBuffers[it.title]; });
            if (currentActive) renderInlineSlides(currentActive.title);
        }
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

                // Cache buffer copy for preview (slice to avoid detached ArrayBuffer)
                slideBuffers[item.title] = { buf: buf.slice(0), isPdf: pdf, isZip: zip };

                var result = pdf ? await extractPdf(buf) : zip ? await extractPptx(buf) : { text: '', pages: [] };
                var text = (typeof result === 'string') ? result : result.text;
                if (result.pages && result.pages.length > 0) slidePageTexts[item.title] = result.pages;

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

        // Auto-open inline preview with the first extracted slide
        var firstWithBuf = selectedItems.find(function (it) { return !!slideBuffers[it.title]; });
        if (firstWithBuf) openInlinePreview(firstWithBuf.title);
    }

    function showWarning(parent, msg) {
        var d = document.createElement('div');
        d.className = 'pesu-chat-image-warn';
        d.textContent = msg;
        parent.appendChild(d);
    }

    function showChips(parent) {
        var chips = ['Summarize key concepts', 'What are the likely exam questions?', 'Give me a real-world example'];
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
                var pages = []; // per-page text array
                for (var p = 1; p <= doc.numPages; p++) {
                    var pg = await doc.getPage(p);
                    var tc = await pg.getTextContent();
                    var s = tc.items.map(function (i) { return i.str; }).join(' ');
                    pages.push(s.trim());
                    if (s.trim()) t.push(s.trim());
                }
                if (t.join('').length > 10) return { text: t.join('\n'), pages: pages };
            } catch (e) { }
        }
        // Fallback
        var raw = '', bytes = new Uint8Array(buf);
        for (var i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
        var chunks = [], m;
        var re = /\(([^)]*)\)\s*Tj/g;
        while ((m = re.exec(raw)) !== null) chunks.push(m[1]);
        return { text: chunks.join('\n'), pages: [] };
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
            var pages = []; // per-slide text array
            for (var i = 0; i < files.length; i++) {
                var xml = await zip.file(files[i].path).async('text');
                var texts = [], m;
                var r = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
                while ((m = r.exec(xml)) !== null) texts.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
                var pageText = texts.join(' ').trim();
                pages.push(pageText);
                if (pageText) out.push('Slide ' + files[i].num + ': ' + pageText);
            }
            return { text: out.join('\n\n'), pages: pages };
        } catch (e) { return { text: '', pages: [] }; }
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

        // Reset auto-scroll tracker for this new response
        _lastScrolledPage = null;

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
                        // Live page detection during streaming
                        detectPageDuringStream(fullText, msgDiv);
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

        // Auto-highlight referenced slide
        highlightReferencedSlide(fullText);

        // Final source pill — determine best page match
        if (inlinePreviewOpen && selectedItems.length > 0) {
            var bestTitle = null, bestSlideScore = 0;
            for (var si = 0; si < selectedItems.length; si++) {
                var stitle = selectedItems[si].title;
                var pgs = slidePageTexts[stitle];
                if (!pgs) continue;
                var sc = 0;
                for (var pi = 0; pi < pgs.length; pi++) {
                    if (!pgs[pi]) continue;
                    var ws = pgs[pi].toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
                    for (var wi = 0; wi < ws.length; wi++) {
                        if (fullText.toLowerCase().indexOf(ws[wi]) !== -1) sc++;
                    }
                }
                if (sc > bestSlideScore) { bestSlideScore = sc; bestTitle = stitle; }
            }
            if (bestTitle && bestSlideScore >= 3) {
                var finalPage = findReferencedPage(fullText, bestTitle);
                if (finalPage !== -1) {
                    var fdata = slideBuffers[bestTitle];
                    addSourcePill(msgDiv, bestTitle, finalPage, fdata && fdata.isPdf);
                }
            }
        }

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
    waitReady(function () { });
})();
