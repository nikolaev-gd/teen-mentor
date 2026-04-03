(function() {
  // Only run when ?edit is in the URL
  if (!new URLSearchParams(location.search).has('edit')) return;

  // Handle token: save from URL to localStorage, then clean URL
  var params = new URLSearchParams(location.search);
  if (params.has('token')) {
    localStorage.setItem('gh_editor_token', params.get('token'));
    params.delete('token');
    var cleanURL = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState(null, '', cleanURL);
  }
  var GITHUB_TOKEN = localStorage.getItem('gh_editor_token');
  if (!GITHUB_TOKEN) {
    alert('Нет токена доступа. Запросите ссылку у администратора.');
    return;
  }

  // Add ?edit to internal links so editor mode persists on navigation
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      var url = new URL(href, location.href);
      if (url.hostname !== location.hostname) continue;
      if (!url.searchParams.has('edit')) {
        url.searchParams.set('edit', '');
        links[i].setAttribute('href', url.pathname + url.search + url.hash);
      }
    } catch(e) { continue; }
  }

  // Inject editor styles
  var style = document.createElement('style');
  style.textContent = [
    '#editor-panel { position:fixed; bottom:20px; right:20px; z-index:10000; display:flex; gap:8px; font-family:Inter,sans-serif; }',
    '#editor-panel button { padding:10px 18px; border:none; border-radius:8px; font-size:14px; font-weight:500; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.15); transition:all .2s; }',
    '#editor-toggle { background:#1a1a1a; color:#fff; }',
    '#editor-toggle:hover { background:#333; }',
    '#editor-toggle.editing { background:#2d7d3a; }',
    '#editor-toggle.editing:hover { background:#236b2e; }',
    '#editor-cancel { background:#fff; color:#666; border:1px solid #ddd!important; display:none; }',
    '#editor-cancel:hover { background:#f5f5f5; }',
    '.editor-active [contenteditable="true"] { outline:2px dashed rgba(45,125,58,.3); outline-offset:4px; border-radius:4px; min-height:1em; }',
    '.editor-active [contenteditable="true"]:focus { outline:2px solid rgba(45,125,58,.6); background:rgba(45,125,58,.03); }',
    '#editor-toast { position:fixed; bottom:80px; right:20px; z-index:10000; padding:12px 20px; border-radius:8px; font-size:14px; font-family:Inter,sans-serif; color:#fff; background:#2d7d3a; box-shadow:0 2px 8px rgba(0,0,0,.15); opacity:0; transition:opacity .3s; pointer-events:none; }'
  ].join('\n');
  document.head.appendChild(style);

  // Toast notification
  var toast = document.createElement('div');
  toast.id = 'editor-toast';
  document.body.appendChild(toast);

  function showToast(text, isError) {
    toast.textContent = text;
    toast.style.background = isError ? '#d32f2f' : '#2d7d3a';
    toast.style.opacity = '1';
    setTimeout(function() { toast.style.opacity = '0'; }, 3000);
  }

  // Floating button panel
  var panel = document.createElement('div');
  panel.id = 'editor-panel';
  panel.innerHTML = '<button id="editor-cancel">Отменить</button><button id="editor-toggle">Редактировать</button>';
  document.body.appendChild(panel);

  var toggle = document.getElementById('editor-toggle');
  var cancel = document.getElementById('editor-cancel');
  var isEditing = false;
  var originalContent = '';
  var draftInterval = null;
  var draftFilename = (window.location.pathname.split('/').pop() || 'index.html');
  var draftKey = 'draft_' + draftFilename;
  function blockClicks(e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    if (el.id === 'editor-toggle' || el.id === 'editor-cancel') return;
    e.preventDefault();
    e.stopPropagation();
  }

  // Restore draft if exists
  var savedDraft = localStorage.getItem(draftKey);
  if (savedDraft && confirm('Найден несохранённый черновик. Восстановить?')) {
    document.documentElement.innerHTML = savedDraft;
    // Re-append editor elements after restoring draft
    document.head.appendChild(style);
    document.body.appendChild(toast);
    panel = document.createElement('div');
    panel.id = 'editor-panel';
    panel.innerHTML = '<button id="editor-cancel">Отменить</button><button id="editor-toggle">Редактировать</button>';
    document.body.appendChild(panel);
    toggle = document.getElementById('editor-toggle');
    cancel = document.getElementById('editor-cancel');
    // Auto-start editing after draft restore
    setTimeout(function() { startEditing(); }, 0);
  } else if (savedDraft) {
    localStorage.removeItem(draftKey);
  }

  // Which elements can be edited
  var editableSelector = 'h1, h2, h3, p, li, a, button, span, .audience-item, .audience-role, .audience-note-tail';

  toggle.addEventListener('click', function() {
    if (!isEditing) {
      startEditing();
    } else {
      saveChanges();
    }
  });

  cancel.addEventListener('click', function() {
    cancelEditing();
  });

  function startEditing() {
    isEditing = true;
    originalContent = document.querySelector('main').innerHTML;

    toggle.textContent = 'Сохранить';
    toggle.classList.add('editing');
    cancel.style.display = 'block';
    document.body.classList.add('editor-active');
    document.addEventListener('click', blockClicks, true);

    // Start draft autosave every 3 seconds
    draftInterval = setInterval(function() {
      localStorage.setItem(draftKey, document.documentElement.innerHTML);
    }, 3000);

    var elements = document.querySelectorAll(editableSelector);
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].id === 'editor-toggle' || elements[i].id === 'editor-cancel' || elements[i].closest('#editor-panel')) continue;
      elements[i].setAttribute('contenteditable', 'true');
    }
  }

  function cancelEditing() {
    document.querySelector('main').innerHTML = originalContent;
    localStorage.removeItem(draftKey);
    if (draftInterval) { clearInterval(draftInterval); draftInterval = null; }
    endEditing();
  }

  function endEditing() {
    isEditing = false;
    var elements = document.querySelectorAll('[contenteditable]');
    for (var i = 0; i < elements.length; i++) {
      elements[i].removeAttribute('contenteditable');
    }
    toggle.textContent = 'Редактировать';
    toggle.classList.remove('editing');
    cancel.style.display = 'none';
    document.body.classList.remove('editor-active');
    document.removeEventListener('click', blockClicks, true);
  }

  var GITHUB_REPO = 'nikolaev-gd/teen-mentor';
  var GITHUB_BRANCH = 'main';

  function saveChanges() {
    // Stop draft autosave
    if (draftInterval) { clearInterval(draftInterval); draftInterval = null; }

    // Remove editor traces before capturing HTML
    var elements = document.querySelectorAll('[contenteditable]');
    for (var i = 0; i < elements.length; i++) {
      elements[i].removeAttribute('contenteditable');
    }
    document.body.classList.remove('editor-active');
    cancel.style.display = 'none';
    panel.style.display = 'none';

    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';

    toggle.textContent = 'Сохранение...';

    // Temporarily remove editor elements from DOM for clean capture
    style.remove();
    panel.remove();
    toast.remove();

    var fullHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    // Restore editor elements
    document.head.appendChild(style);
    document.body.appendChild(toast);
    document.body.appendChild(panel);
    panel.style.display = 'flex';

    var apiURL = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + filename;
    var headers = {
      'Authorization': 'Bearer ' + GITHUB_TOKEN,
      'Accept': 'application/vnd.github+v3+json'
    };

    // Step 1: Get current SHA
    fetch(apiURL + '?ref=' + GITHUB_BRANCH, { headers: headers })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var sha = data.sha;

      // Step 2: PUT updated file
      return fetch(apiURL, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          message: 'Update ' + filename + ' via site editor',
          content: btoa(unescape(encodeURIComponent(fullHTML))),
          sha: sha,
          branch: GITHUB_BRANCH
        })
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function() {
      isEditing = false;
      localStorage.removeItem(draftKey);
      toggle.textContent = 'Сохранено!';
      toggle.classList.remove('editing');
      showToast('Сохранено! Изменения на сайте через 1\u20132 минуты');
      setTimeout(function() {
        toggle.textContent = 'Редактировать';
      }, 2000);
    })
    .catch(function(err) {
      showToast('Ошибка сохранения: ' + err.message, true);
      // Restore UI without restarting editing (preserves originalContent)
      toggle.textContent = 'Сохранить';
      toggle.classList.add('editing');
      cancel.style.display = 'block';
      document.body.classList.add('editor-active');
      var els = document.querySelectorAll(editableSelector);
      for (var i = 0; i < els.length; i++) {
        if (els[i].closest('button') || els[i].closest('a') || els[i].closest('.cta-buttons')) continue;
        els[i].setAttribute('contenteditable', 'true');
      }
    });
  }
})();
