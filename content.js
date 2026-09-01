// PESUmate — Content Script
// Injected into pesuacademy.com/Academy/* pages

(function () {
  'use strict';

  // Prevent double-init
  if (window._pesuMateInitialized) return;
  window._pesuMateInitialized = true;

  // ─── Shared state (persists across SPA navigations) ───
  var cache = {};

  // jQuery $.get rejects with a jqXHR object, which has no .message — string-
  // concatenating it yields "[object Object]". Read jqXHR fields explicitly.
  function errMsg(err) {
    if (err === null || err === undefined) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (typeof err.status === 'number') {
      if (err.status === 0) return 'Network error (request blocked, offline, or session expired)';
      return 'HTTP ' + err.status + (err.statusText ? ' ' + err.statusText : '');
    }
    if (err.statusText) return err.statusText;
    return String(err);
  }



  // Every API call goes through here so a failure names the step and URL that
  // produced it, instead of a bare "HTTP 403". Uses .done/.fail rather than
  // .catch: jQuery Deferreds only gained .catch in 3.0, and pre-3.0 Deferreds
  // swallow a thrown error instead of rejecting.
  function apiGet($, step, url, data) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: url,
        type: 'GET',
        data: data,
        headers: { 'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content') }
      })
        .done(resolve)
        .fail(function (jqXHR) {
          var e = new Error(step + ' failed (' + errMsg(jqXHR) + ') at ' + url);
          e.status = jqXHR && jqXHR.status;
          e.step = step;
          e.url = url;
          e.responseText = jqXHR && jqXHR.responseText;
          reject(e);
        });
    });
  }

  // ─── Bootstrap: watch for #courselistunit to appear/reappear ───
  function boot() {
    var bodyObserver = new MutationObserver(function () {
      var el = document.getElementById('courselistunit');
      var btn = document.getElementById('pesu-dl-tab-btn');
      // Re-inject whenever #courselistunit exists but our tab button doesn't
      if (el && !btn) {
        console.log('[PESUmate] #courselistunit found without tab button — injecting');
        inject();
      }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // Also try immediately if already present
    if (document.getElementById('courselistunit') && !document.getElementById('pesu-dl-tab-btn')) {
      inject();
    }
  }

  function waitForJQuery(cb) {
    if (window.jQuery) return cb(window.jQuery);
    var t = setInterval(function () {
      if (window.jQuery) { clearInterval(t); cb(window.jQuery); }
    }, 200);
  }

  // ─── Main injection ───
  function inject() {
    waitForJQuery(function ($) {
      if (!$('#courselistunit').length) return;
      console.log('[PESUmate] Injecting UI');

      // ─── State (per injection) ───
      var _fetching = false;
      var _lastRenderedTab = '';

      // ─── Build DOM ───
      $('#pesu-dl-helper').remove();
      $('#pesu-dl-tab-btn').remove();

      // Tab button
      const navBtn = $('<li id="pesu-dl-tab-btn"><a href="javascript:void(0)">PESUmate</a></li>');
      $('#courselistunit').append(navBtn);

      // Panel
      const container = $('<div id="pesu-dl-helper"></div>');
      const titleDiv = $('<div id="pesu-dl-title"></div>');
      const statusDiv = $('<div id="pesu-dl-status"></div>');

      const progressWrap = $('<div class="pesu-dl-progress-wrap"></div>');
      const progressBar = $('<div class="pesu-dl-progress-bar"></div>');
      progressWrap.append(progressBar);

      const contentArea = $('<div id="pesu-dl-content"></div>');

      const topBar = $('<div class="pesu-dl-topbar"></div>');
      const refetchBtn = $('<button class="pesu-dl-btn-refresh" title="Refresh"></button>').html('&#8635;');
      const closeBtn = $('<button class="pesu-dl-btn-close"></button>').html('&times;');
      topBar.append(refetchBtn).append(closeBtn);

      container.append(topBar).append(titleDiv).append(statusDiv).append(progressWrap).append(contentArea);
      closeBtn.on('click', function () { container.slideUp(200); navBtn.removeClass('active'); });
      $('body').append(container);

      // Our own nav <li> also carries .active while the panel is open, and
      // jQuery .text() concatenates every match, so the raw selector yields
      // "Unit 2PESUmate". Always read the unit name through this.
      function activeUnitName() {
        return $('#courselistunit li.active a').not('#pesu-dl-tab-btn a').text().trim();
      }

      // ─── Toggle panel ───
      navBtn.on('click', function () {
        if (container.is(':visible')) {
          container.slideUp(200);
          navBtn.removeClass('active');
        } else {
          container.slideDown(200);
          navBtn.addClass('active');
          var currentTab = activeUnitName();
          if (currentTab !== _lastRenderedTab) {
            _lastRenderedTab = currentTab;
            fetchAndRender();
          }
        }
      });

      // ─── Render items ───
      function renderItems(unitText, items, fromCache) {
        _lastRenderedTab = unitText;
        titleDiv.text(unitText + ' (' + items.length + ')');
        statusDiv.text(items.length ? 'Ready' + (fromCache ? ' \u00b7 cached' : '') : 'No files found');
        contentArea.empty();
        progressWrap.hide();

        if (!items.length) return;

        console.log('[PESUmate] ' + unitText + ' \u2014 ' + items.length + ' files' + (fromCache ? ' (cached)' : ''));

        // Merge button
        var dlAllBtn = $('<button class="pesu-dl-merge-btn">Merge & Download</button>');
        dlAllBtn.on('click', function () { mergeAndDownload(unitText, items, dlAllBtn); });
        contentArea.append(dlAllBtn);

        // Individual file buttons
        items.forEach(function (t, i) {
          var btn = $('<button class="pesu-dl-item" id="pesu-dl-item-' + i + '"></button>')
            .text((i + 1) + '. ' + t.title);

          btn.on('click', async function () {
            var $btn = $(this);
            var url = t.isSlideUrl ? t.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + t.id;
            if (url.startsWith('/')) url = location.origin + url;
            $btn.text(t.title + ' \u2014 downloading...');
            try {
              // The download attribute is ignored on a cross-origin href, which
              // navigates the page away instead of saving. Go via a blob.
              var resp = await fetch(url, { credentials: 'same-origin' });
              if (!resp.ok) throw new Error('HTTP ' + resp.status);
              var blob = await resp.blob();
              var name = '';
              var cd = resp.headers.get('Content-Disposition') || '';
              var m = cd.match(/filename\*?=(?:UTF-8''|["']?)([^;"'\n]+)/i);
              if (m) { try { name = decodeURIComponent(m[1].trim()); } catch (e) { name = m[1].trim(); } }
              if (!name) name = t.title.replace(/[/\\:*?"<>|]/g, '_');
              triggerDownload(blob, name);
              $btn.addClass('done').text(t.title + ' \u2014 done');
            } catch (err) {
              console.warn('[PESUmate] Item download failed: ' + t.title, errMsg(err));
              $btn.addClass('failed').text(t.title + ' \u2014 failed: ' + errMsg(err));
            }
          });

          contentArea.append(btn);
        });
      }

      // ─── Merge & download logic ───
      async function mergeAndDownload(unitText, items, btn) {
        if (!items.length) { statusDiv.text('Nothing to download'); return; }
        btn.text('Downloading...').prop('disabled', true);
        progressWrap.show();

        var PDFDocument = PDFLib.PDFDocument;
        var mergedPdf = await PDFDocument.create();
        var pdfCount = 0, failed = 0;
        var pptxFiles = [];
        var usedNames = new Set();

        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var pct = Math.round(((i + 1) / items.length) * 100);
          statusDiv.text('Fetching ' + (i + 1) + '/' + items.length + ': ' + item.title);
          progressBar.css('width', pct + '%');

          try {
            var url = item.isSlideUrl
              ? item.id
              : '/Academy/s/referenceMeterials/downloadcoursedoc/' + item.id;
            // Ensure absolute URL
            if (url.startsWith('/')) url = location.origin + url;

            var resp = await fetch(url, { credentials: 'same-origin' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            var arrayBuf = await resp.arrayBuffer();
            var contentDisposition = resp.headers.get('Content-Disposition') || '';

            var header = new Uint8Array(arrayBuf.slice(0, 5));
            var isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
            var isZip = header[0] === 0x50 && header[1] === 0x4B;

            if (isPdf) {
              try {
                var srcPdf = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
                var pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                pages.forEach(function (p) { mergedPdf.addPage(p); });
                pdfCount++;
                $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item merged')
                  .text(item.title + ' \u2014 ' + srcPdf.getPageCount() + 'pg merged');
              } catch (e) {
                failed++;
                console.warn('[PESUmate] PDF merge failed: ' + item.title, errMsg(e));
                $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item failed')
                  .text(item.title + ' \u2014 error');
              }
            } else if (isZip) {
              var filename = '';
              var cd = contentDisposition;
              if (cd) {
                var m = cd.match(/filename\*?=(?:UTF-8''|["']?)([^;"'\n]+)/i);
                if (m) filename = decodeURIComponent(m[1].trim());
              }
              if (!filename) {
                filename = item.title.replace(/[/\\:*?"<>|]/g, '_');
                if (!/\.(pptx?|docx?|xlsx?)$/i.test(filename)) filename += '.pptx';
              }
              var finalName = filename, counter = 1;
              while (usedNames.has(finalName.toLowerCase())) {
                var dot = filename.lastIndexOf('.');
                finalName = dot > 0
                  ? filename.slice(0, dot) + ' (' + counter + ')' + filename.slice(dot)
                  : filename + ' (' + counter + ')';
                counter++;
              }
              usedNames.add(finalName.toLowerCase());
              pptxFiles.push({ name: finalName, data: arrayBuf });
              $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item zipped')
                .text(item.title + ' \u2014 zipped');
            } else {
              failed++;
              $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item skipped')
                .text(item.title + ' \u2014 skipped');
            }
          } catch (err) {
            failed++;
            console.warn('[PESUmate] Download failed: ' + item.title, errMsg(err));
            $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item failed')
              .text(item.title + ' \u2014 failed');
          }

          if (i < items.length - 1) await new Promise(function (r) { setTimeout(r, 200); });
        }

        var safeName = unitText.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'slides';
        var statusParts = [];

        if (pdfCount > 0) {
          statusDiv.text('Saving merged PDF (' + mergedPdf.getPageCount() + ' pages)...');
          var pdfBytes = await mergedPdf.save();
          var pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          triggerDownload(pdfBlob, safeName + '_Merged.pdf');
          var sz = formatSize(pdfBlob.size);
          statusParts.push(pdfCount + ' PDFs merged \u00b7 ' + mergedPdf.getPageCount() + ' pages \u00b7 ' + sz);
        }

        if (pptxFiles.length > 0) {
          statusDiv.text('Creating ZIP for ' + pptxFiles.length + ' PPTX files...');
          await new Promise(function (r) { setTimeout(r, 500); });
          var zip = new JSZip();
          pptxFiles.forEach(function (f) { zip.file(f.name, f.data); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          triggerDownload(zipBlob, safeName + '_PPTX_files.zip');
          var sz2 = formatSize(zipBlob.size);
          statusParts.push(pptxFiles.length + ' PPTX files zipped \u00b7 ' + sz2);
        }

        if (pdfCount === 0 && pptxFiles.length === 0) {
          btn.text('No files downloaded').css('background', '#c62828');
          statusDiv.text('Could not process any files.');
        } else {
          btn.text('Done').css('background', '#2e7d32');
          statusDiv.html(statusParts.join('<br>') + (failed ? '<br>' + failed + ' failed' : ''));
        }
        progressWrap.hide();
      }

      // ─── Fetch & render ───
      async function fetchAndRender(force) {
        if (_fetching) return;

        var activeUnitText = activeUnitName();

        if (!force && cache[activeUnitText]) {
          console.log('[PESUmate] Cache hit: ' + activeUnitText);
          renderItems(activeUnitText, cache[activeUnitText], true);
          return;
        }

        _fetching = true;
        refetchBtn.prop('disabled', true).css('opacity', 0.5);
        titleDiv.text('Loading ' + activeUnitText + '...');
        statusDiv.text('Detecting subject...');
        contentArea.empty();
        progressWrap.show();
        progressBar.css('width', '5%');

        try {
          // Steps 1-2: subject ID and class list, both read straight from the DOM.
          //
          // These used to come from /Academy/a/i/getCourse and
          // /Academy/a/i/getCourseClasses, but /Academy/a/i/* is the admin
          // namespace and now answers "Access denied for student role" (HTTP 403)
          // for every student account. The page itself never calls them: the unit
          // tabs carry handleclassUnit('<unitid>') and each class link carries
          //   handleclasscoursecontentunit('<classUuid>','<subjectid>',...)
          // so both values are already on the page.
          statusDiv.text('Reading classes...');
          progressBar.css('width', '15%');

          var subjectid = null;
          var classes = [];
          var seenClass = new Set();
          $('[onclick*="handleclasscoursecontentunit"]').each(function () {
            var m = ($(this).attr('onclick') || '')
              .match(/handleclasscoursecontentunit\('([^']+)','([^']+)'/);
            if (!m) return;
            if (!subjectid) subjectid = m[2];
            var uuid = m[1];
            // One class appears once per content type; scan it a single time.
            if (seenClass.has(uuid)) return;
            seenClass.add(uuid);
            classes.push({ id: uuid, name: $(this).text().trim() || ('Class ' + (classes.length + 1)) });
          });

          if (!subjectid || !classes.length) {
            statusDiv.text('No classes found on this page - open a unit tab first');
            titleDiv.text('Nothing to scan');
            _fetching = false;
            refetchBtn.prop('disabled', false).css('opacity', 1);
            progressWrap.hide();
            return;
          }
          console.log('[PESUmate] DOM: subject ' + subjectid + ', ' + classes.length + ' classes');

          // Step 5: scan download links
          var seen = new Set();
          var downloadItems = [];
          for (var i = 0; i < classes.length; i++) {
            var cls = classes[i];
            var pct = 15 + Math.round(((i + 1) / classes.length) * 80);
            statusDiv.text('Scanning ' + (i + 1) + '/' + classes.length + ': ' + cls.name);
            progressBar.css('width', pct + '%');
            try {
              var response = await apiGet($, 'Step 5 (scan ' + cls.name + ')', '/Academy/s/studentProfilePESUAdmin', {
                url: 'studentProfilePESUAdmin', controllerMode: '6403', actionType: '60',
                selectedData: subjectid, id: '2', unitid: cls.id
              });
              if (typeof response === 'string') {
                var $html = $('<div>').html(response);
                $html.find('[onclick*="downloadcoursedoc"]').each(function () {
                  var onclick = $(this).attr('onclick') || '';
                  var m = onclick.match(/downloadcoursedoc\('([^']+)'\)/);
                  if (m && !seen.has(m[1])) {
                    seen.add(m[1]);
                    downloadItems.push({ title: $(this).text().trim() || cls.name, id: m[1], className: cls.name });
                  }
                });
                $html.find('[onclick*="downloadslidecoursedoc"]').each(function () {
                  var onclick = $(this).attr('onclick') || '';
                  var m = onclick.match(/loadIframe\('([^']+)'/);
                  if (m) {
                    var slideUrl = m[1].split('#')[0];
                    if (!seen.has(slideUrl)) {
                      seen.add(slideUrl);
                      downloadItems.push({ title: $(this).text().trim() || cls.name, id: slideUrl, className: cls.name, isSlideUrl: true });
                    }
                  }
                });
              }
            } catch (err) { console.warn('[PESUmate] warn: ' + cls.name, errMsg(err)); }
            if (i < classes.length - 1) await new Promise(function (r) { setTimeout(r, 300); });
          }

          progressBar.css('width', '100%');
          progressWrap.hide();

          // Never cache an empty result: [] is truthy, so one bad scrape would
          // pin "No files found" until a manual refresh.
          if (downloadItems.length) {
            cache[activeUnitText] = downloadItems;
            console.log('[PESUmate] Cached: ' + activeUnitText + ' (' + downloadItems.length + ')');
          }
          renderItems(activeUnitText, downloadItems, false);

        } catch (err) {
          console.error('[PESUmate] Fetch error:', err);
          if (err && err.responseText) {
            console.error('[PESUmate] Server said:', String(err.responseText).slice(0, 500));
          }
          titleDiv.text('Error');
          statusDiv.text('Failed: ' + errMsg(err));
          progressWrap.hide();
        }

        _fetching = false;
        refetchBtn.prop('disabled', false).css('opacity', 1);
      }

      // ─── Refetch ───
      refetchBtn.on('click', function () { fetchAndRender(true); });

      // ─── Tab change observer ───
      var _lastActiveTab = activeUnitName();
      var tabContainer = document.querySelector('#courselistunit');
      if (tabContainer) {
        var observer = new MutationObserver(function () {
          var newTab = $('#courselistunit li.active a').not('#pesu-dl-tab-btn a').text().trim();
          if (newTab && newTab !== _lastActiveTab) {
            console.log('[PESUmate] Tab: ' + _lastActiveTab + ' -> ' + newTab);
            _lastActiveTab = newTab;
            if (container.is(':visible')) {
              navBtn.addClass('active');
              fetchAndRender();
            }
          }
        });
        observer.observe(tabContainer, { subtree: true, attributes: true, attributeFilter: ['class'] });
      }

      console.log('[PESUmate] Ready');

      // ─── Helpers ───
      function triggerDownload(blob, filename) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
      }

      function formatSize(bytes) {
        return bytes > 1024 * 1024
          ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
          : (bytes / 1024).toFixed(0) + ' KB';
      }
    }); // end waitForJQuery
  } // end inject

  // ─── Start ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
