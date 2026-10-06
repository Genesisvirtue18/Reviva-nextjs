/* ==========================================================================
   REVIVA - custom.js
   The site's only script. It carries the global header behaviour plus the
   union of what the thirteen old per-page scripts did, deduplicated.

   Those files each declared `const whatsappBtn`, `const fadeElements` and so
   on at top level, so simply concatenating them would have been a duplicate
   declaration SyntaxError that killed the whole bundle. Every block here is
   inside one IIFE and every lookup is null-checked, because this file now
   runs on all 158 pages rather than the handful each old file was written
   for.

   Dropped on the way in: the hamburger and .nav-links code, which pointed at
   markup the header rebuild removed.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ======================================================================
     GLOBAL HEADER
     ====================================================================== */

  var header = $('.rv-header');
  var nav    = header ? $('.rv-nav', header) : null;
  var toggle = header ? $('.rv-toggle', header) : null;
  var scrim  = $('.rv-scrim');

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var desktop = window.matchMedia('(min-width: 1080px)');

  if (header) {

    /* ---- skip-link target ---------------------------------------------- */

    // These pages predate the header and carry no #main. Attach the id to the
    // first plausible content root so the skip link always lands somewhere.
    if (!document.getElementById('main')) {
      var target = $('main, [role="main"]');
      if (!target) {
        var kids = document.body.children;
        for (var k = 0; k < kids.length; k++) {
          var el = kids[k];
          if (el === header) { continue; }
          if (el.classList && el.classList.contains('rv-scrim')) { continue; }
          if (/^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE|BR)$/.test(el.tagName)) { continue; }
          target = el;
          break;
        }
      }
      if (target) {
        target.id = 'main';
        if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
      }
    }

    /* ---- compact on scroll ---------------------------------------------- */

    var ticking = false;
    var onHeaderScroll = function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 40);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();

    /* ---- mega panels / drawer accordions -------------------------------- */

    var items = $$('.rv-nav__item', header);
    var hoverTimer = null;

    var closePanel = function (item) {
      if (!item) { return; }
      item.classList.remove('is-open');
      var t = $('.rv-nav__link[aria-expanded]', item);
      if (t) { t.setAttribute('aria-expanded', 'false'); }
    };

    var closeAllPanels = function (except) {
      items.forEach(function (item) { if (item !== except) { closePanel(item); } });
    };

    var openPanel = function (item) {
      if (desktop.matches) { closeAllPanels(item); }
      item.classList.add('is-open');
      var t = $('.rv-nav__link[aria-expanded]', item);
      if (t) { t.setAttribute('aria-expanded', 'true'); }
    };

    items.forEach(function (item) {
      var trigger = $('.rv-nav__link[aria-expanded]', item);
      if (!trigger || !$('.rv-panel', item)) { return; }

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (item.classList.contains('is-open')) { closePanel(item); } else { openPanel(item); }
      });

      // Pointer affordance, desktop only. The close delay lets a diagonal
      // mouse path reach the panel without dismissing it.
      item.addEventListener('mouseenter', function () {
        if (!desktop.matches) { return; }
        window.clearTimeout(hoverTimer);
        openPanel(item);
      });

      item.addEventListener('mouseleave', function () {
        if (!desktop.matches) { return; }
        hoverTimer = window.setTimeout(function () { closePanel(item); }, 180);
      });

      item.addEventListener('focusout', function (e) {
        if (!desktop.matches) { return; }
        if (!item.contains(e.relatedTarget)) { closePanel(item); }
      });
    });

    /* ---- drawer ---------------------------------------------------------- */

    var lastFocused = null;
    var drawerIsOpen = function () { return !!nav && nav.classList.contains('is-open'); };

    var openDrawer = function () {
      if (!nav) { return; }
      lastFocused = document.activeElement;
      nav.classList.add('is-open');
      if (scrim) { scrim.classList.add('is-open'); }
      document.body.classList.add('rv-no-scroll');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
      }
      var first = $(FOCUSABLE, nav);
      if (first) { first.focus(); }
    };

    var closeDrawer = function () {
      if (!drawerIsOpen()) { return; }
      nav.classList.remove('is-open');
      if (scrim) { scrim.classList.remove('is-open'); }
      document.body.classList.remove('rv-no-scroll');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
      if (lastFocused && typeof lastFocused.focus === 'function') { lastFocused.focus(); }
      lastFocused = null;
    };

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (drawerIsOpen()) { closeDrawer(); } else { openDrawer(); }
      });
    }
    if (scrim) { scrim.addEventListener('click', closeDrawer); }

    if (nav) {
      nav.addEventListener('click', function (e) {
        if (desktop.matches) { return; }
        if (e.target.closest('a[href]')) { closeDrawer(); }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllPanels(null);
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab' || !drawerIsOpen()) { return; }

      var nodes = [];
      if (toggle) { nodes.push(toggle); }
      $$(FOCUSABLE, nav).forEach(function (el) {
        if (el.offsetParent !== null) { nodes.push(el); }
      });
      if (!nodes.length) { return; }

      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (desktop.matches && !header.contains(e.target)) { closeAllPanels(null); }
    });

    var onBreakpoint = function () {
      closeAllPanels(null);
      if (desktop.matches) { closeDrawer(); }
    };
    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onBreakpoint);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(onBreakpoint);          // Safari < 14
    }

    // Current-page aria-current is rendered server-side by components/Header.tsx.
  }

  /* ======================================================================
     FOOTER - copyright year
     ====================================================================== */

  var yearEl = document.getElementById('rv-year');
  if (yearEl) {
    var nowYear = new Date().getFullYear();
    var baked = parseInt(yearEl.textContent, 10);
    // Only ever moves forward, so a device clock set to the past cannot make
    // the site look stale.
    if (nowYear > baked) { yearEl.textContent = nowYear; }
  }

  /* ======================================================================
     FAQ ACCORDIONS
     Three markup shapes existed across the old page scripts. Each block is a
     no-op on a page that does not use that shape.
     ====================================================================== */

  // 1. .faq-question followed by .faq-answer, icon is a <span> in the question
  $$('.faq-question').forEach(function (question) {
    if (question.closest('.faq-box')) { return; }   // handled by shape 2
    question.addEventListener('click', function () {
      var answer = question.nextElementSibling;
      var icon = $('span', question);
      if (!answer) { return; }

      if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        if (icon) { icon.innerHTML = '+'; }
      } else {
        $$('.faq-answer').forEach(function (a) { a.style.maxHeight = null; });
        $$('.faq-question span').forEach(function (s) { s.innerHTML = '+'; });
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) { icon.innerHTML = '−'; }
      }
    });
  });

  // 2. .faq-box wrapping .faq-question / .faq-answer with a <button> icon
  $$('.faq-box').forEach(function (box) {
    var question = $('.faq-question', box);
    var answer = $('.faq-answer', box);
    var button = $('button', box);
    if (!question || !answer) { return; }

    question.addEventListener('click', function () {
      if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        if (button) { button.innerHTML = '+'; }
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (button) { button.innerHTML = '−'; }
      }
    });
  });

  // 3. .reviva-faq-item with head / body / icon
  $$('.reviva-faq-item').forEach(function (item) {
    var head = $('.reviva-faq-head', item);
    var body = $('.reviva-faq-body', item);
    var icon = $('.reviva-faq-icon', item);
    if (!head || !body) { return; }

    head.addEventListener('click', function () {
      item.classList.toggle('active');
      if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + 'px';
        if (icon) { icon.textContent = '−'; }
      } else {
        body.style.maxHeight = '0px';
        if (icon) { icon.textContent = '+'; }
      }
    });
  });

  /* ======================================================================
     SCROLL REVEAL
     The union of every element list the old scripts animated. Adding the
     class to elements a page does not have costs nothing.
     ====================================================================== */

  var REVEAL = [
    '.benefit-box', '.benefit-column', '.consultation-box',
    '.contact-form-wrapper', '.contact-info', '.cta-box', '.doctor-container',
    '.faq-box', '.faq-item', '.gallery-item', '.procedure-item',
    '.review-card', '.step', '.story-container', '.treatment-card', '.value-box'
  ].join(',');

  var revealEls = $$(REVEAL);

  if (revealEls.length) {
    // The old scripts injected this at runtime, after the stylesheets, so it
    // won over any .fade-up a page sheet happened to define. Kept that way.
    var revealStyle = document.createElement('style');
    revealStyle.innerHTML =
      '.fade-up{opacity:0;transform:translateY(50px);transition:1s ease}' +
      '.fade-up.show{opacity:1;transform:translateY(0)}';
    document.head.appendChild(revealStyle);

    revealEls.forEach(function (el) { el.classList.add('fade-up'); });

    var revealOnScroll = function () {
      revealEls.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) {
          el.classList.add('show');
        }
      });
    };
    window.addEventListener('scroll', revealOnScroll, { passive: true });
    revealOnScroll();
  }

  /* ======================================================================
     HERO PARALLAX
     Two effects existed: a transform on the element, and a background shift.
     Each selector keeps the one it had.
     ====================================================================== */

  var TRANSFORM_HEROES = '.about-hero,.blog-hero,.contact-hero,.gallery-hero,.reviews-hero,.treatments-hero';
  var BG_HEROES = '.treatment-hero';

  var transformHero = $(TRANSFORM_HEROES);
  var bgHero = $(BG_HEROES);

  if (transformHero || bgHero) {
    var parallaxTicking = false;
    var onParallax = function () {
      if (parallaxTicking) { return; }
      parallaxTicking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        if (transformHero) { transformHero.style.transform = 'translateY(' + (y * 0.08) + 'px)'; }
        if (bgHero) { bgHero.style.backgroundPositionY = (y * 0.4) + 'px'; }
        parallaxTicking = false;
      });
    };
    window.addEventListener('scroll', onParallax, { passive: true });
  }

  /* ======================================================================
     WHATSAPP BUTTON PULSE
     Was unguarded in all thirteen files, so it threw once a second on any
     page without the button.
     ====================================================================== */

  var whatsappBtn = $('.whatsapp-btn');
  if (whatsappBtn) {
    var pulseStyle = document.createElement('style');
    pulseStyle.innerHTML = '.pulse{transform:scale(1.05)}';
    document.head.appendChild(pulseStyle);

    window.setInterval(function () {
      whatsappBtn.classList.toggle('pulse');
    }, 1000);
  }

  /* ======================================================================
     CONTACT FORM
     Sends the enquiry to /contact-process.php (saved in Sanity → Enquiries)
     without leaving the page, with the page it came from and any ad
     tracking parameters. The old site only showed an alert and never sent
     anything.
     ====================================================================== */

  var TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
  // Remember the first ad parameters / landing page of the visit.
  try {
    var qs = new URLSearchParams(window.location.search);
    TRACKING.forEach(function (k) {
      if (qs.get(k) && !sessionStorage.getItem('rv_' + k)) { sessionStorage.setItem('rv_' + k, qs.get(k)); }
    });
    if (!sessionStorage.getItem('rv_landing_page')) { sessionStorage.setItem('rv_landing_page', window.location.pathname + window.location.search); }
    if (!sessionStorage.getItem('rv_referrer')) { sessionStorage.setItem('rv_referrer', document.referrer || ''); }
  } catch (err) { /* storage blocked: tracking is optional */ }

  $$('form.contact-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('[type="submit"], button:not([type])');
      var data = new FormData(form);
      data.append('source_page', window.location.pathname);
      try {
        TRACKING.concat(['landing_page', 'referrer']).forEach(function (k) {
          var v = sessionStorage.getItem('rv_' + k);
          if (v && !data.get(k)) { data.append(k, v); }
        });
      } catch (err) { /* ignore */ }

      if (button) { button.disabled = true; }
      fetch(form.getAttribute('action') || '/contact-process.php', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: res.ok, message: '' }; });
        })
        .then(function (r) {
          if (r.ok) {
            window.alert(r.message || 'Thank you! We will call you shortly.');
            form.reset();
          } else {
            window.alert(r.message || 'Something went wrong. Please call us instead.');
          }
        })
        .catch(function () {
          window.alert('Could not send your request. Please check your connection or call us.');
        })
        .then(function () {
          if (button) { button.disabled = false; }
        });
    });
  });

})();
