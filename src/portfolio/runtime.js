/* eslint-disable no-var */
// Code that runs INSIDE the generated portfolio page (not in the studio).
// Each function is self-contained and gets serialised with .toString() into the export,
// so it must not reference anything outside its own body.

// ---------------------------------------------------------------- 3D (Three.js)
export function threeRuntime(THREE, cfg, loadGLTF, loadText) {
  var el = document.querySelector('[data-three]');
  if (!el) return;
  var fgStr = (getComputedStyle(document.documentElement).getPropertyValue('--fg') || '#111111').trim();
  var FG = new THREE.Color(fgStr);
  var lightMode = FG.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var s = cfg.seed >>> 0;
  function rnd() {
    s = (s + 0x6d2b79f5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    el.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  el.appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  var baseDist = 6.4;
  camera.position.set(0, 0, baseDist);
  var group = new THREE.Group();
  scene.add(group);
  var tick = null;
  var kind = cfg.kind;
  function lineMat(op) {
    return new THREE.LineBasicMaterial({ color: FG, transparent: true, opacity: op });
  }
  function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, lightMode ? 0.9 : 0.5));
    var d1 = new THREE.DirectionalLight(0xffffff, 2.4);
    d1.position.set(3, 4, 5);
    scene.add(d1);
    var d2 = new THREE.DirectionalLight(0xffffff, 0.7);
    d2.position.set(-4, -2, -3);
    scene.add(d2);
  }
  function solidMat() {
    var c = FG.clone();
    if (lightMode) c.lerp(new THREE.Color('#ffffff'), 0.18);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.38, metalness: lightMode ? 0.35 : 0.15, flatShading: true });
  }
  function fibSphere(n, r) {
    var a = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var rr = Math.sqrt(1 - y * y);
      var th = i * 2.399963229728653;
      a[i * 3] = Math.cos(th) * rr * r;
      a[i * 3 + 1] = y * r;
      a[i * 3 + 2] = Math.sin(th) * rr * r;
    }
    return a;
  }

  if (kind === 'particles') {
    var N = 2800;
    var base = fibSphere(N, 1);
    var pos = new Float32Array(N * 3);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: FG, size: 0.03, transparent: true, opacity: 0.9, depthWrite: false })));
    var f1 = 2 + rnd() * 3, f2 = 2 + rnd() * 3, amp = 0.12 + rnd() * 0.16;
    tick = function (t) {
      for (var i = 0; i < N; i++) {
        var x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        var k = 2.1 * (1 + amp * Math.sin(x * f1 + t) * Math.cos(y * f2 + t * 0.8) + amp * 0.5 * Math.sin(z * f1 * 1.3 - t * 0.6));
        pos[i * 3] = x * k;
        pos[i * 3 + 1] = y * k;
        pos[i * 3 + 2] = z * k;
      }
      geo.attributes.position.needsUpdate = true;
    };
  } else if (kind === 'knot') {
    var pqs = [[2, 3], [3, 4], [2, 5], [3, 5], [3, 7], [4, 5], [5, 7]];
    var pq = pqs[Math.floor(rnd() * pqs.length)];
    var knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.3, 0.32 + rnd() * 0.14, 280, 20, pq[0], pq[1]),
      new THREE.MeshBasicMaterial({ color: FG, wireframe: true, transparent: true, opacity: 0.4 })
    );
    group.add(knot);
    tick = function (t) {
      knot.rotation.z = t * 0.15;
      knot.rotation.x = t * 0.07;
    };
  } else if (kind === 'shapes') {
    var geos = [
      new THREE.IcosahedronGeometry(0.6),
      new THREE.OctahedronGeometry(0.62),
      new THREE.TetrahedronGeometry(0.7),
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.DodecahedronGeometry(0.55),
      new THREE.ConeGeometry(0.5, 0.9, 5),
      new THREE.CylinderGeometry(0.4, 0.4, 0.8, 6),
    ];
    var items = [];
    var count = 8 + Math.floor(rnd() * 5);
    for (var i = 0; i < count; i++) {
      var ls = new THREE.LineSegments(new THREE.EdgesGeometry(geos[Math.floor(rnd() * geos.length)]), lineMat(0.9));
      ls.position.set((rnd() - 0.5) * 7, (rnd() - 0.5) * 4, (rnd() - 0.5) * 3);
      ls.scale.setScalar(0.5 + rnd() * 0.9);
      ls.userData = { sx: (rnd() - 0.5) * 0.9, sy: (rnd() - 0.5) * 0.9, ph: rnd() * 6.28, y: ls.position.y };
      group.add(ls);
      items.push(ls);
    }
    tick = function (t) {
      items.forEach(function (o) {
        o.rotation.x = t * o.userData.sx;
        o.rotation.y = t * o.userData.sy;
        o.position.y = o.userData.y + Math.sin(t * 0.8 + o.userData.ph) * 0.2;
      });
    };
  } else if (kind === 'blob') {
    addLights();
    var bg = new THREE.IcosahedronGeometry(1.55, 14);
    var bp = bg.attributes.position;
    var b0 = bp.array.slice(0);
    group.add(new THREE.Mesh(bg, solidMat()));
    var a1 = 1.2 + rnd() * 1.8, a2 = 1.2 + rnd() * 1.8, a3 = 1.2 + rnd() * 1.8;
    tick = function (t) {
      for (var i = 0; i < bp.count; i++) {
        var x = b0[i * 3], y = b0[i * 3 + 1], z = b0[i * 3 + 2];
        var l = Math.sqrt(x * x + y * y + z * z) || 1;
        var nx = x / l, ny = y / l, nz = z / l;
        var n = Math.sin(nx * a1 * 2 + t) * Math.sin(ny * a2 * 2 + t * 1.2) * Math.sin(nz * a3 * 2 + t * 0.8);
        var r = 1.55 * (1 + 0.24 * n);
        bp.array[i * 3] = nx * r;
        bp.array[i * 3 + 1] = ny * r;
        bp.array[i * 3 + 2] = nz * r;
      }
      bp.needsUpdate = true;
      bg.computeVertexNormals();
    };
  } else if (kind === 'globe') {
    var world = new THREE.Group();
    group.add(world);
    var gp = new THREE.BufferGeometry();
    gp.setAttribute('position', new THREE.BufferAttribute(fibSphere(3200, 2), 3));
    world.add(new THREE.Points(gp, new THREE.PointsMaterial({ color: FG, size: 0.022, transparent: true, opacity: 0.85 })));
    for (var k = 0; k < 6; k++) {
      var va = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      var vb = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      var mid = va.clone().add(vb).normalize().multiplyScalar(2.9);
      var curve = new THREE.QuadraticBezierCurve3(va.multiplyScalar(2), mid, vb.multiplyScalar(2));
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), lineMat(0.75)));
    }
    var rings = [];
    [2.6, 3.0].forEach(function (r, i) {
      var c = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2);
      var pts = c.getPoints(180).map(function (v) {
        return new THREE.Vector3(v.x, 0, v.y);
      });
      var loop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0.3));
      loop.rotation.x = i ? -0.5 : 0.35 + rnd() * 0.3;
      loop.rotation.z = rnd() * 0.6;
      group.add(loop);
      rings.push(loop);
    });
    tick = function (t) {
      world.rotation.y = t * 0.15;
      rings[0].rotation.y = t * 0.05;
      rings[1].rotation.y = -t * 0.04;
    };
  } else if (kind === 'terrain') {
    var tg = new THREE.PlaneGeometry(20, 12, 80, 48);
    var tp = tg.attributes.position;
    var terrain = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: FG, wireframe: true, transparent: true, opacity: 0.3 }));
    terrain.rotation.x = -Math.PI / 2.3;
    terrain.position.y = -1.4;
    group.add(terrain);
    var fq = 0.4 + rnd() * 0.5;
    tick = function (t) {
      for (var i = 0; i < tp.count; i++) {
        var x = tp.getX(i), y = tp.getY(i);
        tp.setZ(i, Math.sin(x * fq + t * 0.9) * 0.35 + Math.cos(y * fq * 1.4 + t * 0.6) * 0.35 + Math.sin((x + y) * 0.3 + t * 0.4) * 0.25);
      }
      tp.needsUpdate = true;
    };
  } else if (kind === 'rings') {
    var rs = [];
    var rn = 4 + Math.floor(rnd() * 3);
    for (var j = 0; j < rn; j++) {
      var tor = new THREE.Mesh(new THREE.TorusGeometry(0.8 + j * 0.36, 0.012 + rnd() * 0.012, 8, 180), new THREE.MeshBasicMaterial({ color: FG }));
      tor.userData = { ax: 0.2 + rnd() * 0.6, ay: 0.2 + rnd() * 0.6, d: rnd() > 0.5 ? 1 : -1 };
      group.add(tor);
      rs.push(tor);
    }
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), new THREE.MeshBasicMaterial({ color: FG })));
    tick = function (t) {
      rs.forEach(function (r) {
        r.rotation.x = t * r.userData.ax * r.userData.d;
        r.rotation.y = t * r.userData.ay;
      });
    };
  } else if (kind === 'tunnel') {
    // flying through a tunnel of rings
    baseDist = 1.2;
    var tRings = [];
    var TN = 30, TGAP = 0.9;
    for (var ti = 0; ti < TN; ti++) {
      var tr = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.012, 6, 72), new THREE.MeshBasicMaterial({ color: FG, transparent: true }));
      tRings.push(tr);
      group.add(tr);
    }
    var twist = 0.1 + rnd() * 0.15;
    tick = function (t) {
      tRings.forEach(function (r, i) {
        var z = ((t * 2.2 + i * TGAP) % (TN * TGAP)) - (TN * TGAP - 1.5);
        r.position.z = z;
        r.position.x = Math.sin(z * 0.25 + t * 0.5) * 0.4;
        r.position.y = Math.cos(z * 0.2 + t * 0.4) * 0.3;
        r.rotation.z = i * twist + t * 0.2;
        r.material.opacity = Math.max(0, Math.min(1, 1 + z / (TN * TGAP * 0.7)));
      });
    };
  } else if (kind === 'helix') {
    // DNA double helix
    var hx = new THREE.Group();
    group.add(hx);
    var HN = 56;
    var dot = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshBasicMaterial({ color: FG }), HN * 2);
    var dummy = new THREE.Object3D();
    var rungPts = [];
    var turn = 0.28 + rnd() * 0.12;
    for (var hi = 0; hi < HN; hi++) {
      var ha = hi * turn, hy = (hi - HN / 2) * 0.058;
      var p1 = new THREE.Vector3(Math.cos(ha) * 1.05, hy, Math.sin(ha) * 1.05);
      var p2 = new THREE.Vector3(-p1.x, hy, -p1.z);
      dummy.position.copy(p1);
      dummy.updateMatrix();
      dot.setMatrixAt(hi * 2, dummy.matrix);
      dummy.position.copy(p2);
      dummy.updateMatrix();
      dot.setMatrixAt(hi * 2 + 1, dummy.matrix);
      if (hi % 2 === 0) rungPts.push(p1, p2);
    }
    hx.add(dot);
    hx.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rungPts), lineMat(0.35)));
    hx.rotation.z = 0.25;
    tick = function (t) {
      hx.rotation.y = t * 0.6;
    };
  } else if (kind === 'voxels') {
    // a city / equaliser of cubes
    addLights();
    var VS = 13, VG = 0.24;
    var vox = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 1, 0.24), solidMat(), VS * VS);
    var vd = new THREE.Object3D();
    var vHolder = new THREE.Group();
    vHolder.rotation.set(0.6, 0.78, 0);
    vHolder.add(vox);
    group.add(vHolder);
    var vf = 0.4 + rnd() * 0.4;
    tick = function (t) {
      for (var x = 0; x < VS; x++) {
        for (var z = 0; z < VS; z++) {
          var hgt = 0.15 + (Math.sin(x * vf + t * 1.6) + Math.cos(z * vf * 1.2 + t * 1.1) + 2) * 0.45;
          vd.position.set((x - VS / 2) * VG, hgt / 2 - 1, (z - VS / 2) * VG);
          vd.scale.set(1, hgt, 1);
          vd.updateMatrix();
          vox.setMatrixAt(x * VS + z, vd.matrix);
        }
      }
      vox.instanceMatrix.needsUpdate = true;
    };
  } else if (kind === 'ribbon') {
    // flowing silk ribbons made of lines
    var RL = 14, RS = 160;
    var ribbons = [];
    for (var ri = 0; ri < RL; ri++) {
      var rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RS * 3), 3));
      var rline = new THREE.Line(rg, lineMat(0.15 + (ri / RL) * 0.7));
      group.add(rline);
      ribbons.push(rg);
    }
    var rf = 0.6 + rnd() * 0.5;
    tick = function (t) {
      ribbons.forEach(function (g, k) {
        var a = g.attributes.position.array;
        for (var i = 0; i < RS; i++) {
          var x = (i / (RS - 1)) * 6 - 3;
          a[i * 3] = x;
          a[i * 3 + 1] = Math.sin(x * rf + t + k * 0.18) * 0.7 + (k - RL / 2) * 0.05;
          a[i * 3 + 2] = Math.cos(x * rf * 0.7 + t * 0.7 + k * 0.12) * 0.9;
        }
        g.attributes.position.needsUpdate = true;
      });
    };
  } else if (kind === 'plexus') {
    // a network of nodes that link up when close
    var PN = 90, PR = 2.4, MAXL = 700;
    var nodes = [];
    for (var pi = 0; pi < PN; pi++) {
      var v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(PR * Math.cbrt(rnd()));
      nodes.push({ p: v, v: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.006) });
    }
    var npos = new Float32Array(PN * 3);
    var ngeo = new THREE.BufferGeometry();
    ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
    group.add(new THREE.Points(ngeo, new THREE.PointsMaterial({ color: FG, size: 0.07 })));
    var lpos = new Float32Array(MAXL * 6);
    var lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    group.add(new THREE.LineSegments(lgeo, lineMat(0.28)));
    tick = function () {
      nodes.forEach(function (n, i) {
        n.p.add(n.v);
        if (n.p.length() > PR) n.v.negate();
        npos[i * 3] = n.p.x;
        npos[i * 3 + 1] = n.p.y;
        npos[i * 3 + 2] = n.p.z;
      });
      var c = 0;
      for (var i = 0; i < PN && c < MAXL; i++) {
        for (var j = i + 1; j < PN && c < MAXL; j++) {
          if (nodes[i].p.distanceTo(nodes[j].p) < 0.95) {
            lpos.set([nodes[i].p.x, nodes[i].p.y, nodes[i].p.z, nodes[j].p.x, nodes[j].p.y, nodes[j].p.z], c * 6);
            c++;
          }
        }
      }
      lgeo.setDrawRange(0, c * 2);
      lgeo.attributes.position.needsUpdate = true;
      ngeo.attributes.position.needsUpdate = true;
    };
  } else if (kind === 'galaxy') {
    // a spiral galaxy of points
    var GN = 7000, arms = 3 + Math.floor(rnd() * 3);
    var gpos = new Float32Array(GN * 3);
    for (var gi = 0; gi < GN; gi++) {
      var gr = Math.pow(rnd(), 1.4) * 2.4;
      var ga = ((gi % arms) / arms) * Math.PI * 2 + gr * 1.3;
      var sc = (1 - gr / 2.6) * 0.3 + 0.05;
      gpos[gi * 3] = Math.cos(ga) * gr + (rnd() - 0.5) * sc * 2;
      gpos[gi * 3 + 1] = (rnd() - 0.5) * sc * 0.8;
      gpos[gi * 3 + 2] = Math.sin(ga) * gr + (rnd() - 0.5) * sc * 2;
    }
    var gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
    var gHolder = new THREE.Group();
    gHolder.rotation.x = 0.95;
    gHolder.add(new THREE.Points(gg, new THREE.PointsMaterial({ color: FG, size: 0.018, transparent: true, opacity: 0.85, depthWrite: false })));
    group.add(gHolder);
    tick = function (t) {
      gHolder.rotation.y = t * 0.08;
    };
  } else if (kind === 'mobius') {
    // a Möbius strip in wireframe
    var MU = 140, MV = 10, mverts = [], midx = [];
    for (var mu = 0; mu <= MU; mu++) {
      for (var mv = 0; mv <= MV; mv++) {
        var u = (mu / MU) * Math.PI * 2, w = (mv / MV - 0.5) * 1.1;
        mverts.push((1 + (w / 2) * Math.cos(u / 2)) * Math.cos(u) * 1.7, (1 + (w / 2) * Math.cos(u / 2)) * Math.sin(u) * 1.7, (w / 2) * Math.sin(u / 2) * 1.7);
        if (mu < MU && mv < MV) {
          var a0 = mu * (MV + 1) + mv;
          midx.push(a0, a0 + MV + 1, a0 + 1, a0 + 1, a0 + MV + 1, a0 + MV + 2);
        }
      }
    }
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(mverts, 3));
    mg.setIndex(midx);
    var mobius = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: FG, wireframe: true, transparent: true, opacity: 0.45 }));
    group.add(mobius);
    tick = function (t) {
      mobius.rotation.z = t * 0.25;
      mobius.rotation.x = 0.6 + Math.sin(t * 0.3) * 0.2;
    };
  } else if (kind === 'name3d') {
    // your initials / first name as real extruded 3D lettering
    addLights();
    loadText()
      .then(function (mods) {
        new mods[0].FontLoader().load(cfg.fontUrl, function (font) {
          var tg = new mods[1].TextGeometry(cfg.text || 'Hi', { font: font, size: 1, height: 0.38, depth: 0.38, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 4 });
          tg.computeBoundingBox();
          tg.center();
          var wdt = tg.boundingBox.max.x - tg.boundingBox.min.x || 1;
          var c = FG.clone();
          if (lightMode) c.lerp(new THREE.Color('#ffffff'), 0.12);
          var word = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: c, roughness: 0.28, metalness: lightMode ? 0.45 : 0.25 }));
          word.scale.setScalar(Math.min(1.5, 4.8 / wdt));
          group.add(word);
          tick = function (t) {
            word.rotation.y = Math.sin(t * 0.6) * 0.45;
            word.rotation.x = Math.sin(t * 0.4) * 0.12;
          };
        });
      })
      .catch(function () {
        el.classList.add('model-error');
      });
  } else if (kind === 'model') {
    addLights();
    loadGLTF()
      .then(function (mod) {
        new mod.GLTFLoader().load(
          cfg.model,
          function (gltf) {
            var obj = gltf.scene;
            var box = new THREE.Box3().setFromObject(obj);
            var size = box.getSize(new THREE.Vector3()).length() || 1;
            obj.position.sub(box.getCenter(new THREE.Vector3()));
            var wrap = new THREE.Group();
            wrap.add(obj);
            wrap.scale.setScalar(4.2 / size);
            if (cfg.mono) {
              obj.traverse(function (o) {
                if (o.isMesh) o.material = solidMat();
              });
            }
            group.add(wrap);
          },
          undefined,
          function () {
            el.classList.add('model-error');
          }
        );
      })
      .catch(function () {
        el.classList.add('model-error');
      });
  }

  function size() {
    var w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = baseDist * (camera.aspect < 1 ? 1 / Math.max(camera.aspect, 0.55) : 1);
    camera.updateProjectionMatrix();
  }
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(el);
  else window.addEventListener('resize', size);

  var tx = 0, ty = 0, mx = 0, my = 0, visible = true;
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
    }).observe(el);
  }
  // drag to rotate (only where the 3D isn't sitting behind text)
  var dragX = 0, dragY = 0, dragging = false, lastX = 0, lastY = 0;
  if (cfg.drag) {
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-y';
    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dragY += (e.clientX - lastX) * 0.01;
      dragX += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    var stop = function () {
      dragging = false;
      el.style.cursor = 'grab';
    };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  var flat = kind === 'terrain' || kind === 'tunnel';
  var speed = cfg.speed || 1;
  var start = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = reduce ? 0 : ((now - start) / 1000) * speed;
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    if (cfg.drag) {
      group.rotation.y = dragY + (dragging || flat ? 0 : t * 0.1);
      group.rotation.x = dragX;
    } else {
      group.rotation.y = mx * (flat ? 0.25 : 0.9) + (flat ? 0 : t * 0.1);
      group.rotation.x = my * (flat ? 0.1 : 0.5) + (flat ? 0 : window.scrollY * 0.0006);
    }
    if (tick) tick(t);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- effects
export function effectsRuntime(cfg) {
  var fine = matchMedia('(pointer: fine)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  // preloader
  var pre = document.getElementById('preloader');
  var introDelay = 0;
  if (pre) {
    introDelay = 1100;
    var count = pre.querySelector('.pre-count');
    var t0 = performance.now();
    var step = function (now) {
      var k = Math.min(1, (now - t0) / 1000);
      if (count) count.textContent = String(Math.round(k * 100)).padStart(3, '0');
      if (k < 1) requestAnimationFrame(step);
      else {
        pre.classList.add('done');
        setTimeout(function () {
          pre.remove();
        }, 900);
      }
    };
    requestAnimationFrame(step);
  }

  // name decode
  if (cfg.scramble && !reduce) {
    var glyphs = '!<>-_/[]{}=+*^?#01ABCDEFGHJKLMNPQRSTUVWXYZ';
    all('[data-scramble]').forEach(function (el, idx) {
      var final = el.textContent;
      var begin = performance.now() + introDelay + idx * 140;
      var f = function (now) {
        var k = (now - begin) / 900;
        if (k < 0) return requestAnimationFrame(f);
        var out = '';
        for (var i = 0; i < final.length; i++) {
          var ch = final[i];
          out += ch === ' ' || i / final.length < k ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.textContent = k < 1 ? out : final;
        if (k < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
  }

  // cursors that keep the normal pointer visible: a comet trail, or a soft spotlight
  if ((cfg.cursor === 'trail' || cfg.cursor === 'spotlight') && fine && !reduce) {
    if (cfg.cursor === 'spotlight') {
      var spot = document.createElement('div');
      spot.className = 'c-spot';
      document.body.appendChild(spot);
      window.addEventListener('pointermove', function (e) {
        spot.style.setProperty('--sx', e.clientX + 'px');
        spot.style.setProperty('--sy', e.clientY + 'px');
      }, { passive: true });
    } else {
      var trail = [];
      for (var ti = 0; ti < 14; ti++) {
        var td = document.createElement('div');
        td.className = 'c-trail';
        td.style.opacity = String(1 - ti / 14);
        td.style.transform = 'translate(-100px,-100px) scale(' + (1 - ti / 18) + ')';
        document.body.appendChild(td);
        trail.push({ el: td, x: -100, y: -100 });
      }
      var hx = -100, hy = -100;
      window.addEventListener('pointermove', function (e) {
        hx = e.clientX;
        hy = e.clientY;
      }, { passive: true });
      var follow = function () {
        var px = hx, py = hy;
        trail.forEach(function (p, i) {
          p.x += (px - p.x) * 0.45;
          p.y += (py - p.y) * 0.45;
          p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + (1 - i / 18) + ')';
          px = p.x;
          py = p.y;
        });
        requestAnimationFrame(follow);
      };
      follow();
    }
  } else if (cfg.cursor && cfg.cursor !== 'none' && fine) {
    root.classList.add('has-cursor', 'cursor-' + cfg.cursor);
    var x = -200, y = -200, rx = -200, ry = -200;
    var dot = document.createElement('div');
    dot.className = 'c-dot';
    var ring = document.createElement('div');
    ring.className = 'c-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    var hl, vl, label;
    if (cfg.cursor === 'crosshair') {
      hl = document.createElement('div');
      hl.className = 'c-h';
      vl = document.createElement('div');
      vl.className = 'c-v';
      label = document.createElement('div');
      label.className = 'c-label';
      document.body.appendChild(hl);
      document.body.appendChild(vl);
      document.body.appendChild(label);
    }
    window.addEventListener('pointermove', function (e) {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      if (hl) {
        hl.style.transform = 'translateY(' + y + 'px)';
        vl.style.transform = 'translateX(' + x + 'px)';
        label.style.transform = 'translate(' + (x + 12) + 'px,' + (y + 12) + 'px)';
        label.textContent = 'X ' + String(x).padStart(4, '0') + '  Y ' + String(Math.round(y + window.scrollY)).padStart(4, '0');
      }
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hit = e.target.closest && e.target.closest('a,button,[role=button],input,.project,[data-open]');
      root.classList.toggle('cursor-hover', !!hit);
    });
    var loop = function () {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    };
    loop();
  }

  // 3D tilt cards
  if (cfg.tilt && fine && !reduce) {
    all('.projects-cards .project, .projects-grid .project, [data-tilt]').forEach(function (el) {
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 10).toFixed(2) + 'deg) rotateY(' + (px * 12).toFixed(2) + 'deg) translateZ(0)';
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  // magnetic buttons
  if (cfg.magnetic && fine && !reduce) {
    all('.btn, [data-magnetic]').forEach(function (el) {
      el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  // scroll progress
  var bar = document.getElementById('progress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // drifting kinetic type
  var drifts = all('[data-drift]');
  if (drifts.length && !reduce) {
    var drift = function () {
      drifts.forEach(function (el) {
        el.style.transform = 'translateX(' + (Number(el.getAttribute('data-drift')) * window.scrollY * 0.35).toFixed(1) + 'px)';
      });
    };
    window.addEventListener('scroll', drift, { passive: true });
  }

  // hover image reveal on list rows
  var rows = all('.projects-list .project[data-img]');
  if (rows.length && fine) {
    var img = document.createElement('img');
    img.className = 'hover-img';
    img.alt = '';
    document.body.appendChild(img);
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function () {
        img.src = row.getAttribute('data-img');
        img.classList.add('on');
      });
      row.addEventListener('pointerleave', function () {
        img.classList.remove('on');
      });
      row.addEventListener('pointermove', function (e) {
        img.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 90) + 'px)';
      });
    });
  }

  // clocks
  var clocks = all('[data-clock]');
  if (clocks.length) {
    var tickClock = function () {
      var d = new Date();
      var txt = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      clocks.forEach(function (c) {
        c.textContent = txt;
      });
    };
    tickClock();
    setInterval(tickClock, 10000);
  }

  // live GitHub stars
  if (cfg.live) {
    all('[data-repo]').forEach(function (el) {
      fetch('https://api.github.com/repos/' + el.getAttribute('data-repo'))
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          if (j && typeof j.stargazers_count === 'number') el.querySelector('.star-count').textContent = j.stargazers_count;
        })
        .catch(function () {});
    });
  }

  // inside the studio preview: keep in-page anchors working, open external links in a tab
  if (cfg.preview) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      e.preventDefault();
      if (h.charAt(0) === '#') {
        var t = document.getElementById(h.slice(1));
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      } else window.open(a.href, '_blank', 'noopener');
    });
  }
}

// ---------------------------------------------------------------- interactive terminal
export function terminalRuntime(D, cfg) {
  var out = document.getElementById('term-out');
  var input = document.getElementById('term-in');
  var screen = document.getElementById('term-screen');
  if (!out || !input) return;
  var host = String(D.name || 'dev').toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '') || 'dev';
  var promptHtml = '<span class="t-prompt">guest@' + host + ':~$</span> ';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function print(html, cls) {
    var div = document.createElement('div');
    div.className = 'ln' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }
  function a(url, text) {
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(text || url) + '</a>';
  }
  function row(k, v) {
    print('<span class="t-key">' + k + '</span><span>' + v + '</span>', 'row');
  }
  var C = {
    help: function () {
      print('<span class="t-dim">Available commands</span>');
      [
        ['about', 'who I am'],
        ['projects', 'things I have built'],
        ['open &lt;n&gt;', 'open project n'],
        ['skills', 'my stack'],
        ['experience', 'where I have worked'],
        ['education', 'where I studied'],
        ['contact', 'how to reach me'],
        ['socials', 'find me online'],
        ['theme', 'invert colours'],
        ['clear', 'clear the screen'],
      ].forEach(function (r) {
        row(r[0], '<span class="t-dim">' + r[1] + '</span>');
      });
    },
    whoami: function () {
      print('<b>' + esc(D.name) + '</b>');
      if (D.headline) print(esc(D.headline), 't-dim');
    },
    about: function () {
      String(D.about || D.tagline || 'Nothing here yet.')
        .split(/\n+/)
        .forEach(function (p) {
          print(esc(p));
        });
    },
    projects: function () {
      if (!D.projects.length) return print('No projects yet.', 't-dim');
      D.projects.forEach(function (p, i) {
        print('<span class="t-key">[' + (i + 1) + ']</span><span><b>' + esc(p.name) + '</b> <span class="t-dim">' + esc(p.tech || '') + '</span><br>' + esc(p.description || '') + '</span>', 'row');
      });
      print('<span class="t-dim">Type <b>open 1</b> to open a project.</span>');
    },
    open: function (args) {
      var p = D.projects[Number(args[0]) - 1];
      if (!p) return print('open: no such project — try <b>projects</b>', 't-err');
      if (!p.url) return print(esc(p.name) + ' has no public link yet.', 't-dim');
      print('Opening ' + a(p.url, p.name) + ' …');
      window.open(p.url, '_blank', 'noopener');
    },
    skills: function () {
      D.skills.forEach(function (s) {
        row(esc(s.group || 'skills'), esc(s.items.join(' · ')));
      });
    },
    experience: function () {
      if (!D.experience.length) return print('No experience listed.', 't-dim');
      D.experience.forEach(function (e) {
        row(esc(e.when), '<b>' + esc(e.role) + '</b> <span class="t-dim">@ ' + esc(e.company) + '</span>');
      });
    },
    education: function () {
      D.education.forEach(function (e) {
        row(esc(e.when), '<b>' + esc(e.degree) + '</b> <span class="t-dim">' + esc(e.school) + '</span>');
      });
    },
    contact: function () {
      if (D.email) row('email', a('mailto:' + D.email, D.email));
      if (D.location) row('location', esc(D.location));
      if (D.availability) row('status', esc(D.availability));
    },
    socials: function () {
      D.links.forEach(function (l) {
        row(esc(l.label), a(l.url));
      });
    },
    ls: function () {
      print('about.md  projects/  skills.json  experience.log  contact.txt');
    },
    cat: function (args) {
      var f = String(args[0] || '').replace(/\..*$/, '').replace(/\/$/, '');
      if (C[f] && f !== 'cat') C[f]([]);
      else print('cat: ' + esc(args[0] || '') + ': No such file', 't-err');
    },
    theme: function () {
      document.documentElement.classList.toggle('flip');
      print('Colours inverted.', 't-dim');
    },
    date: function () {
      print(esc(new Date().toString()));
    },
    echo: function (args) {
      print(esc(args.join(' ')));
    },
    sudo: function () {
      print('Permission denied. Nice try though.', 't-err');
    },
    exit: function () {
      print('There is no exit. Scroll down for the full portfolio ↓', 't-dim');
    },
    clear: function () {
      out.innerHTML = '';
    },
  };
  C.cd = C.cat;
  C.links = C.socials;
  C.email = C.contact;
  var hist = [], hi = 0;
  function run(line) {
    var parts = line.trim().split(/\s+/);
    var cmd = (parts.shift() || '').toLowerCase();
    print(promptHtml + esc(line));
    if (!cmd) return;
    if (C[cmd]) C[cmd](parts);
    else print('command not found: ' + esc(cmd) + ' — type <b>help</b>', 't-err');
  }
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var v = input.value;
      input.value = '';
      if (v.trim()) hist.push(v);
      hi = hist.length;
      run(v);
    } else if (e.key === 'ArrowUp') {
      if (hi > 0) input.value = hist[--hi];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hi = Math.min(hist.length, hi + 1);
      input.value = hist[hi] || '';
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var m = Object.keys(C).filter(function (k) {
        return k.indexOf(input.value.toLowerCase()) === 0;
      });
      if (m.length === 1) input.value = m[0] + ' ';
      else if (m.length > 1) print(m.join('  '), 't-dim');
    }
  });
  screen.addEventListener('click', function () {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-cmd]'), function (b) {
    b.addEventListener('click', function () {
      run(b.getAttribute('data-cmd'));
      input.focus({ preventScroll: true });
    });
  });
  // boot sequence: type "whoami", then show the hint
  var bootCmd = 'whoami';
  var i = 0;
  var typing = document.createElement('div');
  typing.className = 'ln';
  out.appendChild(typing);
  var typeNext = function () {
    typing.innerHTML = promptHtml + bootCmd.slice(0, i) + '<span class="t-caret">▋</span>';
    if (i++ < bootCmd.length) return setTimeout(typeNext, 70);
    typing.remove();
    run(bootCmd);
    if (D.tagline) print('<span class="t-dim">› ' + esc(D.tagline) + '</span>');
    print('<span class="t-dim">Type <b>help</b> or tap a command below.</span>');
    if (!cfg.preview && matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
  };
  setTimeout(typeNext, cfg.delay || 300);
}

// ---------------------------------------------------------------- retro desktop windows
export function desktopRuntime() {
  var desk = document.querySelector('.desktop');
  if (!desk) return;
  var z = 10;
  var small = function () {
    return matchMedia('(max-width: 720px)').matches;
  };
  function front(w) {
    w.style.zIndex = ++z;
    Array.prototype.forEach.call(document.querySelectorAll('.win'), function (x) {
      x.classList.toggle('active', x === w);
    });
  }
  function open(id) {
    var w = document.getElementById(id);
    if (!w) return;
    w.hidden = false;
    front(w);
    if (small()) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (x) {
        x.classList.toggle('sel', x === b);
      });
      open(b.getAttribute('data-open'));
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.win'), function (w) {
    w.addEventListener('pointerdown', function () {
      front(w);
    });
    var close = w.querySelector('.win-close');
    if (close) {
      close.addEventListener('click', function (e) {
        e.stopPropagation();
        w.hidden = true;
      });
    }
    var bar = w.querySelector('.win-bar');
    bar.addEventListener('pointerdown', function (e) {
      if (small() || e.target.closest('button')) return;
      var r = w.getBoundingClientRect(), dr = desk.getBoundingClientRect();
      var ox = e.clientX - r.left, oy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      var mv = function (ev) {
        w.style.left = Math.max(0, Math.min(dr.width - 120, ev.clientX - dr.left - ox)) + 'px';
        w.style.top = Math.max(0, ev.clientY - dr.top - oy) + 'px';
      };
      var up = function () {
        bar.removeEventListener('pointermove', mv);
        bar.removeEventListener('pointerup', up);
      };
      bar.addEventListener('pointermove', mv);
      bar.addEventListener('pointerup', up);
    });
  });
}
