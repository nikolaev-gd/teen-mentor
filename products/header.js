(function() {
  // Determine path prefix based on directory depth
  var path = location.pathname;
  var prefix = (path.indexOf('/texts/') !== -1) ? '../' : '';

  // Determine active page from pathname
  var page = path.split('/').pop() || 'index.html';
  if (page === '' || page === '/') page = 'index.html';

  // For texts/* pages, "Тексты" is active
  var activePage = (path.indexOf('/texts/') !== -1) ? 'texts.html' : page;

  // Пункты меню: [файл, подпись]. Подписи — дословные заголовки страниц,
  // без сокращений. Меню одно на все ширины: и на телефоне, и на десктопе
  // оно открывается бургером, поэтому длина названий ничем не ограничена.
  var navItems = [
    ['index.html',        'Главная'],
    ['career.html',       'Карьерный коучинг'],
    ['tutoring.html',     'Тьюторское сопровождение'],
    ['full-support.html', 'Полное сопровождение в обучении'],
    ['parents.html',      'Сопровождение родителей'],
    ['about.html',        'Обо мне'],
    ['texts.html',        'Тексты']
  ];

  // Активный пункт помечаем и классом, и aria-current: без второго
  // скринридер не отличает текущий раздел от остальных.
  function attrs(href) {
    return (href === activePage) ? ' class="active" aria-current="page"' : '';
  }

  var menuLinks = '';
  for (var i = 0; i < navItems.length; i++) {
    menuLinks += '<li><a href="' + prefix + navItems[i][0] + '"' +
                 attrs(navItems[i][0]) + '>' + navItems[i][1] + '</a></li>';
  }

  var nameAttrs = (activePage === 'index.html') ? ' aria-current="page"' : '';

  var html = '' +
    '<header class="header" id="header">' +
      '<div class="header-brand">' +
        '<a href="' + prefix + 'index.html" class="header-name"' + nameAttrs + '>Геннадий Николаев</a>' +
        '<span class="header-divider" aria-hidden="true"></span>' +
        '<span class="header-subtitle">ментор по самореализации</span>' +
      '</div>' +
      '<a class="header-contact" href="https://t.me/nikolaev_gd" target="_blank" rel="noopener noreferrer">Написать</a>' +
      '<button class="menu-toggle" type="button" aria-label="Меню" aria-expanded="false" aria-controls="nav" onclick="toggleNav()">' +
        '<span class="menu-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
        '<span class="menu-toggle-label" aria-hidden="true">Меню</span>' +
      '</button>' +
    '</header>' +
    '<div class="nav-overlay" id="nav">' +
      '<button class="nav-close" type="button" aria-label="Закрыть" onclick="toggleNav()">✕</button>' +
      '<nav aria-label="Разделы сайта"><ul>' + menuLinks + '</ul></nav>' +
    '</div>';

  var root = document.getElementById('header-root');
  if (root) {
    root.innerHTML = html;
  }

  // aria-expanded держим в актуальном состоянии, каким бы способом меню
  // ни закрыли (бургер, крестик, Escape — всё это лежит в script.js).
  var overlay = document.getElementById('nav');
  var toggle = root ? root.querySelector('.menu-toggle') : null;
  if (overlay && toggle && window.MutationObserver) {
    new MutationObserver(function() {
      toggle.setAttribute('aria-expanded',
        overlay.classList.contains('active') ? 'true' : 'false');
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  // Load editor.js dynamically
  var editorScript = document.createElement('script');
  editorScript.src = prefix + 'editor.js';
  document.body.appendChild(editorScript);
})();
