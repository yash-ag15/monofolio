/* eslint-disable no-var */
// Animation engine that runs INSIDE the generated portfolio page.
// Serialised with .toString(), so it must stay fully self-contained.

export function animRuntime(cfg) {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  function all(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }
  function splitChars(el, cls) {
    var i = 0;
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent);
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (ch) {
            var s = document.createElement('span');
            s.className = cls;
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            if (ch === ' ') s.style.whiteSpace = 'pre';
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return i;
  }
  var delay = cfg.introDelay || 0;

  // ---- hero entrance
  var hero = document.getElementById('top');
  if (hero && cfg.entrance && cfg.entrance !== 'none' && !reduce) {
    var scope = hero.classList.contains('t-hero') || hero.classList.contains('os') ? hero.parentNode : hero;
    var picks = all('h1, .eyebrow, .headline, .tagline, .statement, .availability, .meta-grid, .hero-cta, .links, .pill, .hero-row, .kn-top, .kn-foot, .sw-top, .sw-meta, .sw-band, .sw-visual, .masthead, .ed-dek, .ed-figure, .term, .term-chips, .bp-head, .dim, .spec, .bp-visual, .three, .lead, .win, .t-visual, .t-stat, aside > *', scope);
    var uniq = picks.filter(function (el, idx) {
      return (
        picks.indexOf(el) === idx &&
        !picks.some(function (p) {
          return p !== el && p.contains(el);
        })
      );
    });
    var heading = scope.querySelector('h1:not(.sr-only)');
    if (cfg.entrance === 'split' || cfg.entrance === 'typewriter') {
      if (heading) {
        var targets = heading.querySelectorAll('[data-scramble]').length ? all('[data-scramble]', heading) : [heading];
        targets.forEach(function (t) {
          t.removeAttribute('data-scramble');
          splitChars(t, cfg.entrance === 'split' ? 'ch' : 'tw');
        });
        heading.classList.add('enter-h');
        heading.style.setProperty('--d', delay + 'ms');
        uniq = uniq.filter(function (el) {
          return el !== heading;
        });
      }
    }
    uniq.forEach(function (el, i) {
      el.classList.add('enter');
      el.style.animationDelay = delay + (cfg.entrance === 'typewriter' ? 700 : 80) + i * 90 + 'ms';
    });
  }

  // ---- section titles
  if (cfg.titleAnim === 'letters' && !reduce) {
    all('.sec-label').forEach(function (l) {
      splitChars(l, 'lc');
    });
  }

  // ---- scroll reveal + "in view" marking
  var watch = all('.sec, .reveal');
  var markIn = function (el) {
    el.classList.add('in');
    all('.project, .entry, .skill-group, .rows li', el).forEach(function (c, i) {
      c.style.transitionDelay = Math.min(i * 80, 720) + 'ms';
    });
    if (cfg.titleAnim === 'scramble' && !reduce) {
      var lab = el.querySelector('.sec-label');
      if (lab && !lab.getAttribute('data-done')) {
        lab.setAttribute('data-done', '1');
        var final = lab.textContent, t0 = performance.now(), g = '#*/<>_=+01ABCDEFXYZ';
        var f = function (now) {
          var k = (now - t0) / 700, out = '';
          for (var i = 0; i < final.length; i++) out += final[i] === ' ' || i / final.length < k ? final[i] : g[Math.floor(Math.random() * g.length)];
          lab.textContent = k < 1 ? out : final;
          if (k < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }
    }
  };
  if (!('IntersectionObserver' in window) || reduce) watch.forEach(markIn);
  else {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            markIn(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    watch.forEach(function (e) {
      io.observe(e);
    });
  }

  // ---- parallax hero
  if (cfg.parallax && !reduce) {
    var layers = all('#top .hero-content, .sp-hero > .wrap, .kn-name, .sw-namerow, .ed-name, .t-hero h1, .lead, .bp-grid');
    window.addEventListener(
      'scroll',
      function () {
        var y = window.scrollY;
        if (y > window.innerHeight * 1.3) return;
        layers.forEach(function (l) {
          l.style.transform = 'translateY(' + (y * 0.28).toFixed(1) + 'px)';
          l.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.95)));
        });
      },
      { passive: true }
    );
  }

  // ---- number counters
  if (cfg.counters && !reduce && 'IntersectionObserver' in window) {
    var nums = all('.t-stat b, .star-count').filter(function (n) {
      return /^\d+$/.test(n.textContent.trim());
    });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = Number(el.textContent), t0 = performance.now();
        var step = function (now) {
          var k = Math.min(1, (now - t0) / 1400);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
    nums.forEach(function (n) {
      cio.observe(n);
    });
  }

  // ---- animated canvas backgrounds
  var host = document.querySelector('.bg-anim');
  var kind = cfg.bgAnim;
  if (host && ['stars', 'matrix', 'dots', 'waves'].indexOf(kind) >= 0) {
    var cv = document.createElement('canvas');
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    var fg = (getComputedStyle(root).getPropertyValue('--fg') || '#888').trim();
    var bg = (getComputedStyle(root).getPropertyValue('--bg') || '#000').trim();
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), mx = -999, my = -999;
    var parts = [];
    var resize = function () {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = [];
      var i;
      if (kind === 'stars') for (i = 0; i < 420; i++) parts.push({ x: (Math.random() - 0.5) * W * 2, y: (Math.random() - 0.5) * H * 2, z: Math.random() * W });
      if (kind === 'matrix') for (i = 0; i < Math.ceil(W / 16); i++) parts.push({ y: Math.random() * -H, v: 2 + Math.random() * 4 });
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener(
      'pointermove',
      function (e) {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );
    var glyphs = '0123456789ABCDEF<>/{}[]=+*#$%&@';
    var t = 0;
    var draw = function () {
      t += 1;
      if (kind === 'stars') {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = fg;
        parts.forEach(function (p) {
          p.z -= 2.2;
          if (p.z <= 1) p.z = W;
          var k = 260 / p.z, x = p.x * k + W / 2, y = p.y * k + H / 2;
          if (x < 0 || x > W || y < 0 || y > H) return;
          ctx.globalAlpha = Math.min(1, (1 - p.z / W) * 1.4);
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.3, (1 - p.z / W) * 2.2), 0, 6.283);
          ctx.fill();
        });
      } else if (kind === 'matrix') {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = fg;
        ctx.font = '14px monospace';
        parts.forEach(function (p, i) {
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, p.y);
          p.y += p.v * 4;
          if (p.y > H + Math.random() * 400) p.y = Math.random() * -200;
        });
      } else if (kind === 'dots') {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = fg;
        for (var x = 14; x < W; x += 28) {
          for (var y = 14; y < H; y += 28) {
            var near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 170);
            ctx.globalAlpha = 0.16 + near * 0.6;
            ctx.beginPath();
            ctx.arc(x, y, 1 + near * 3.2 + Math.sin(t * 0.03 + x * 0.02 + y * 0.015) * 0.3, 0, 6.283);
            ctx.fill();
          }
        }
      } else if (kind === 'waves') {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1;
        for (var l = 0; l < 14; l++) {
          ctx.globalAlpha = 0.07 + l * 0.018;
          ctx.beginPath();
          for (var wx = 0; wx <= W; wx += 12) {
            var wy = H * 0.3 + l * 28 + Math.sin(wx * 0.006 + t * 0.012 + l * 0.5) * (30 + l * 3) + Math.sin(wx * 0.013 - t * 0.02) * 12;
            if (wx === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };
    if (reduce) draw();
    else {
      var loop = function () {
        if (!document.hidden) draw();
        requestAnimationFrame(loop);
      };
      loop();
    }
  }
}
