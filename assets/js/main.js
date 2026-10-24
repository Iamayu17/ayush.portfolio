/* =========================================================
   AYUSH KUMAR — PORTFOLIO 2026
   All interactions. Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function on(el, event, fn, opts) {
    if (el) el.addEventListener(event, fn, opts);
  }
  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }
  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function debounce(fn, wait) {
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function scrollToSection(selector) {
    var el = $(selector);
    if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* =========================================================
     THEME
     ========================================================= */
  var themeMeta = $('meta[name="theme-color"]');
  var themeBtn = $('#theme-toggle');

  function syncTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) store('ayu-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#f2ecdf' : '#0a0a0b');
    if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    doc.dispatchEvent(new CustomEvent('ayu:theme', { detail: { theme: theme } }));
  }

  function toggleTheme() {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    syncTheme(next, true);
    return next;
  }

  syncTheme(root.dataset.theme || 'dark', false);
  on(themeBtn, 'click', toggleTheme);

  var systemTheme = window.matchMedia('(prefers-color-scheme: light)');
  if (systemTheme.addEventListener) {
    systemTheme.addEventListener('change', function (e) {
      if (!readStore('ayu-theme')) syncTheme(e.matches ? 'light' : 'dark', false);
    });
  }

  /* =========================================================
     PRELOADER
     ========================================================= */
  var preloader = $('#preloader');
  if (preloader) {
    var hasVisited = null;
    try { hasVisited = sessionStorage.getItem('ayu-seen'); } catch (e) { /* ignore */ }

    var finishLoading = function () {
      preloader.classList.add('is-done');
      root.classList.remove('is-loading');
      try { sessionStorage.setItem('ayu-seen', '1'); } catch (e) { /* ignore */ }
      setTimeout(function () { if (preloader.parentNode) preloader.remove(); }, 1000);
    };

    if (prefersReduced || hasVisited) {
      preloader.remove();
    } else {
      root.classList.add('is-loading');
      var countEl = $('#preloader-count');
      var barEl = $('#preloader-bar');
      var startedAt = performance.now();
      var duration = 1050;
      var tick = function (now) {
        var p = Math.min(100, Math.round(((now - startedAt) / duration) * 100));
        if (countEl) countEl.textContent = p < 10 ? '0' + p : String(p);
        if (barEl) barEl.style.width = p + '%';
        if (p < 100) {
          requestAnimationFrame(tick);
        } else {
          setTimeout(finishLoading, 260);
        }
      };
      requestAnimationFrame(tick);
      setTimeout(function () {
        if (preloader.parentNode && !preloader.classList.contains('is-done')) finishLoading();
      }, 4200);
    }
  }

  /* =========================================================
     CUSTOM CURSOR
     ========================================================= */
  var cursorDot = $('#cursor-dot');
  var cursorRing = $('#cursor-ring');
  var cursorLabel = $('#cursor-label');

  if (finePointer && !prefersReduced && cursorDot && cursorRing) {
    root.classList.add('has-cursor');
    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx;
    var ry = my;
    var cursorSeen = false;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        rx = mx;
        ry = my;
      }
      cursorDot.style.transform = 'translate(' + mx + 'px, ' + my + 'px) translate(-50%, -50%)';

      var target = e.target.closest ? e.target.closest('a, button, [data-cursor], input, textarea, select') : null;
      var overField = target && target.matches('input, textarea, select');

      cursorDot.classList.toggle('is-hidden', !!overField);
      cursorRing.classList.toggle('is-hidden', !!overField);

      if (target && !overField) {
        if (target.hasAttribute('data-cursor')) {
          cursorRing.classList.add('is-hover');
          cursorRing.classList.remove('is-link');
          if (cursorLabel) cursorLabel.textContent = target.getAttribute('data-cursor');
        } else {
          cursorRing.classList.remove('is-hover');
          cursorRing.classList.add('is-link');
          if (cursorLabel) cursorLabel.textContent = '';
        }
      } else {
        cursorRing.classList.remove('is-hover', 'is-link');
        if (cursorLabel) cursorLabel.textContent = '';
      }
    }, { passive: true });

    var cursorLoop = function () {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursorRing.style.transform = 'translate(' + rx + 'px, ' + ry + 'px) translate(-50%, -50%)';
      requestAnimationFrame(cursorLoop);
    };
    requestAnimationFrame(cursorLoop);
  }

  /* =========================================================
     HEADER, PROGRESS, SCROLL-TOP
     ========================================================= */
  var header = $('#header');
  var scrollBar = $('#scroll-bar');
  var scrollUp = $('#scroll-up');
  var scrollTicking = false;

  function updateScrollUI() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 20);
    if (scrollBar) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
    if (scrollUp) scrollUp.classList.toggle('is-visible', y > 620);
    scrollTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  /* =========================================================
     NAV ACTIVE SECTION
     ========================================================= */
  var navLinks = $$('.nav__link');
  var navTargets = navLinks.map(function (link) {
    var href = link.getAttribute('href');
    return href && href.charAt(0) === '#' ? $(href) : null;
  }).filter(Boolean);

  if ('IntersectionObserver' in window && navTargets.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target.id === 'home') {
          navLinks.forEach(function (link) { link.classList.remove('is-active'); });
          return;
        }
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
    navTargets.forEach(function (section) { navObserver.observe(section); });
    var heroSection = $('#home');
    if (heroSection) navObserver.observe(heroSection);
  }

  /* =========================================================
     MOBILE MENU
     ========================================================= */
  var mobileMenu = $('#mobile-menu');
  var menuOpenBtn = $('#menu-open');

  function setMenu(open, returnFocus) {
    if (!mobileMenu || !menuOpenBtn) return;
    body.classList.toggle('menu-open', open);
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuOpenBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuOpenBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      var first = $('.mobile-menu__link', mobileMenu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 120);
    } else if (returnFocus) {
      menuOpenBtn.focus({ preventScroll: true });
    }
  }

  on(menuOpenBtn, 'click', function () {
    setMenu(!body.classList.contains('menu-open'), true);
  });
  if (mobileMenu) {
    $$('.mobile-menu__link, .mobile-menu__foot a', mobileMenu).forEach(function (link) {
      on(link, 'click', function () { setMenu(false, false); });
    });
  }
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false, true);
  });
  window.addEventListener('resize', debounce(function () {
    if (window.innerWidth > 900 && body.classList.contains('menu-open')) setMenu(false, false);
  }, 150));

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  var revealEls = $$('[data-reveal]');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* =========================================================
     TYPEWRITER
     ========================================================= */
  var roleEl = $('#role-text');
  if (roleEl) {
    var roles = ['Full-Stack Developer', 'AEM Integration Specialist', 'Frontend Engineer', 'UI/UX Enthusiast'];
    if (prefersReduced) {
      roleEl.textContent = roles[0];
    } else {
      var roleIndex = 0;
      var charIndex = roles[0].length;
      var deleting = false;
      var typeLoop = function () {
        var word = roles[roleIndex];
        if (!deleting) {
          charIndex++;
          roleEl.textContent = word.slice(0, charIndex);
          if (charIndex >= word.length) {
            deleting = true;
            setTimeout(typeLoop, 1900);
            return;
          }
          setTimeout(typeLoop, 64 + Math.random() * 36);
        } else {
          charIndex--;
          roleEl.textContent = word.slice(0, charIndex);
          if (charIndex <= 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(typeLoop, 380);
            return;
          }
          setTimeout(typeLoop, 30);
        }
      };
      setTimeout(typeLoop, 2100);
    }
  }

  /* =========================================================
     STAT COUNTERS
     ========================================================= */
  var counters = $$('[data-count]');
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }
    var start = performance.now();
    var total = 1500;
    var step = function (now) {
      var progress = Math.min(1, (now - start) / total);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* =========================================================
     HERO PARTICLE CANVAS
     ========================================================= */
  var heroCanvas = $('#hero-canvas');
  var hero = $('#home');

  if (heroCanvas && hero && !prefersReduced) {
    var canvasCtx = heroCanvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 0;
    var ch = 0;
    var particles = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var rafId = null;
    var heroVisible = true;
    var palette = { dot: '255,107,44', line: '242,238,230' };

    var readPalette = function () {
      palette.dot = root.dataset.theme === 'light' ? '224,77,24' : '255,107,44';
      palette.line = root.dataset.theme === 'light' ? '23,21,18' : '242,238,230';
    };
    readPalette();
    doc.addEventListener('ayu:theme', readPalette);

    var resizeCanvas = function () {
      var rect = hero.getBoundingClientRect();
      cw = rect.width;
      ch = rect.height;
      heroCanvas.width = Math.floor(cw * dpr);
      heroCanvas.height = Math.floor(ch * dpr);
      canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(78, Math.max(26, Math.round((cw * ch) / 22000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          vx: (Math.random() - 0.5) * 0.26,
          vy: (Math.random() - 0.5) * 0.26,
          r: Math.random() * 1.3 + 0.6
        });
      }
    };

    var drawParticles = function () {
      canvasCtx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > cw) p.vx *= -1;
        if (p.y < 0 || p.y > ch) p.vy *= -1;
        p.x = Math.max(0, Math.min(cw, p.x));
        p.y = Math.max(0, Math.min(ch, p.y));

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 132) {
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = 'rgba(' + palette.line + ',' + ((1 - dist / 132) * 0.14) + ')';
            canvasCtx.lineWidth = 0.7;
            canvasCtx.moveTo(p.x, p.y);
            canvasCtx.lineTo(q.x, q.y);
            canvasCtx.stroke();
          }
        }

        if (pointer.active) {
          var pdx = p.x - pointer.x;
          var pdy = p.y - pointer.y;
          var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 170) {
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = 'rgba(' + palette.dot + ',' + ((1 - pdist / 170) * 0.3) + ')';
            canvasCtx.lineWidth = 0.8;
            canvasCtx.moveTo(p.x, p.y);
            canvasCtx.lineTo(pointer.x, pointer.y);
            canvasCtx.stroke();
          }
        }

        canvasCtx.beginPath();
        canvasCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        canvasCtx.fillStyle = 'rgba(' + palette.dot + ',0.5)';
        canvasCtx.fill();
      }
      rafId = requestAnimationFrame(drawParticles);
    };

    var startCanvas = function () {
      if (rafId === null) drawParticles();
    };
    var stopCanvas = function () {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    resizeCanvas();
    startCanvas();

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { pointer.active = false; });
    window.addEventListener('resize', debounce(resizeCanvas, 180));

    document.addEventListener('visibilitychange', function () {
      if (doc.hidden) stopCanvas();
      else if (heroVisible) startCanvas();
    });

    if ('IntersectionObserver' in window) {
      var heroObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !doc.hidden) startCanvas();
        else stopCanvas();
      }, { threshold: 0 });
      heroObserver.observe(hero);
    }
  }

  /* =========================================================
     TILT
     ========================================================= */
  if (finePointer && !prefersReduced) {
    $$('[data-tilt]').forEach(function (el) {
      var max = el.classList.contains('idcard') ? 7 : el.classList.contains('project') ? 2.5 : 4;
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotateX = (0.5 - py) * max * 2;
        var rotateY = (px - 0.5) * max * 2;
        el.style.transform = 'perspective(1100px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
      }, { passive: true });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* =========================================================
     MAGNETIC BUTTONS
     ========================================================= */
  if (finePointer && !prefersReduced) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x / rect.width) * 9 + 'px, ' + (y / rect.height) * 9 + 'px)';
      }, { passive: true });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* =========================================================
     SKILLS TABS
     ========================================================= */
  var skillTabs = $$('.skill-tab');
  var skillPanels = $$('.skill-panel');

  function activateSkillTab(tab, focus) {
    skillTabs.forEach(function (t) {
      var active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
    });
    skillPanels.forEach(function (panel) {
      var active = panel.id === tab.getAttribute('aria-controls');
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    if (focus) tab.focus();
  }

  skillTabs.forEach(function (tab) {
    on(tab, 'click', function () { activateSkillTab(tab, false); });
    on(tab, 'keydown', function (e) {
      var index = skillTabs.indexOf(tab);
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = skillTabs[(index + 1) % skillTabs.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = skillTabs[(index - 1 + skillTabs.length) % skillTabs.length];
      if (e.key === 'Home') next = skillTabs[0];
      if (e.key === 'End') next = skillTabs[skillTabs.length - 1];
      if (next) {
        e.preventDefault();
        activateSkillTab(next, true);
      }
    });
  });

  /* =========================================================
     EXPERIENCE: TABS + ACCORDIONS
     ========================================================= */
  var xpTabs = $$('[data-xp-tab]');
  var xpLists = $$('.xp-list');

  xpTabs.forEach(function (tab) {
    on(tab, 'click', function () {
      var targetId = tab.getAttribute('data-xp-tab') === 'work' ? 'xp-work' : 'xp-education';
      xpTabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      xpLists.forEach(function (list) {
        var active = list.id === targetId;
        list.classList.toggle('is-active', active);
        list.hidden = !active;
      });
    });
  });

  $$('.xp__head').forEach(function (head) {
    on(head, 'click', function () {
      var item = head.closest('.xp');
      if (!item) return;
      var open = item.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* =========================================================
     SERVICE SPOTLIGHT
     ========================================================= */
  $$('[data-spotlight]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
    }, { passive: true });
  });

  /* =========================================================
     DIALOGS
     ========================================================= */
  var allDialogs = $$('dialog');

  function openDialog(id) {
    var dialog = doc.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      root.classList.add('modal-open');
    }
  }

  $$('[data-service-open]').forEach(function (btn) {
    on(btn, 'click', function () { openDialog(btn.getAttribute('data-service-open')); });
  });
  $$('[data-project-open]').forEach(function (btn) {
    on(btn, 'click', function () { openDialog(btn.getAttribute('data-project-open')); });
  });
  $$('[data-dialog-close]').forEach(function (btn) {
    on(btn, 'click', function () {
      var dialog = btn.closest('dialog');
      if (dialog) dialog.close();
    });
  });
  allDialogs.forEach(function (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (!doc.querySelector('dialog[open]')) root.classList.remove('modal-open');
    });
  });

  /* =========================================================
     WORK FILTERS
     ========================================================= */
  var filterBtns = $$('.filter');
  var projects = $$('.project');
  var projectCount = $('#project-count');

  filterBtns.forEach(function (btn) {
    on(btn, 'click', function () {
      var filter = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      var visible = 0;
      projects.forEach(function (project) {
        var tags = (project.getAttribute('data-tags') || '').split(' ');
        var show = filter === 'all' || tags.indexOf(filter) !== -1;
        project.hidden = !show;
        if (show) {
          visible++;
          project.style.animation = 'none';
          void project.offsetWidth;
          project.style.animation = 'cardIn 0.5s var(--ease) both';
        }
      });
      if (projectCount) projectCount.textContent = visible;
    });
  });

  /* =========================================================
     TOASTS
     ========================================================= */
  var toastWrap = $('#toasts');

  function toast(message, type) {
    if (!toastWrap) return;
    type = type || 'info';
    var icon = type === 'success' ? 'i-check' : type === 'error' ? 'i-close' : 'i-spark';
    var el = doc.createElement('div');
    el.className = 'toast' + (type !== 'info' ? ' toast--' + type : '');
    el.innerHTML = '<svg><use href="#' + icon + '"/></svg><span></span>';
    $('span', el).textContent = message;
    toastWrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { if (el.parentNode) el.remove(); }, 320);
    }, 4200);
  }

  /* =========================================================
     COPY EMAIL
     ========================================================= */
  var EMAIL = 'ayushkumarsep1998@gmail.com';
  var AEM_GUIDE = 'https://iamayu17.github.io/Adobe-Experience-Manager-AEM-/';

  function copyEmail() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () {
        toast('Email copied to clipboard.', 'success');
      }).catch(function () { fallbackCopy(); });
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    var ta = doc.createElement('textarea');
    ta.value = EMAIL;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    body.appendChild(ta);
    ta.select();
    try {
      doc.execCommand('copy');
      toast('Email copied to clipboard.', 'success');
    } catch (e) {
      toast('Could not copy — email is ' + EMAIL, 'error');
    }
    ta.remove();
  }

  $$('[data-copy-email]').forEach(function (btn) {
    on(btn, 'click', copyEmail);
  });

  /* =========================================================
     CONTACT FORM
     ========================================================= */
  var contactForm = $('#contact-form');

  if (contactForm) {
    var fieldConfig = {
      name: {
        el: $('#cf-name'),
        error: $('#err-name'),
        validate: function (value) { return value.trim().length >= 2 ? '' : 'Please enter your name.'; }
      },
      mobile: {
        el: $('#cf-mobile'),
        error: $('#err-mobile'),
        validate: function (value) {
          var digits = value.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15 ? '' : 'Enter a valid mobile number.';
        }
      },
      email: {
        el: $('#cf-email'),
        error: $('#err-email'),
        validate: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Enter a valid email address.';
        }
      },
      message: {
        el: $('#cf-message'),
        error: $('#err-message'),
        validate: function (value) { return value.trim().length >= 10 ? '' : 'Tell me a little more (10+ characters).'; }
      }
    };

    var setFieldError = function (key, message) {
      var field = fieldConfig[key];
      if (!field || !field.el) return;
      var wrap = field.el.closest('.field');
      if (wrap) wrap.classList.toggle('has-error', !!message);
      if (field.error) field.error.textContent = message || '';
      field.el.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    var validateForm = function () {
      var firstInvalid = null;
      Object.keys(fieldConfig).forEach(function (key) {
        var field = fieldConfig[key];
        if (!field.el) return;
        var message = field.validate(field.el.value);
        setFieldError(key, message);
        if (message && !firstInvalid) firstInvalid = field.el;
      });
      return firstInvalid;
    };

    Object.keys(fieldConfig).forEach(function (key) {
      var field = fieldConfig[key];
      if (!field.el) return;
      field.el.addEventListener('input', function () {
        var wrap = field.el.closest('.field');
        if (wrap && wrap.classList.contains('has-error')) {
          setFieldError(key, field.validate(field.el.value));
        }
      });
    });

    var formStatus = $('#form-status');
    var submitBtn = $('#contact-submit');
    var submitLabel = submitBtn ? $('.btn__label', submitBtn) : null;

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = validateForm();
      if (firstInvalid) {
        firstInvalid.focus();
        toast('Please fix the highlighted fields.', 'error');
        return;
      }

      var params = {
        name: fieldConfig.name.el.value.trim(),
        mobile: fieldConfig.mobile.el.value.trim(),
        email: fieldConfig.email.el.value.trim(),
        message: fieldConfig.message.el.value.trim(),
        from_name: fieldConfig.name.el.value.trim(),
        reply_to: fieldConfig.email.el.value.trim(),
        subject: 'Portfolio enquiry — ' + fieldConfig.name.el.value.trim()
      };

      if (formStatus) {
        formStatus.textContent = 'Sending your message…';
        formStatus.classList.remove('is-error');
      }
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending…';

      var finish = function () {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Send message';
      };

      if (!window.emailjs || typeof window.emailjs.send !== 'function') {
        if (formStatus) {
          formStatus.innerHTML = 'Email service could not load. <a href="mailto:' + EMAIL + '?subject=Portfolio%20enquiry">Email me directly</a> — I\'ll reply quickly.';
          formStatus.classList.add('is-error');
        }
        toast('Email service unavailable — please email me directly.', 'error');
        finish();
        return;
      }

      try {
        if (!window.__ayuEmailjsReady) {
          window.emailjs.init({ publicKey: '3LNBrrRC99c8CyNL0' });
          window.__ayuEmailjsReady = true;
        }
      } catch (initError) {
        console.error('EmailJS init failed:', initError);
      }

      window.emailjs.send('service_541koem', 'template_pmzbp2b', params)
        .then(function () {
          contactForm.reset();
          Object.keys(fieldConfig).forEach(function (key) { setFieldError(key, ''); });
          if (formStatus) {
            formStatus.classList.remove('is-error');
            formStatus.textContent = 'Message sent — thanks! I\'ll get back to you soon.';
          }
          toast('Message sent — talk soon.', 'success');
        })
        .catch(function (err) {
          console.error('EmailJS send failed:', err);
          if (formStatus) {
            formStatus.innerHTML = 'Could not send right now. <a href="mailto:' + EMAIL + '?subject=Portfolio%20enquiry">Email me directly</a> instead.';
            formStatus.classList.add('is-error');
          }
          toast('Message could not be sent — please email me directly.', 'error');
        })
        .then(finish);
    });
  }

  /* =========================================================
     LOCAL TIME
     ========================================================= */
  var timeEls = [$('#local-time'), $('#local-time-footer')].filter(Boolean);
  if (timeEls.length) {
    var updateClock = function () {
      var text;
      try {
        text = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date());
      } catch (e) {
        text = new Date().toLocaleTimeString();
      }
      timeEls.forEach(function (el) { el.textContent = text; });
    };
    updateClock();
    setInterval(updateClock, 30000);
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================================================
     CONFETTI (terminal easter egg)
     ========================================================= */
  function confetti() {
    if (prefersReduced) return;
    var canvas = doc.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2000';
    body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.scale(scale, scale);
    var colors = ['#ff6b2c', '#ffb067', '#f2eee6', '#7bd88f', '#ff9a66'];
    var pieces = [];
    for (var i = 0; i < 100; i++) {
      pieces.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.5,
        y: window.innerHeight * 0.52 + (Math.random() - 0.5) * 90,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 12 - 4,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.32,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    var started = performance.now();
    var frame = function (now) {
      var elapsed = now - started;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach(function (p) {
        p.vy += 0.24;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < 2800) requestAnimationFrame(frame);
      else canvas.remove();
    };
    requestAnimationFrame(frame);
  }

  /* =========================================================
     TERMINAL
     ========================================================= */
  var termForm = $('#terminal-form');
  var termInput = $('#terminal-input');
  var termOutput = $('#terminal-output');
  var termScreen = $('#terminal-screen');

  if (termForm && termInput && termOutput) {
    var history = [];
    var historyIndex = -1;

    var printLine = function (html, className) {
      var line = doc.createElement('div');
      line.className = 'term-line' + (className ? ' ' + className : '');
      line.innerHTML = html;
      termOutput.appendChild(line);
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    var printCommand = function (command) {
      var line = doc.createElement('div');
      line.className = 'term-line term-line--cmd';
      line.innerHTML = '<span class="term-prompt">$</span>' + escapeHtml(command);
      termOutput.appendChild(line);
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    var commandList = [
      ['help', 'show this list'],
      ['about', 'the short version of me'],
      ['skills', 'stack by category'],
      ['experience', 'where I have worked'],
      ['projects', 'things I have built'],
      ['contact', 'email, phone, location'],
      ['resume', 'download my CV'],
      ['socials', 'links to the rest of the internet'],
      ['theme', 'flip light / dark'],
      ['whoami', 'who is this guy'],
      ['hire', 'do it'],
      ['clear', 'wipe the screen']
    ];

    var runCommand = function (raw) {
      var input = raw.trim();
      if (!input) return;

      printCommand(input);
      history.push(input);
      historyIndex = history.length;

      var command = input.toLowerCase().split(/\s+/)[0];

      switch (command) {
        case 'help':
          printLine('Available commands:', 'term-line--accent');
          commandList.forEach(function (row) {
            printLine('<span class="term-code">' + row[0] + '</span> — ' + row[1]);
          });
          printLine('Tip: press ↑ / ↓ to walk through your command history.', 'term-line--muted');
          break;

        case 'about':
          printLine('Ayush Kumar — full-stack developer in Pune, India.', 'term-line--accent');
          printLine('5+ years across AEM, Java, React, and Angular. Adobe Certified Expert (AEM Sites, 2023).');
          printLine('Currently a Software Engineer at CGI, building editable templates, custom components, and reusable AEM Forms services.');
          break;

        case 'skills':
          printLine('frontend  → HTML, CSS, JavaScript, React, Angular');
          printLine('backend   → Java, Node.js, REST APIs, JUnit');
          printLine('aem       → AEM 6.5 & Cloud, Sites, Forms, Sling Models, OSGi, HTL');
          printLine('design    → Figma, Illustrator, Photoshop');
          printLine('tools     → Git, Maven, Jenkins, Docker, CI/CD, JIRA');
          break;

        case 'experience':
        case 'work':
          printLine('Sep 2024 — now    Software Engineer @ CGI, Pune', 'term-line--accent');
          printLine('Jun 2022 — 2024   Programmer Analyst @ Cognizant, Pune');
          printLine('Jan 2021 — 2022   Associate IT Consultant @ ITC Infotech, Pune');
          printLine('B.Tech Computer Science, KIIT — 2020');
          break;

        case 'projects':
        case 'project':
          printLine('01 — <a href="' + AEM_GUIDE + '" target="_blank" rel="noopener">AEM Integration &amp; Interview Guide</a> (open in a new tab)');
          printLine('02 — Flight Search Website · Angular + JSON APIs');
          printLine('03 — Online Course Website · Bootstrap 5 + React');
          printLine('04 — Brand &amp; Logo Design · personal AYU identity');
          break;

        case 'contact':
          printLine('email    → <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>');
          printLine('phone    → <a href="tel:+919834501361">+91 98345 01361</a>');
          printLine('location → Pune, Maharashtra, India');
          break;

        case 'resume':
        case 'cv':
          printLine('Fetching assets/pdf/Ayush_AEM_FULLSTACK_CGI.pdf …', 'term-line--muted');
          var dl = doc.createElement('a');
          dl.href = 'assets/pdf/Ayush_AEM_FULLSTACK_CGI.pdf';
          dl.download = 'Ayush-Kumar-CV.pdf';
          body.appendChild(dl);
          dl.click();
          dl.remove();
          printLine('Done — CV download started.', 'term-line--ok');
          break;

        case 'socials':
          printLine('github    → <a href="https://github.com/Iamayu17" target="_blank" rel="noopener">github.com/Iamayu17</a>');
          printLine('linkedin  → <a href="https://www.linkedin.com/in/ayush-kumar-b06b93176/" target="_blank" rel="noopener">linkedin.com/in/ayush-kumar-b06b93176</a>');
          printLine('instagram → <a href="https://www.instagram.com/ayu.sh.kumar/" target="_blank" rel="noopener">instagram.com/ayu.sh.kumar</a>');
          break;

        case 'theme':
          var nextTheme = toggleTheme();
          printLine('Theme switched to ' + nextTheme + '.', 'term-line--ok');
          break;

        case 'whoami':
          printLine('ayush — full-stack developer, AEM specialist, occasional designer.');
          break;

        case 'ls':
          printLine('home  about  skills  experience  services  work  playground  contact');
          break;

        case 'date':
          printLine(new Date().toString(), 'term-line--muted');
          break;

        case 'hire':
          printLine('Excellent decision. Opening the fastest route to my inbox…', 'term-line--accent');
          printLine('<a href="mailto:' + EMAIL + '?subject=Let%27s%20work%20together">' + EMAIL + '</a>');
          confetti();
          break;

        case 'sudo':
          printLine('Nice try — you already have root access to my inbox: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>', 'term-line--accent');
          break;

        case 'clear':
          termOutput.innerHTML = '';
          break;

        case 'exit':
          printLine('There is no exit. Only <span class="term-code">hire</span>.', 'term-line--muted');
          break;

        default:
          printLine('command not found: ' + escapeHtml(input), 'term-line--muted');
          printLine('Type <span class="term-code">help</span> to see what works.', 'term-line--muted');
      }

      termInput.value = '';
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    termForm.addEventListener('submit', function (e) {
      e.preventDefault();
      runCommand(termInput.value);
      termInput.focus();
    });

    termInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        termInput.value = history[historyIndex] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        termInput.value = history[historyIndex] || '';
      }
    });

    $$('[data-cmd]').forEach(function (btn) {
      on(btn, 'click', function () {
        runCommand(btn.getAttribute('data-cmd'));
        termInput.focus({ preventScroll: true });
      });
    });

    on(termScreen, 'click', function (e) {
      if (!e.target.closest('a')) termInput.focus({ preventScroll: true });
    });
  }

  /* =========================================================
     CHATBOT
     ========================================================= */
  var chat = $('#chat-panel');
  var chatToggle = $('#chat-toggle');
  var chatClose = $('#chat-close');
  var chatMessages = $('#chat-messages');
  var chatForm = $('#chat-form');
  var chatInput = $('#chat-input');

  function openChat() {
    if (!chat || !chatToggle) return;
    chat.classList.add('is-open');
    chat.setAttribute('aria-hidden', 'false');
    chatToggle.classList.add('is-open');
    chatToggle.setAttribute('aria-expanded', 'true');
    setTimeout(function () { if (chatInput) chatInput.focus({ preventScroll: true }); }, 260);
  }

  function closeChat(returnFocus) {
    if (!chat || !chatToggle) return;
    chat.classList.remove('is-open');
    chat.setAttribute('aria-hidden', 'true');
    chatToggle.classList.remove('is-open');
    chatToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) chatToggle.focus({ preventScroll: true });
  }

  function addChatMessage(sender, content, isHtml) {
    if (!chatMessages) return;
    var msg = doc.createElement('div');
    msg.className = 'chat__msg chat__msg--' + sender;
    if (isHtml) msg.innerHTML = content;
    else msg.textContent = content;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function botReply(question) {
    var text = question.toLowerCase();
    var answer;

    if (/service|offer|build|develop/.test(text)) {
      answer = 'Ayush works across three areas:<br>· UI/UX design — wireframes, prototypes, interface design<br>· Frontend development — React, Angular, HTML/CSS/JS<br>· AEM development — Sites, Forms, Sling Models, OSGi<br><a href="#services" data-chat-nav="#services">Jump to services →</a>';
    } else if (/resume|cv|download/.test(text)) {
      answer = 'Here you go — <a href="assets/pdf/Ayush_AEM_FULLSTACK_CGI.pdf" download>download the CV (PDF)</a>. There\'s also a <a href="assets/pdf/Ayush-FULLSTACK-DEVELOPER.pdf" download>full-stack version</a>.';
    } else if (/contact|email|reach|call|phone/.test(text)) {
      answer = 'Fastest route: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a><br>Phone: <a href="tel:+919834501361">+91 98345 01361</a><br>Or use the <a href="#contact" data-chat-nav="#contact">contact form</a>.';
    } else if (/avail|hire|job|role|freelance|open/.test(text)) {
      answer = 'Ayush is available for full-stack and AEM roles, plus freelance builds. He\'s based in Pune and open to remote work. <a href="#contact" data-chat-nav="#contact">Start the conversation →</a>';
    } else if (/skill|stack|tech|java|react|aem/.test(text)) {
      answer = 'Core stack: Java, AEM 6.5 &amp; Cloud, Sling/OSGi, React, Angular, JavaScript, HTML/CSS. Adobe Certified Expert in AEM Sites. <a href="#skills" data-chat-nav="#skills">See the full skill breakdown →</a>';
    } else if (/project|portfolio|guide|work/.test(text)) {
      answer = 'Start with the <a href="' + AEM_GUIDE + '" target="_blank" rel="noopener">AEM Integration &amp; Interview Guide</a>, then the Flight Search Website, Online Course Website, and the AYU brand identity. <a href="#work" data-chat-nav="#work">Browse the work →</a>';
    } else if (/where|location|pune|based/.test(text)) {
      answer = 'Pune, Maharashtra, India — currently working IST hours. The contact section shows his local time.';
    } else if (/hello|hi|hey|yo\b/.test(text)) {
      answer = 'Hey! I\'m Rio, Ayush\'s assistant. Ask me about his services, skills, resume, or availability.';
    } else if (/thank|thanks/.test(text)) {
      answer = 'Anytime. If you want to take it further, <a href="mailto:' + EMAIL + '">email Ayush</a> — he actually replies.';
    } else {
      answer = 'I don\'t have a scripted answer for that one. The quickest route is <a href="mailto:' + EMAIL + '">emailing Ayush directly</a>, or try asking about services, skills, projects, or availability.';
    }

    var typing = doc.createElement('div');
    typing.className = 'chat__msg chat__msg--bot chat__typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(function () {
      typing.remove();
      addChatMessage('bot', answer, true);
    }, 620);
  }

  on(chatToggle, 'click', function () {
    if (chat && chat.classList.contains('is-open')) closeChat(true);
    else openChat();
  });
  on(chatClose, 'click', function () { closeChat(true); });
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && chat && chat.classList.contains('is-open')) closeChat(true);
  });
  on(chatMessages, 'click', function (e) {
    var link = e.target.closest('[data-chat-nav]');
    if (link) {
      e.preventDefault();
      closeChat(false);
      scrollToSection(link.getAttribute('data-chat-nav'));
    }
  });

  $$('#chat-quick button').forEach(function (btn) {
    on(btn, 'click', function () {
      var question = btn.textContent.trim();
      addChatMessage('user', question, false);
      botReply(btn.getAttribute('data-q') || question);
    });
  });

  on(chatForm, 'submit', function (e) {
    e.preventDefault();
    if (!chatInput) return;
    var value = chatInput.value.trim();
    if (!value) return;
    addChatMessage('user', value, false);
    chatInput.value = '';
    botReply(value);
  });

  /* =========================================================
     COMMAND PALETTE
     ========================================================= */
  var palette = $('#palette');
  var paletteInput = $('#palette-input');
  var paletteList = $('#palette-list');
  var paletteOpenBtn = $('#palette-open');
  var paletteLastFocus = null;
  var paletteActions = [
    { label: 'Home', hint: 'Section', icon: 'i-arrow-up', run: function () { scrollToSection('#home'); } },
    { label: 'About me', hint: 'Section', icon: 'i-arrow-down', run: function () { scrollToSection('#about'); } },
    { label: 'Skills', hint: 'Section', icon: 'i-code', run: function () { scrollToSection('#skills'); } },
    { label: 'Experience & education', hint: 'Section', icon: 'i-briefcase', run: function () { scrollToSection('#experience'); } },
    { label: 'Services', hint: 'Section', icon: 'i-layers', run: function () { scrollToSection('#services'); } },
    { label: 'Selected work', hint: 'Section', icon: 'i-folder', run: function () { scrollToSection('#work'); } },
    { label: 'Playground terminal', hint: 'Section', icon: 'i-terminal', run: function () { scrollToSection('#playground'); } },
    { label: 'Contact', hint: 'Section', icon: 'i-mail', run: function () { scrollToSection('#contact'); } },
    { label: 'Download CV', hint: 'Action', icon: 'i-download', run: function () { window.location.href = 'assets/pdf/Ayush_AEM_FULLSTACK_CGI.pdf'; } },
    { label: 'Toggle theme', hint: 'Action', icon: 'i-sun', run: function () { toggleTheme(); } },
    { label: 'Copy email address', hint: 'Action', icon: 'i-copy', run: copyEmail },
    { label: 'Open AEM Integration & Interview Guide', hint: 'Resource', icon: 'i-external', run: function () { window.open(AEM_GUIDE, '_blank', 'noopener'); } },
    { label: 'Chat with Rio', hint: 'Assistant', icon: 'i-message', run: function () { openChat(); } },
    { label: 'GitHub', hint: 'External', icon: 'i-github', run: function () { window.open('https://github.com/Iamayu17', '_blank', 'noopener'); } },
    { label: 'LinkedIn', hint: 'External', icon: 'i-linkedin', run: function () { window.open('https://www.linkedin.com/in/ayush-kumar-b06b93176/', '_blank', 'noopener'); } }
  ];
  var filteredActions = paletteActions.slice();
  var paletteActive = 0;

  function updatePaletteActive() {
    if (!paletteList) return;
    var items = $$('.palette__item', paletteList);
    items.forEach(function (item, index) {
      item.classList.toggle('is-active', index === paletteActive);
      if (index === paletteActive) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function renderPalette() {
    if (!paletteList || !paletteInput) return;
    var query = paletteInput.value.trim().toLowerCase();
    filteredActions = paletteActions.filter(function (action) {
      return action.label.toLowerCase().indexOf(query) !== -1 || action.hint.toLowerCase().indexOf(query) !== -1;
    });
    paletteList.innerHTML = '';
    if (!filteredActions.length) {
      paletteList.innerHTML = '<li class="palette__empty">No matches — try “resume”, “theme”, or “contact”.</li>';
      return;
    }
    paletteActive = Math.min(paletteActive, filteredActions.length - 1);
    if (paletteActive < 0) paletteActive = 0;
    filteredActions.forEach(function (action, index) {
      var li = doc.createElement('li');
      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'palette__item' + (index === paletteActive ? ' is-active' : '');
      btn.innerHTML = '<svg><use href="#' + action.icon + '"/></svg>' +
        '<span class="palette__label">' + action.label + '</span>' +
        '<small>' + action.hint + '</small>';
      btn.addEventListener('click', function () {
        closePalette(false);
        setTimeout(action.run, 0);
      });
      li.appendChild(btn);
      paletteList.appendChild(li);
    });
  }

  function openPalette() {
    if (!palette || !paletteInput) return;
    paletteLastFocus = doc.activeElement;
    palette.hidden = false;
    body.classList.add('palette-open');
    paletteInput.value = '';
    paletteActive = 0;
    renderPalette();
    paletteInput.focus({ preventScroll: true });
    requestAnimationFrame(function () {
      if (doc.activeElement !== paletteInput) paletteInput.focus({ preventScroll: true });
    });
  }

  function closePalette(returnFocus) {
    if (!palette) return;
    palette.hidden = true;
    body.classList.remove('palette-open');
    if (returnFocus !== false && paletteLastFocus && document.contains(paletteLastFocus)) {
      paletteLastFocus.focus({ preventScroll: true });
    }
  }

  on(paletteOpenBtn, 'click', openPalette);

  if (palette && paletteInput) {
    $$('[data-palette-close]').forEach(function (el) {
      el.addEventListener('click', function () { closePalette(true); });
    });

    paletteInput.addEventListener('input', function () {
      paletteActive = 0;
      renderPalette();
    });

    palette.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette(true);
        return;
      }
      if (!filteredActions.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        paletteActive = (paletteActive + 1) % filteredActions.length;
        updatePaletteActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        paletteActive = (paletteActive - 1 + filteredActions.length) % filteredActions.length;
        updatePaletteActive();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var action = filteredActions[paletteActive];
        if (action) {
          closePalette(false);
          setTimeout(action.run, 0);
        }
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (!palette) return;
      if (palette.hidden) openPalette();
      else closePalette(true);
    }
  });

  /* =========================================================
     CONSOLE SIGNATURE
     ========================================================= */
  if (window.console && console.log) {
    console.log('%cAyush Kumar — Full-Stack Developer', 'color:#ff6b2c;font-weight:700;font-size:14px;');
    console.log('%cLike the site? Let\'s talk: ' + EMAIL, 'color:#a7a29a;font-size:11px;');
  }
})();
