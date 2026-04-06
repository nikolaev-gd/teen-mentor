(function() {
  // Determine path prefix based on directory depth
  var path = location.pathname;
  var prefix = '';
  if (path.indexOf('/texts/') !== -1) {
    prefix = '../';
  }

  // Determine active page from pathname
  var page = path.split('/').pop() || 'index.html';
  if (page === '' || page === '/') page = 'index.html';

  // Nav items: [href-filename, desktop-label, mobile-label]
  var navItems = [
    ['index.html',        'Главная',                       'Главная'],
    ['career.html',       'Карьерный коучинг',             'Карьерный коучинг'],
    ['tutoring.html',     'Тьюторское сопровождение',      'Тьюторское сопровождение'],
    ['full-support.html', 'Куратор обучения',              'Полное сопровождение в обучении'],
    ['parents.html',      'Сопровождение родителей',       'Сопровождение родителей'],
    ['about.html',        'Обо мне',                       'Обо мне'],
    ['texts.html',        'Тексты',                        'Тексты']
  ];

  // For texts/* pages, "Тексты" is active
  var activePage = page;
  if (path.indexOf('/texts/') !== -1) {
    activePage = 'texts.html';
  }

  // Build desktop nav (no "Главная")
  var desktopLinks = '';
  for (var i = 0; i < navItems.length; i++) {
    if (navItems[i][0] === 'index.html') continue;
    var isActive = (navItems[i][0] === activePage) ? ' class="active"' : '';
    desktopLinks += '<a href="' + prefix + navItems[i][0] + '"' + isActive + '>' + navItems[i][1] + '</a>';
  }

  // Build mobile nav (includes "Главная")
  var mobileLinks = '';
  for (var j = 0; j < navItems.length; j++) {
    var isActiveMobile = (navItems[j][0] === activePage) ? ' class="active"' : '';
    mobileLinks += '<li><a href="' + prefix + navItems[j][0] + '"' + isActiveMobile + '>' + navItems[j][2] + '</a></li>';
  }

  var html = '' +
    '<header class="header" id="header">' +
      '<div class="header-brand">' +
        '<a href="' + prefix + 'index.html" class="header-name">Геннадий Николаев</a>' +
        '<span class="header-divider"></span>' +
        '<span class="header-subtitle">ментор по самореализации</span>' +
      '</div>' +
      '<nav class="nav-desktop">' + desktopLinks + '</nav>' +
      '<button class="menu-toggle" aria-label="Меню" onclick="toggleNav()">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
    '</header>' +
    '<div class="nav-overlay" id="nav">' +
      '<button class="nav-close" aria-label="Закрыть" onclick="toggleNav()">✕</button>' +
      '<ul>' + mobileLinks + '</ul>' +
    '</div>';

  var root = document.getElementById('header-root');
  if (root) {
    root.innerHTML = html;
  }
})();
