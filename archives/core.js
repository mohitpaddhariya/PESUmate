(async function pesuDownloader() {
  // Load libraries from CDN
  async function loadCDN(url, name) {
    if (window[name]) return;
    console.log('[PESUmate] Loading ' + name + '...');
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + name));
      document.head.appendChild(s);
    });
    console.log('[PESUmate] ' + name + ' loaded');
  }
  await loadCDN('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 'PDFLib');
  await loadCDN('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');

  const RESOURCE_TYPES = { '2': 'Slides', '3': 'Notes', '4': 'QA', '5': 'Assignments', '6': 'QB', '7': 'MCQs', '8': 'References' };

  // ─── Cache: persists across tab switches ───
  if (!window._pesuCache) window._pesuCache = {};
  const cache = window._pesuCache;

  // ─── Cleanup previous instance ───
  $('#pesu-dl-helper').remove();
  $('#pesu-dl-tab-btn').remove();
  if (window._pesuTabObserver) { window._pesuTabObserver.disconnect(); window._pesuTabObserver = null; }

  // ─── Download button at end of unit tabs ───
  const navBtn = $('<li id="pesu-dl-tab-btn"><a href="javascript:void(0)" style="cursor:pointer;color:#0091CD;font-weight:600;">PESUmate</a></li>');
  $('#courselistunit').append(navBtn);

  const container = $('<div id="pesu-dl-helper"></div>').css({
    position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999,
    background: '#fff', border: '1px solid #ddd', borderRadius: '4px',
    padding: '16px', maxHeight: '70vh', overflowY: 'auto', width: '380px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', fontFamily: 'inherit',
    borderTop: '3px solid #0091CD'
  });

  const titleDiv = $('<div id="pesu-dl-title" style="font-weight:600;font-size:14px;margin-bottom:8px;padding-right:50px;color:#1d3756;"></div>');
  const statusDiv = $('<div id="pesu-dl-status" style="font-size:11px;color:#999;margin-bottom:6px;"></div>');
  const progressWrap = $('<div></div>').css({
    width: '100%', background: '#e9ecef', borderRadius: '4px', height: '6px',
    marginBottom: '10px', display: 'none', overflow: 'hidden'
  });
  const progressBar = $('<div></div>').css({
    width: '0%', background: '#0091CD', height: '100%', borderRadius: '4px',
    transition: 'width 0.3s ease'
  });
  progressWrap.append(progressBar);
  const contentArea = $('<div id="pesu-dl-content"></div>');

  // Top bar: refetch + close
  const topBar = $('<div></div>').css({ position: 'absolute', top: '8px', right: '10px', display: 'flex', gap: '6px' });
  const refetchBtn = $('<button></button>').html('&#8635;').css({
    background: 'none', border: '1px solid #ddd', borderRadius: '3px',
    fontSize: '13px', cursor: 'pointer', color: '#0091CD', padding: '2px 6px',
    lineHeight: '1'
  }).attr('title', 'Refresh');
  const closeBtn = $('<button></button>').html('&times;').css({
    background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999',
    lineHeight: '1', padding: '0 2px'
  });
  topBar.append(refetchBtn).append(closeBtn);

  container.append(topBar).append(titleDiv).append(statusDiv).append(progressWrap).append(contentArea);
  container.hide(); // start hidden
  closeBtn.on('click', function() {
    container.slideUp(200);
  });
  $('body').append(container);

  // ─── Nav button toggles panel ───
  let _lastRenderedTab = '';
  navBtn.on('click', function() {
    if (container.is(':visible')) {
      container.slideUp(200);
    } else {
      container.slideDown(200);
      const currentTab = $('#courselistunit li.active a').text().trim();
      if (currentTab !== _lastRenderedTab) {
        _lastRenderedTab = currentTab;
        fetchAndRender();
      }
    }
  });

  // ─── Render cached items into the panel ───
  function renderItems(activeUnitText, downloadItems, fromCache) {
    _lastRenderedTab = activeUnitText;
    titleDiv.text(activeUnitText + ' (' + downloadItems.length + ')');
    statusDiv.text(downloadItems.length
      ? 'Ready' + (fromCache ? ' · cached' : '')
      : 'No files found');
    contentArea.empty();
    progressWrap.hide();

    if (downloadItems.length === 0) return;

    console.log('[PESUmate] ' + activeUnitText + ' — ' + downloadItems.length + ' files' + (fromCache ? ' (cached)' : ''));

    // Merge & Download button
    const dlAllBtn = $('<button>Merge & Download</button>').css({
      background: '#0091CD', color: '#fff', border: 'none', borderRadius: '3px',
      padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
      width: '100%', marginBottom: '10px', letterSpacing: '0.3px'
    }).on('click', async function() {
      if (downloadItems.length === 0) { statusDiv.text('Nothing to download'); return; }
      $(this).text('Downloading...').prop('disabled', true).css({ opacity: 0.6 });
      progressWrap.show();

      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();
      let pdfCount = 0, failed = 0;
      const pptxFiles = [];
      const usedNames = new Set();

      for (let i = 0; i < downloadItems.length; i++) {
        const item = downloadItems[i];
        const url = item.isSlideUrl ? item.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + item.id;
        const pct = Math.round(((i + 1) / downloadItems.length) * 100);
        statusDiv.text('Fetching ' + (i + 1) + '/' + downloadItems.length + ': ' + item.title);
        progressBar.css('width', pct + '%');

        try {
          const resp = await fetch(url, { credentials: 'same-origin' });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const arrayBuf = await resp.arrayBuffer();
          const header = new Uint8Array(arrayBuf.slice(0, 5));
          const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
          const isZip = header[0] === 0x50 && header[1] === 0x4B;

          if (isPdf) {
            try {
              const srcPdf = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
              const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
              pages.forEach(p => mergedPdf.addPage(p));
              pdfCount++;
              $('#pesu-dl-item-' + i).css({ background: '#e8f5e9', color: '#2e7d32' })
                .text(item.title + ' — ' + srcPdf.getPageCount() + 'pg merged');
            } catch (e) {
              failed++;
              $('#pesu-dl-item-' + i).css({ background: '#fce4ec', color: '#c62828' }).text(item.title + ' — error');
            }
          } else if (isZip) {
            let filename = '';
            const cd = resp.headers.get('Content-Disposition');
            if (cd) {
              const m = cd.match(/filename\*?=(?:UTF-8''|["']?)([^;"'\n]+)/i);
              if (m) filename = decodeURIComponent(m[1].trim());
            }
            if (!filename) {
              filename = item.title.replace(/[/\\:*?"<>|]/g, '_');
              if (!/\.(pptx?|docx?|xlsx?)$/i.test(filename)) filename += '.pptx';
            }
            let finalName = filename; let counter = 1;
            while (usedNames.has(finalName.toLowerCase())) {
              const dot = filename.lastIndexOf('.');
              finalName = dot > 0 ? filename.slice(0, dot) + ' (' + counter + ')' + filename.slice(dot) : filename + ' (' + counter + ')';
              counter++;
            }
            usedNames.add(finalName.toLowerCase());
            pptxFiles.push({ name: finalName, data: arrayBuf });
            $('#pesu-dl-item-' + i).css({ background: '#e3f2fd', color: '#1565c0' }).text(item.title + ' — zipped');
          } else {
            failed++;
            $('#pesu-dl-item-' + i).css({ background: '#fff8e1', color: '#f57f17' }).text(item.title + ' — skipped');
          }
        } catch (err) {
          failed++;
          $('#pesu-dl-item-' + i).css({ background: '#fce4ec', color: '#c62828' }).text(item.title + ' — failed');
        }
        if (i < downloadItems.length - 1) await new Promise(r => setTimeout(r, 200));
      }

      const safeName = activeUnitText.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'slides';
      let statusParts = [];

      if (pdfCount > 0) {
        statusDiv.text('Saving merged PDF (' + mergedPdf.getPageCount() + ' pages)...');
        const pdfBytes = await mergedPdf.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pdfBlob); a.download = safeName + '_Merged.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        const sz = pdfBlob.size > 1024 * 1024 ? (pdfBlob.size / (1024 * 1024)).toFixed(1) + ' MB' : (pdfBlob.size / 1024).toFixed(0) + ' KB';
        statusParts.push(pdfCount + ' PDFs merged · ' + mergedPdf.getPageCount() + ' pages · ' + sz);
      }

      if (pptxFiles.length > 0) {
        statusDiv.text('Creating ZIP for ' + pptxFiles.length + ' PPTX files...');
        await new Promise(r => setTimeout(r, 1000));
        const zip = new JSZip();
        pptxFiles.forEach(f => zip.file(f.name, f.data));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob); a.download = safeName + '_PPTX_files.zip';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        const sz = zipBlob.size > 1024 * 1024 ? (zipBlob.size / (1024 * 1024)).toFixed(1) + ' MB' : (zipBlob.size / 1024).toFixed(0) + ' KB';
        statusParts.push(pptxFiles.length + ' PPTX files zipped · ' + sz);
      }

      if (pdfCount === 0 && pptxFiles.length === 0) {
        dlAllBtn.text('No files downloaded').css({ background: '#c62828', opacity: 1 });
        statusDiv.text('Could not process any files.');
      } else {
        dlAllBtn.text('Done').css({ background: '#2e7d32', opacity: 1 });
        statusDiv.html(statusParts.join('<br>') + (failed ? '<br>' + failed + ' failed' : ''));
      }
      progressWrap.hide();
    });
    contentArea.append(dlAllBtn);

    // Individual buttons
    downloadItems.forEach((t, i) => {
      const btn = $('<button id="pesu-dl-item-' + i + '"></button>')
        .text((i + 1) + '. ' + t.title)
        .css({
          display: 'block', width: '100%', textAlign: 'left', background: '#f8f9fa',
          border: '1px solid #e9ecef', borderRadius: '3px', padding: '6px 10px',
          marginBottom: '3px', cursor: 'pointer', fontSize: '12px', color: '#1d3756',
          transition: 'background 0.15s'
        })
        .on('mouseenter', function() { $(this).css('background', '#e9ecef'); })
        .on('mouseleave', function() { if (!$(this).data('done')) $(this).css('background', '#f8f9fa'); })
        .on('click', function() {
          const a = document.createElement('a');
          a.href = t.isSlideUrl ? t.id : '/Academy/s/referenceMeterials/downloadcoursedoc/' + t.id;
          a.download = ''; a.style.display = 'none';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          $(this).data('done', true).css({ background: '#e8f5e9', color: '#2e7d32' }).text(t.title + ' — done');
        });
      contentArea.append(btn);
    });
  }

  // ─── Main fetch & render function ───
  let _fetching = false;
  async function fetchAndRender(force) {
    if (_fetching) return;

    const activeUnitText = $('#courselistunit li.active a').text().trim();

    // Check cache first (unless force refresh)
    if (!force && cache[activeUnitText]) {
      console.log('[PESUmate] Cache hit: ' + activeUnitText + ' (' + cache[activeUnitText].length + ' items)');
      renderItems(activeUnitText, cache[activeUnitText], true);
      return;
    }

    _fetching = true;
    refetchBtn.prop('disabled', true).css({ opacity: 0.5 });

    titleDiv.text('Loading ' + activeUnitText + '...');
    statusDiv.text('Detecting subject...');
    contentArea.empty();
    progressWrap.show();
    progressBar.css('width', '5%');

    try {
      // Step 1: Get subjectid
      let subjectid = null;
      $('#CourseContentId [onclick*="handleclasscoursecontentunit"]').first().each(function() {
        const m = $(this).attr('onclick').match(/handleclasscoursecontentunit\('[^']+','([^']+)'/);
        if (m) subjectid = m[1];
      });
      if (!subjectid) {
        statusDiv.text('Could not find subject ID');
        titleDiv.text('Error');
        _fetching = false; refetchBtn.prop('disabled', false).css({ opacity: 1 }); progressWrap.hide();
        return;
      }

      // Step 2: Get units
      statusDiv.text('Fetching units...');
      progressBar.css('width', '15%');
      const unitsHtml = await $.get('/Academy/a/i/getCourse/' + subjectid);
      const units = [];
      $(unitsHtml).filter('option').add($(unitsHtml).find('option')).each(function() {
        const val = $(this).val(), name = $(this).text().trim();
        if (val && name) units.push({ id: val.replace(/[\\'"]/g, '').trim(), name: name });
      });

      // Step 3: Match active unit
      let activeUnit = null;
      for (const u of units) {
        if (activeUnitText.includes(u.name) || u.name.includes(activeUnitText) ||
            activeUnitText.toLowerCase() === u.name.toLowerCase()) { activeUnit = u; break; }
      }
      if (!activeUnit) {
        const activeWords = activeUnitText.toLowerCase().split(/\s+/);
        let bestScore = 0;
        for (const u of units) {
          const unitWords = u.name.toLowerCase().split(/\s+/);
          const score = activeWords.filter(w => unitWords.some(uw => uw.includes(w) || w.includes(uw))).length;
          if (score > bestScore) { bestScore = score; activeUnit = u; }
        }
      }
      if (!activeUnit && units.length > 0) activeUnit = units[0];
      if (!activeUnit) {
        statusDiv.text('No units found');
        titleDiv.text('No units');
        _fetching = false; refetchBtn.prop('disabled', false).css({ opacity: 1 }); progressWrap.hide();
        return;
      }

      // Step 4: Get classes
      statusDiv.text('Fetching classes...');
      progressBar.css('width', '25%');
      let classesResponse = await $.get('/Academy/a/i/getCourseClasses/' + activeUnit.id);
      if (typeof classesResponse === 'string') { try { classesResponse = JSON.parse(classesResponse); } catch(e) {} }
      const classesHtml = typeof classesResponse === 'string' ? classesResponse : JSON.stringify(classesResponse);
      const classes = [];
      $(classesHtml).filter('option').add($(classesHtml).find('option')).each(function() {
        const val = $(this).val(), name = $(this).text().trim();
        if (val && name) classes.push({ id: val.replace(/[\\'"]/g, '').trim(), name: name });
      });

      // Step 5: Fetch download links
      const seen = new Set();
      const downloadItems = [];
      for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        const pct = 25 + Math.round(((i + 1) / classes.length) * 70);
        statusDiv.text('Scanning ' + (i + 1) + '/' + classes.length + ': ' + cls.name);
        progressBar.css('width', pct + '%');
        try {
          const response = await $.get('/Academy/s/studentProfilePESUAdmin', {
            url: 'studentProfilePESUAdmin', controllerMode: '6403', actionType: '60',
            selectedData: subjectid, id: '2', unitid: cls.id
          });
          if (typeof response === 'string') {
            const $html = $('<div>').html(response);
            $html.find('[onclick*="downloadcoursedoc"]').each(function() {
              const onclick = $(this).attr('onclick') || '';
              const m = onclick.match(/downloadcoursedoc\('([^']+)'\)/);
              if (m && !seen.has(m[1])) {
                seen.add(m[1]);
                downloadItems.push({ title: $(this).text().trim() || cls.name, id: m[1], className: cls.name });
              }
            });
            $html.find('[onclick*="downloadslidecoursedoc"]').each(function() {
              const onclick = $(this).attr('onclick') || '';
              const m = onclick.match(/loadIframe\('([^']+)'/);
              if (m) {
                const url = m[1].split('#')[0];
                if (!seen.has(url)) {
                  seen.add(url);
                  downloadItems.push({ title: $(this).text().trim() || cls.name, id: url, className: cls.name, isSlideUrl: true });
                }
              }
            });
          }
        } catch (err) { console.warn('  [warn: ' + cls.name + ']', err.statusText || err); }
        if (i < classes.length - 1) await new Promise(r => setTimeout(r, 300));
      }

      progressBar.css('width', '100%');
      progressWrap.hide();

      // ─── Cache the results ───
      cache[activeUnitText] = downloadItems;
      console.log('[PESUmate] Cached: ' + activeUnitText + ' (' + downloadItems.length + ' items)');

      // ─── Render results ───
      renderItems(activeUnitText, downloadItems, false);
    } catch (err) {
      console.error('Fetch error:', err);
      titleDiv.text('Error');
      statusDiv.text('Failed: ' + (err.message || err));
      progressWrap.hide();
    }

    _fetching = false;
    refetchBtn.prop('disabled', false).css({ opacity: 1 });
  }

  // ─── Refetch button (force=true bypasses cache) ───
  refetchBtn.on('click', function() { fetchAndRender(true); });

  // ─── Auto-detect unit tab change ───
  let _lastActiveTab = $('#courselistunit li.active a').text().trim();
  const tabContainer = document.querySelector('#courselistunit');
  if (tabContainer) {
    const observer = new MutationObserver(function() {
      const newTab = $('#courselistunit li.active a').text().trim();
      if (newTab && newTab !== _lastActiveTab) {
        console.log('[PESUmate] Tab: ' + _lastActiveTab + ' → ' + newTab);
        _lastActiveTab = newTab;
        if (container.is(':visible')) fetchAndRender();
      }
    });
    observer.observe(tabContainer, { subtree: true, attributes: true, attributeFilter: ['class'] });
    window._pesuTabObserver = observer;
    console.log('[PESUmate] Watching tab changes');
  }

  // ─── Ready (panel hidden until nav button clicked) ───
  console.log('[PESUmate] Ready. ' + Object.keys(cache).length + ' units cached.');
})();
