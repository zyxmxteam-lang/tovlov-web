/* TovLov — interactions */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var VPARAMS = 'title=0&byline=0&portrait=0&color=D4112E&dnt=1';
  var EN = document.documentElement.lang === 'en';

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && finePointer && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: { offset: -84 } });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ---------- Video modal (sound on) ---------- */
  var modal = document.createElement('div');
  modal.className = 'vmodal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Video');
  modal.innerHTML = '<button class="x" aria-label="' + (EN ? 'Close video' : 'Cerrar video') + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="frame"></div><div class="cap"></div>';
  document.body.appendChild(modal);
  var frame = modal.querySelector('.frame'), cap = modal.querySelector('.cap'), lastFocus = null;
  function openVideo(id, title) {
    lastFocus = document.activeElement;
    frame.innerHTML = '<iframe src="https://player.vimeo.com/video/' + id + '?autoplay=1&' + VPARAMS + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + (title || 'Video TovLov') + '"></iframe>';
    cap.textContent = title || '';
    modal.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    modal.querySelector('.x').focus();
  }
  function closeVideo() {
    modal.classList.remove('open');
    document.documentElement.style.overflow = '';
    if (lenis) lenis.start();
    setTimeout(function () { frame.innerHTML = ''; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('.x')) closeVideo(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeVideo();
    if (e.key === 'Tab') { e.preventDefault(); modal.querySelector('.x').focus(); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-vimeo]');
    if (!t) return;
    e.preventDefault();
    openVideo(t.getAttribute('data-vimeo'), t.getAttribute('data-title'));
  });

  /* ---------- Muted looping video backgrounds ---------- */
  if (!reduce && !saveData && 'IntersectionObserver' in window) {
    var bgIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var el = en.target, f = el.querySelector('iframe');
        if (en.isIntersecting && !f) {
          f = document.createElement('iframe');
          f.src = 'https://player.vimeo.com/video/' + el.getAttribute('data-bg') + '?background=1&autoplay=1&loop=1&muted=1&dnt=1';
          f.allow = 'autoplay';
          f.setAttribute('aria-hidden', 'true');
          f.tabIndex = -1;
          f.title = '';
          f.onload = function () { setTimeout(function () { f.classList.add('on'); }, 700); };
          el.appendChild(f);
          fit(el);
        } else if (!en.isIntersecting && f) {
          f.remove();
        }
      });
    }, { rootMargin: '150px' });
    // cover: el iframe 16:9 siempre llena su contenedor
    var NO_BG = ['1162594278']; // videos con subtítulos quemados: solo en el reproductor, no de fondo
    var fit = function (el) {
      var f = el.querySelector('iframe'); if (!f) return;
      var w = el.clientWidth, h = el.clientHeight;
      if (w / h > 16 / 9) { f.style.width = w + 'px'; f.style.height = Math.ceil(w * 9 / 16) + 'px'; }
      else { f.style.height = h + 'px'; f.style.width = Math.ceil(h * 16 / 9) + 'px'; }
    };
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); }) : null;
    document.querySelectorAll('[data-bg]').forEach(function (el) {
      if (ro) ro.observe(el);
      if (el.hasAttribute('data-desktop-only') && innerWidth < 900) return;
      if (NO_BG.indexOf(el.getAttribute('data-bg')) > -1) return;
      bgIO.observe(el);
    });
  }

  /* ---------- Word split ---------- */
  document.querySelectorAll('.split').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
    el.querySelectorAll('.w>span').forEach(function (s, i) { s.style.transitionDelay = (i * 55) + 'ms'; });
  });

  /* ---------- Scrub: palabras que se iluminan ---------- */
  var scrubs = [];
  document.querySelectorAll('.scrub').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'sw'; w.textContent = part; frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
    scrubs.push({ el: el, words: el.querySelectorAll('.sw') });
  });

  /* ---------- Reveal ---------- */
  var rvIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv,.rv-img,.split').forEach(function (el) {
    if (el.classList.contains('rv')) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
    }
    rvIO.observe(el);
  });
  // Fallback: lo que ya está en pantalla al cargar se revela sin depender del observer
  function revealVisible() {
    document.querySelectorAll('.rv:not(.in),.rv-img:not(.in),.split:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }
  requestAnimationFrame(revealVisible);
  setTimeout(revealVisible, 400);
  addEventListener('load', revealVisible);

  /* ---------- Scroll: progress, parallax, sticky CTA ---------- */
  var bar = document.querySelector('.progress');
  var mcta = document.querySelector('.mcta');
  var finalSec = document.querySelector('.final');
  var px = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var film = document.querySelector('.film');
  var pimgs = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('.ch-img>img,.still>img,.product .media>img'));
  pimgs.forEach(function (im) { im.classList.add('pimg'); });
  var railBar = document.querySelector('.rail.r .ln i'), railNum = document.querySelector('.rail.r .num');
  var ticking = false, lastY = scrollY;
  var navEl = document.querySelector('.nav');
  var stepsWrap = document.querySelector('[data-steps]');
  var stepsBar = stepsWrap && stepsWrap.querySelector('.steps-track i');
  var stepDots = stepsWrap ? stepsWrap.querySelectorAll('.steps-track b') : [];
  var stepCards = stepsWrap ? stepsWrap.querySelectorAll('.step') : [];
  if (stepsWrap && !reduce && innerWidth > 1000) stepsWrap.classList.add('armed');
  function onScroll() {
    var y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (navEl && !navEl.classList.contains('open')) {
      navEl.classList.toggle('hide', y > 500 && y > lastY + 4);
      if (y < lastY - 4 || y < 500) navEl.classList.remove('hide');
      navEl.classList.toggle('scrolled', y > 40);
    }
    lastY = y;
    scrubs.forEach(function (sc) {
      var r = sc.el.getBoundingClientRect();
      var p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.82 - r.top) / (r.height + innerHeight * 0.25)));
      var n = Math.round(p * sc.words.length);
      sc.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
    if (film && !reduce && innerWidth > 760) {
      var fr = film.getBoundingClientRect();
      var fp = Math.min(1, Math.max(0, (innerHeight - fr.top) / (innerHeight * 0.9) - 0.25) / 0.75);
      film.style.setProperty('--p', fp.toFixed(3));
    }
    pimgs.forEach(function (im) {
      var r = im.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      im.style.transform = 'translate3d(0,' + (c * -8).toFixed(2) + '%,0) scale(1.16)';
    });
    if (railBar) railBar.style.transform = 'scaleY(' + (h > 0 ? y / h : 0) + ')';
    if (railNum) railNum.textContent = String(Math.round((h > 0 ? y / h : 0) * 100)).padStart(3, '0');
    if (stepsWrap) {
      var r = stepsWrap.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      if (stepsBar) stepsBar.style.transform = 'scaleX(' + p + ')';
      stepCards.forEach(function (c, i) {
        var on = p >= (i / stepCards.length) + 0.02;
        c.classList.toggle('lit', on);
        if (stepDots[i]) stepDots[i].classList.toggle('on', on);
      });
    }
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    px.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var c = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (c * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px,0)';
    });
    if (mcta) {
      var fy = finalSec ? finalSec.getBoundingClientRect().top : 1e9;
      mcta.classList.toggle('show', y > 700 && fy > innerHeight * 0.6);
    }
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav'), burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', o);
      burger.setAttribute('aria-label', o ? (EN ? 'Close menu' : 'Cerrar menú') : (EN ? 'Open menu' : 'Abrir menú'));
    });
    nav.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }
  var page = document.body.getAttribute('data-page');
  if (page) document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute('aria-current', 'page'); });

  /* ---------- FAQ: one open at a time ---------- */
  document.querySelectorAll('.faqs').forEach(function (g) {
    var ds = g.querySelectorAll('details');
    ds.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  });

  /* ---------- Horizontal galleries ---------- */
  document.querySelectorAll('[data-hs]').forEach(function (wrap) {
    var track = wrap.querySelector('.hscroll');
    wrap.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () {
        track.scrollBy({ left: (track.clientWidth * 0.8) * parseInt(b.getAttribute('data-dir'), 10), behavior: 'smooth' });
      });
    });
    var down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; track.style.cursor = 'grabbing'; });
    addEventListener('pointerup', function () { if (!down) return; down = false; track.style.scrollSnapType = ''; track.style.cursor = ''; });
    addEventListener('pointermove', function (e) { if (down) track.scrollLeft = sl - (e.clientX - sx); });
  });

  /* ---------- Transiciones entre páginas ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    if (url.pathname === location.pathname && !url.hash) return;
    e.preventDefault();
    if (reduce) { location.href = url.href; return; }
    var c = document.createElement('div'); c.className = 'curtain'; c.innerHTML = '<img src="/assets/logo.png" alt="">';
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('in'); }); });
    try { sessionStorage.setItem('tl_curtain', '1'); } catch (err) {}
    setTimeout(function () { location.href = url.href; }, 600);
  });
  if (document.documentElement.classList.contains('curtain-on')) setTimeout(function () { document.documentElement.classList.remove('curtain-on'); }, 1000);
  addEventListener('pageshow', function (e) { if (e.persisted) document.querySelectorAll('.curtain').forEach(function (c) { c.remove(); }); });

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.btn-red,.btn-white').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Spotlight + tilt ---------- */
  if (finePointer && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card,.feat');
      if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
    document.querySelectorAll('.tile').forEach(function (t) {
      var g = document.createElement('span'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); t.insertBefore(g, t.firstChild);
      t.addEventListener('mousemove', function (e) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        t.style.transform = 'rotateY(' + ((x - 0.5) * 7).toFixed(2) + 'deg) rotateX(' + ((0.5 - y) * 7).toFixed(2) + 'deg) translateZ(0)';
        t.style.setProperty('--gx', (x * 100) + '%'); t.style.setProperty('--gy', (y * 100) + '%');
      });
      t.addEventListener('mouseleave', function () { t.style.transform = ''; });
    });
  }

  /* ---------- Tarjetas de membresía: tilt + holograma ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.mcard').forEach(function (m) {
      var host = m.closest('.plan,.hero-card') || m;
      host.addEventListener('mousemove', function (e) {
        var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        m.style.setProperty('--ry', ((x - 0.5) * 16).toFixed(2) + 'deg');
        m.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
        m.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
        m.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
      });
      host.addEventListener('mouseleave', function () { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); m.style.setProperty('--hx', '50%'); m.style.setProperty('--hy', '50%'); });
    });
  }

  /* ---------- Blog: filtros + índice activo ---------- */
  var chips = document.querySelectorAll('.chips button');
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      chips.forEach(function (o) { o.classList.toggle('on', o === b); });
      document.querySelectorAll('.bgrid .bcard').forEach(function (c) {
        c.classList.toggle('hide', f !== 'all' && c.getAttribute('data-cat') !== f);
        if (!c.classList.contains('hide')) c.classList.add('in');
      });
    });
  });
  document.querySelectorAll('[data-share]').forEach(function (a) {
    var u = encodeURIComponent(location.href), t = encodeURIComponent(document.querySelector('h1') ? document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim() : document.title);
    if (a.href.indexOf('wa.me') > -1) a.href = 'https://wa.me/?text=' + t + '%20' + u;
    else if (a.href.indexOf('facebook') > -1) a.href = 'https://www.facebook.com/sharer/sharer.php?u=' + u;
    else a.href = 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
  });
  var tocLinks = document.querySelectorAll('.ptoc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var heads = Array.prototype.map.call(tocLinks, function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) tocLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach(function (h) { tio.observe(h); });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduce) {
    var cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    (function loop() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function (e) {
      var v = e.target.closest('.player,[data-cursor=play]');
      var l = !v && e.target.closest('a,button,summary');
      cur.classList.toggle('play', !!v);
      cur.classList.toggle('link', !!l);
    });
  }
})();
