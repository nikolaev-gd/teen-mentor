// --- Header: show on scroll up, hide on scroll down ---
(function() {
  var header = document.getElementById('header');
  if (!header) return;

  var lastY = 0;
  var ticking = false;

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        var y = window.scrollY;
        if (y > lastY && y > 60) {
          // Scrolling down & past threshold
          header.classList.add('header--hidden');
        } else {
          // Scrolling up
          header.classList.remove('header--hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  });
})();

// --- Navigation ---
function toggleNav() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var isOpen = nav.classList.toggle('active');
  document.body.classList.toggle('no-scroll', isOpen);
}

// --- Modal ---
function openModal(id) {
  var modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.add('active');
  document.body.classList.add('no-scroll');
  modal.scrollTop = 0;
  history.pushState({ modal: id }, '');
}

function closeModal(id) {
  var modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

function closeAllModals() {
  document.querySelectorAll('.modal.active').forEach(function(modal) {
    modal.classList.remove('active');
  });
  document.body.classList.remove('no-scroll');
}

// Escape key closes modals and nav
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAllModals();
    var nav = document.getElementById('nav');
    if (nav && nav.classList.contains('active')) {
      toggleNav();
    }
  }
});

// Browser back button closes modal
window.addEventListener('popstate', function() {
  closeAllModals();
});

// --- Accordion ---
function toggleAccordion(trigger) {
  var item = trigger.parentElement;
  var content = item.querySelector('.accordion-content');
  var inner = content.querySelector('.accordion-content-inner');

  if (item.classList.contains('open')) {
    content.style.maxHeight = '0';
    item.classList.remove('open');
  } else {
    content.style.maxHeight = inner.scrollHeight + 'px';
    item.classList.add('open');
  }
}
