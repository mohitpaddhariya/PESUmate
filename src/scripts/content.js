// PESUmate — Content Script
// Injected into pesuacademy.com/Academy/* pages

(function () {
  'use strict';

  // Prevent double-init
  if (window._pesuMateInitialized) return;
  window._pesuMateInitialized = true;

  // ─── Shared state (persists across SPA navigations) ───
  var cache = {};

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

      // ─── Toggle panel ───
      navBtn.on('click', function () {
        if (container.is(':visible')) {
          container.slideUp(200);
          navBtn.removeClass('active');
        } else {
          container.slideDown(200);
          navBtn.addClass('active');
          var currentTab = $('#courselistunit li.active a').text().trim();
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

          btn.on('click', function () {
            var a = document.createElement('a');
            a.href = t.isSlideUrl ? t.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + t.id;
            a.download = '';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            $(this).addClass('done').text(t.title + ' \u2014 done');
          });

          contentArea.append(btn);
        });

        // Notify chat.js about rendered items
        window.dispatchEvent(new CustomEvent('pesumate-items-rendered', {
          detail: { items: items }
        }));
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
          var url = item.isSlideUrl ? item.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + item.id;
          var pct = Math.round(((i + 1) / items.length) * 100);
          statusDiv.text('Fetching ' + (i + 1) + '/' + items.length + ': ' + item.title);
          progressBar.css('width', pct + '%');

          try {
            var resp = await fetch(url, { credentials: 'same-origin' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            var arrayBuf = await resp.arrayBuffer();
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
                $('#pesu-dl-item-' + i).removeClass().addClass('pesu-dl-item failed')
                  .text(item.title + ' \u2014 error');
              }
            } else if (isZip) {
              var filename = '';
              var cd = resp.headers.get('Content-Disposition');
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

        var activeUnitText = $('#courselistunit li.active a').text().trim();

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
          // Step 1: subjectid
          var subjectid = null;
          $('#CourseContentId [onclick*="handleclasscoursecontentunit"]').first().each(function () {
            var m = $(this).attr('onclick').match(/handleclasscoursecontentunit\('[^']+','([^']+)'/);
            if (m) subjectid = m[1];
          });
          if (!subjectid) {
            statusDiv.text('Could not find subject ID');
            titleDiv.text('Error');
            _fetching = false;
            refetchBtn.prop('disabled', false).css('opacity', 1);
            progressWrap.hide();
            return;
          }

          // Step 2: units
          statusDiv.text('Fetching units...');
          progressBar.css('width', '15%');
          var unitsHtml = await $.get('/Academy/a/i/getCourse/' + subjectid);
          var units = [];
          $(unitsHtml).filter('option').add($(unitsHtml).find('option')).each(function () {
            var val = $(this).val(), name = $(this).text().trim();
            if (val && name) units.push({ id: val.replace(/[\\'"]/g, '').trim(), name: name });
          });

          // Step 3: match active unit
          var activeUnit = matchUnit(units, activeUnitText);
          if (!activeUnit) {
            statusDiv.text('No units found');
            titleDiv.text('No units');
            _fetching = false;
            refetchBtn.prop('disabled', false).css('opacity', 1);
            progressWrap.hide();
            return;
          }

          // Step 4: classes
          statusDiv.text('Fetching classes...');
          progressBar.css('width', '25%');
          var classesResponse = await $.get('/Academy/a/i/getCourseClasses/' + activeUnit.id);
          if (typeof classesResponse === 'string') { try { classesResponse = JSON.parse(classesResponse); } catch (e) { } }
          var classesHtml = typeof classesResponse === 'string' ? classesResponse : JSON.stringify(classesResponse);
          var classes = [];
          $(classesHtml).filter('option').add($(classesHtml).find('option')).each(function () {
            var val = $(this).val(), name = $(this).text().trim();
            if (val && name) classes.push({ id: val.replace(/[\\'"]/g, '').trim(), name: name });
          });

          // Step 5: scan download links
          var seen = new Set();
          var downloadItems = [];
          for (var i = 0; i < classes.length; i++) {
            var cls = classes[i];
            var pct = 25 + Math.round(((i + 1) / classes.length) * 70);
            statusDiv.text('Scanning ' + (i + 1) + '/' + classes.length + ': ' + cls.name);
            progressBar.css('width', pct + '%');
            try {
              var response = await $.get('/Academy/s/studentProfilePESUAdmin', {
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
            } catch (err) { console.warn('[PESUmate] warn: ' + cls.name, err.statusText || err); }
            if (i < classes.length - 1) await new Promise(function (r) { setTimeout(r, 300); });
          }

          progressBar.css('width', '100%');
          progressWrap.hide();

          cache[activeUnitText] = downloadItems;
          console.log('[PESUmate] Cached: ' + activeUnitText + ' (' + downloadItems.length + ')');
          renderItems(activeUnitText, downloadItems, false);

        } catch (err) {
          console.error('[PESUmate] Fetch error:', err);
          titleDiv.text('Error');
          statusDiv.text('Failed: ' + (err.message || err));
          progressWrap.hide();
        }

        _fetching = false;
        refetchBtn.prop('disabled', false).css('opacity', 1);
      }

      // ─── Refetch ───
      refetchBtn.on('click', function () { fetchAndRender(true); });

      // ─── Re-render from cache (used by chat.js when closing chat) ───
      window.addEventListener('pesumate-rerender', function () {
        var activeUnitText = $('#courselistunit li.active a').text().trim();
        if (cache[activeUnitText]) {
          renderItems(activeUnitText, cache[activeUnitText], true);
        }
      });

      // ─── Tab change observer ───
      var _lastActiveTab = $('#courselistunit li.active a').text().trim();
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
      function matchUnit(units, text) {
        var unit = null;
        for (var j = 0; j < units.length; j++) {
          var u = units[j];
          if (text.includes(u.name) || u.name.includes(text) ||
            text.toLowerCase() === u.name.toLowerCase()) { unit = u; break; }
        }
        if (!unit) {
          var words = text.toLowerCase().split(/\s+/);
          var best = 0;
          for (var k = 0; k < units.length; k++) {
            var uw = units[k].name.toLowerCase().split(/\s+/);
            var score = words.filter(function (w) { return uw.some(function (u2) { return u2.includes(w) || w.includes(u2); }); }).length;
            if (score > best) { best = score; unit = units[k]; }
          }
        }
        if (!unit && units.length > 0) unit = units[0];
        return unit;
      }

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
