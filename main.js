// Header: transparente -> sólido al scrollear
(function () {
  var header = document.getElementById('siteHeader');
  var waFloat = document.getElementById('waFloat');
  if (!header) return;
  function onScroll() {
    var scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
    if (waFloat) waFloat.classList.toggle('visible', scrolled);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Menú mobile (hamburguesa + panel deslizante + overlay)
(function () {
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  var overlay = document.getElementById('moverlay');
  if (!burger || !mnav || !overlay) return;

  function closeMenu() {
    burger.classList.remove('active');
    mnav.classList.remove('active');
    overlay.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    var isOpen = mnav.classList.toggle('active');
    burger.classList.toggle('active', isOpen);
    overlay.classList.toggle('active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  }

  burger.addEventListener('click', toggleMenu);
  burger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
  });
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  mnav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
})();

// Botón volver arriba: aparece después del hero, se oculta cerca del footer
(function () {
  var topFloat = document.getElementById('topFloat');
  var waFloat = document.getElementById('waFloat');
  var hero = document.getElementById('top');
  var footer = document.getElementById('siteFooter');
  if (!topFloat) return;

  topFloat.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (hero && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        topFloat.classList.toggle('visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    heroObserver.observe(hero);
  }

  if (footer && 'IntersectionObserver' in window) {
    var footerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (waFloat) waFloat.classList.toggle('hidden', entry.isIntersecting);
        topFloat.classList.toggle('hidden', entry.isIntersecting);
      });
    }, { threshold: 0.01 });
    footerObserver.observe(footer);
  }
})();

// Desplegables (Áreas de práctica + FAQ) -> abre/cierra animando la altura real con WAAPI.
// No se puede animar con CSS puro: el navegador oculta/muestra el contenido de <details> de
// forma nativa e instantánea en el mismo instante en que cambia el atributo "open", lo que
// deja la primera apertura sin estado inicial del que partir (salta) y el cierre sin tiempo
// de jugar la transición (también salta). Acá controlamos "open" a mano, en el momento justo.
(function () {
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var duration = reduceMotion ? 1 : 300;

  function enableSmoothDetails(detailsSelector, contentSelector) {
    document.querySelectorAll(detailsSelector).forEach(function (details) {
      var summary = details.querySelector('summary');
      var content = details.querySelector(contentSelector);
      if (!summary || !content) return;

      var animation = null;
      var isClosing = false;
      var isExpanding = false;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        details.style.overflow = 'hidden';
        if (isClosing || !details.open) {
          open();
        } else if (isExpanding || details.open) {
          close();
        }
      });

      function open() {
        details.style.height = details.offsetHeight + 'px';
        details.open = true;
        window.requestAnimationFrame(function () { expand(); });
      }

      function expand() {
        isExpanding = true;
        var startHeight = details.offsetHeight;
        var endHeight = summary.offsetHeight + content.offsetHeight;
        runAnimation(startHeight, endHeight, true);
      }

      function close() {
        isClosing = true;
        var startHeight = details.offsetHeight;
        var endHeight = summary.offsetHeight;
        runAnimation(startHeight, endHeight, false);
      }

      function runAnimation(startHeight, endHeight, willBeOpen) {
        if (animation) animation.cancel();
        animation = details.animate(
          { height: [startHeight + 'px', endHeight + 'px'] },
          { duration: duration, easing: 'ease-out' }
        );
        animation.onfinish = function () { onAnimationFinish(willBeOpen); };
        animation.oncancel = function () { isClosing = false; isExpanding = false; };
      }

      function onAnimationFinish(willBeOpen) {
        details.open = willBeOpen;
        animation = null;
        isClosing = false;
        isExpanding = false;
        details.style.height = '';
        details.style.overflow = '';
      }
    });
  }

  enableSmoothDetails('.faq-item', '.faq-a');
  enableSmoothDetails('.area-expand', '.area-expand-anim');
})();

// Formulario de contacto -> FormSubmit.co
(function () {
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (!form || !status) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (form._honey && form._honey.value) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    status.textContent = '';
    status.className = 'form-status';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.success === 'true') {
          status.textContent = 'Mensaje enviado. Te voy a contactar a la brevedad.';
          status.className = 'form-status success';
          form.reset();
        } else {
          throw new Error('server-error');
        }
      })
      .catch(function () {
        status.textContent = 'No pudimos enviar tu mensaje. Probá de nuevo o escribime por WhatsApp.';
        status.className = 'form-status error';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
})();
