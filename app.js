/* Bulle — application mobile (PWA). Parle au serveur local : API REST + flux temps réel (SSE). */
(function () {
'use strict';
var DAY = 864e5;

/* ================================================================ outils */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function h(tag, props) {
  var el = document.createElement(tag); props = props || {};
  Object.keys(props).forEach(function (k) {
    var v = props[k]; if (v == null || v === false) return;
    if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k === 'style') el.style.cssText = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  });
  for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, c) { if (c == null || c === false) return; if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; } el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
var SV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
var ICONS = {
  home: '<path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5.2v-6h-5.6v6H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.4-4.5a8.4 8.4 0 1 1 15.6-4.4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-4 4.6-6 8-6s6.4 2 8 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.6"/>',
  heart: '<path d="M12 20.3S3.6 15.4 2.9 9.6C2.4 6.3 4.6 3.8 7.4 3.8c2 0 3.5 1.1 4.6 2.8 1.1-1.7 2.6-2.8 4.6-2.8 2.8 0 5 2.5 4.5 5.8-.7 5.8-9.1 10.7-9.1 10.7z"/>',
  comment: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.4-4.5a8.4 8.4 0 1 1 15.6-4.4z"/>',
  send: '<path d="M21 3 10.2 13.8M21 3l-6.8 18-4-7.2L3 9.8z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14" stroke-width="2.6"/>',
  play: '<path d="M7.5 5.2v13.6a.6.6 0 0 0 .9.5l10.6-6.8a.6.6 0 0 0 0-1L8.4 4.7a.6.6 0 0 0-.9.5z" fill="currentColor"/>',
  more: '<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.4 7.4 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4z"/>',
  map: '<path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  ghost: '<path d="M5 20V10a7 7 0 0 1 14 0v10l-2.4-1.6L14.3 20 12 18.4 9.7 20l-2.3-1.6z"/><circle cx="9.5" cy="10.5" r="1" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>',
  spark: '<path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  reply: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  wand: '<path d="m4 20 11-11M14 4v3M19 9h3M17.5 5.5l2-2M12 2v1"/><path d="m13 8 3 3"/>',
  mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'
};
function icon(n) { var s = document.createElement('span'); s.className = 'ico'; s.innerHTML = SV + (ICONS[n] || '') + '</svg>'; return s; }
$$('[data-ico]').forEach(function (el) { el.innerHTML = SV + (ICONS[el.getAttribute('data-ico')] || '') + '</svg>'; });

var LS = {
  get: function (k, d) { try { var v = localStorage.getItem('bulle.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('bulle.' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
};
function ago(t) { var s = (Date.now() - t) / 1000; if (s < 60) return 'à l’instant'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h'; if (s < 7 * 86400) return Math.floor(s / 86400) + ' j'; return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
function hhmm(t) { return new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
function dayLabel(t) { var d = new Date(t), n = new Date(); var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); if (a === b) return 'Aujourd’hui'; if (b - a === DAY) return 'Hier'; return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
var toastT = null;
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600); }
var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/* ================================================================ réseau */
// Version test : pas de serveur, local-api.js enregistre tout sur l'appareil.
function call(method, url, body) { return window.BulleLocal.call(method, url, body); }
function attempt(p, okMsg) {
  return p.then(function (r) { if (okMsg) toast(okMsg); return r || true; }, function (e) {
    if (e.status === 401) { showAuth(); return false; }
    toast(e.message || 'Ça n’a pas marché. Réessaie.'); return false;
  });
}

/* ================================================================ état */
var S = { me: null, users: {}, posts: [], stories: [], chats: [], online: new Set(), typing: {}, tab: 'feed', openChat: null, msgs: [], viewUid: null, sheet: null, editing: false, confirmDel: null, forceBottom: false, offline: false, seen: new Set(LS.get('seen', [])), notes: [], activity: [], quote: null };
var installEvt = null, swReg = null, es = null;

function who(uid) {
  var u = S.users[uid] || {};
  return { name: u.name || u.handle || 'Quelqu’un', handle: u.handle || '', bio: u.bio || '', avatar: u.avatar || '' };
}
// couleurs d'avatar tirées de la couleur vive du thème (visibles de jour comme de nuit)
var PALETTE = [100, 62, 82, 50, 72];
function colorOf(uid) { var n = 0; for (var i = 0; i < (uid || '').length; i++) n = (n * 31 + uid.charCodeAt(i)) >>> 0; return 'color-mix(in srgb,var(--hot) ' + PALETTE[n % PALETTE.length] + '%,#000)'; }
function avatar(uid, size, withOnline) {
  var w = who(uid), el = h('span', { class: 'av', style: '--s:' + (size || 36) + 'px;--avc:' + colorOf(uid) });
  if (w.avatar) el.append(h('img', { src: w.avatar, alt: '', loading: 'lazy' }));
  else el.textContent = (w.name || '?').charAt(0).toUpperCase();
  if (withOnline) return h('span', { class: 'avw' + (S.online.has(uid) && uid !== S.me.id ? ' on' : '') }, el);
  return el;
}
function groupAvatar(size) { return h('span', { class: 'av group', style: '--s:' + (size || 36) + 'px' }, h('span', { class: 'logo' })); }
function upsert(list, item, sortFn) { var i = list.findIndex(function (x) { return x.id === item.id; }); if (i >= 0) list[i] = item; else list.push(item); if (sortFn) list.sort(sortFn); }
var byNewest = function (a, b) { return b.at - a.at; }, byOldest = function (a, b) { return a.at - b.at; };

function applyState(st) {
  S.me = st.me; S.users = {};
  st.users.forEach(function (u) { S.users[u.id] = u; });
  S.posts = st.posts.slice().sort(byNewest);
  S.stories = st.stories.slice().sort(byOldest);
  S.chats = st.chats;
  S.online = new Set(st.online || []);
  S.notes = st.notes || [];
  S.activity = (st.activity || []).slice().sort(byNewest);
}

/* ================================================================ apparence, réglages, offres */
var THEMES = [
  { id: 'bulle', name: 'Bulle', sw: ['#F6B6C8', '#140D10'] },
  { id: 'lagon', name: 'Lagon', sw: ['#B9DDF7', '#0B1621'] },
  { id: 'menthe', name: 'Menthe', sw: ['#BDEBD3', '#0B1A12'] },
  { id: 'lilas', name: 'Lilas', sw: ['#DAC8F6', '#150D20'], plus: true },
  { id: 'soleil', name: 'Soleil', sw: ['#FFD8A1', '#1E1206'], plus: true },
  { id: 'encre', name: 'Encre', sw: ['#ECECEC', '#111111'], plus: true }
];
var PREFS = Object.assign({ mode: 'auto', theme: 'bulle', notif: true, preview: true, heads: true }, LS.get('prefs', {}));
function savePrefs() { LS.set('prefs', PREFS); }
var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
function hasPlus() { return !!(S.me && (S.me.plan === 'plus' || S.me.plan === 'pro')); }
function isPro() { return !!(S.me && S.me.plan === 'pro'); }
function applyLook() {
  var t = THEMES.find(function (x) { return x.id === PREFS.theme; }) || THEMES[0];
  if (t.plus && S.me && !hasPlus()) t = THEMES[0]; // thème Bulle+ sans abonnement : retour au thème de base
  var root = document.documentElement;
  root.setAttribute('data-theme', t.id);
  root.setAttribute('data-scheme', PREFS.mode === 'auto' ? (darkMQ.matches ? 'dark' : 'light') : PREFS.mode);
  var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  setTiles();
}
if (darkMQ.addEventListener) darkMQ.addEventListener('change', applyLook); else if (darkMQ.addListener) darkMQ.addListener(applyLook);
function privacy() { return Object.assign({ showOnline: true, readReceipts: true, ghost: false, dms: 'all' }, (S.me && S.me.privacy) || {}); }
function updateMe(body, okMsg) {
  return attempt(call('PUT', '/api/profile', body), okMsg).then(function (r) { if (r && r.me) { S.me = r.me; S.users[r.me.id] = r.me; } return r; });
}
function setPrivacy(patch) {
  return updateMe({ privacy: Object.assign(privacy(), patch) }).then(function (r) { if (r) { renderSheetDyn(); if (patch.ghost != null) refreshPlaces(); } return r; });
}
function tierChip(plan, big) { if (plan !== 'plus' && plan !== 'pro') return null; return h('span', { class: 'tier' + (big ? ' big' : ''), title: plan === 'pro' ? 'Bulle Pro' : 'Bulle+', text: plan === 'pro' ? 'PRO' : '+' }); }

/* ================================================================ images */
function loadBitmap(file) {
  if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
  return viaImg(file);
}
function viaImg(file) { return new Promise(function (res, rej) { var u = URL.createObjectURL(file); var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = u; }); }
function shrink(file, max, q) {
  return loadBitmap(file).then(function (bmp) {
    // version test : photos plus légères, elles sont gardées dans la mémoire de l'appareil
    var steps = [[max || 1080, q || 0.8], [900, 0.74], [720, 0.68]];
    for (var i = 0; i < steps.length; i++) {
      var k = Math.min(1, steps[i][0] / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      var u = c.toDataURL('image/jpeg', steps[i][1]);
      if (u.length < 5.5e6) return u;
    }
    throw new Error('Image trop lourde.');
  });
}
// Recadrage de la photo de profil : glisser pour déplacer, pincer / molette / curseur pour zoomer.
// Renvoie une image carrée de 512 px (data URL), ou null si on annule.
function cropPhoto(file) {
  return loadBitmap(file).then(function (bmp) {
    // copie réduite pour un affichage fluide pendant les gestes
    var k0 = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    var src = document.createElement('canvas'); src.width = Math.round(bmp.width * k0); src.height = Math.round(bmp.height * k0);
    src.getContext('2d').drawImage(bmp, 0, 0, src.width, src.height);
    return new Promise(function (resolve) {
      var W = 280, dpr = Math.min(2, window.devicePixelRatio || 1), z = 1, base = Math.max(W / src.width, W / src.height);
      var cv = h('canvas', { width: String(Math.round(W * dpr)), height: String(Math.round(W * dpr)) });
      var stage = h('div', { class: 'crop-stage', 'aria-label': 'Zone de recadrage' }, cv);
      var range = h('input', { type: 'range', min: '1', max: '4', step: '0.01', value: '1', 'aria-label': 'Zoom' });
      var ox, oy, raf = 0, done = false;
      function sc() { return base * z; }
      function clamp() { var s = sc(); ox = Math.min(0, Math.max(W - src.width * s, ox)); oy = Math.min(0, Math.max(W - src.height * s, oy)); }
      function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; clamp(); var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, W); c.drawImage(src, ox, oy, src.width * sc(), src.height * sc()); }); }
      function zoomTo(nz, cx, cy) {
        nz = Math.max(1, Math.min(4, nz)); if (cx == null) { cx = W / 2; cy = W / 2; }
        var s0 = sc(), ix = (cx - ox) / s0, iy = (cy - oy) / s0; z = nz; var s1 = sc();
        ox = cx - ix * s1; oy = cy - iy * s1; range.value = String(z); draw();
      }
      ox = (W - src.width * sc()) / 2; oy = (W - src.height * sc()) / 2;
      var pts = new Map(), pinch = null;
      function spread() { var a = Array.from(pts.values()); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
      function mid() { var a = Array.from(pts.values()), r = stage.getBoundingClientRect(); return { x: (a[0].x + a[1].x) / 2 - r.left, y: (a[0].y + a[1].y) / 2 - r.top }; }
      stage.addEventListener('pointerdown', function (e) { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) pinch = { d: spread(), z: z }; });
      stage.addEventListener('pointermove', function (e) {
        var prev = pts.get(e.pointerId); if (!prev) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { ox += e.clientX - prev.x; oy += e.clientY - prev.y; draw(); }
        else if (pts.size === 2 && pinch) { var m = mid(); zoomTo(pinch.z * spread() / pinch.d, m.x, m.y); }
      });
      function up(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; }
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
      stage.addEventListener('wheel', function (e) { e.preventDefault(); var r = stage.getBoundingClientRect(); zoomTo(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
      range.addEventListener('input', function () { zoomTo(+range.value); });
      function finish(v) { if (done) return; done = true; closeSheet(); resolve(v); }
      openSheet('Recadrer la photo', h('div', { class: 'crop' }, stage,
        h('label', { class: 'crop-zoom' }, 'Zoom', range),
        h('p', { class: 'hint', text: 'Glisse la photo pour la placer dans le rond. Pince ou utilise le curseur pour zoomer.' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: function () { finish(null); } }, 'Annuler'),
          h('button', { class: 'btn primary', type: 'button', onclick: function () {
            clamp(); var out = document.createElement('canvas'); out.width = 512; out.height = 512; var k = 512 / W;
            out.getContext('2d').drawImage(src, ox * k, oy * k, src.width * sc() * k, src.height * sc() * k);
            finish(out.toDataURL('image/jpeg', 0.86));
          } }, 'Valider'))), { type: 'crop' });
      draw();
    });
  });
}

/* ================================================================ discussions */
function otherOf(c) { var m = (c && c.members) || []; for (var i = 0; i < m.length; i++) if (m[i] !== S.me.id) return m[i]; return S.me.id; }
function dmFor(uid) {
  var ids = [S.me.id, uid].sort(); var id = 'dm-' + ids[0] + '-' + ids[1];
  return S.chats.find(function (c) { return c.id === id; }) || { id: id, kind: 'dm', members: ids, lastAt: 0 };
}
function visibleChats() {
  var list = S.chats.slice();
  if (!list.some(function (c) { return c.id === 'general'; })) list.push({ id: 'general', kind: 'group', members: [], lastAt: 0 });
  return list.sort(function (a, b) { return (b.lastAt || 0) - (a.lastAt || 0); });
}
function chatTitle(c) { return c.kind === 'group' ? 'Le salon' : who(otherOf(c)).name; }
function readMap() { return LS.get('read.' + S.me.id, {}); }
function markRead(id) { var r = readMap(); r[id] = Date.now(); LS.set('read.' + S.me.id, r); }
function isUnread(c) { return !!(c.lastAt && c.lastBy && c.lastBy !== S.me.id && c.lastAt > (readMap()[c.id] || 0)); }
function typersIn(cid) { var t = S.typing[cid] || {}, now = Date.now(); return Object.keys(t).filter(function (u) { return t[u] > now && u !== S.me.id; }); }

/* ================================================================ rendu */
function renderAll() { if (!S.me) return; renderBanner(); renderNav(); renderActDot(); renderFeed(); renderChatList(); if (S.openChat) { renderThreadHead(); renderMsgs(); renderTyping(); } renderProfile(); renderSheetDyn(); }
function renderLight() { if (!S.me) return; renderChatList(); if (S.openChat) { renderThreadHead(); renderTyping(); } if (S.tab === 'profile' && S.viewUid) renderProfile(); }

function renderBanner() {
  var b = $('#banner'); b.replaceChildren();
  if (S.offline) b.append(h('b', { text: 'Hors ligne' }), h('span', { text: 'Le serveur Bulle ne répond pas. Reconnexion automatique…' }));
  b.hidden = !S.offline;
}
function renderNav() {
  $$('[data-tab]').forEach(function (el) { el.setAttribute('aria-current', String(el.getAttribute('data-tab') === S.tab)); });
  var n = visibleChats().filter(isUnread).length;
  $$('[data-badge]').forEach(function (el) { el.textContent = n > 9 ? '9+' : String(n); el.hidden = !n; });
  if (navigator.setAppBadge) { (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(function () {}); }
}

function storyGroups() {
  var cut = Date.now() - DAY, m = new Map();
  S.stories.filter(function (s) { return s.at > cut; }).forEach(function (s) { if (!m.has(s.by)) m.set(s.by, []); m.get(s.by).push(s); });
  var gs = []; m.forEach(function (items, uid) {
    var un = items.filter(function (s) { return !S.seen.has(s.id); });
    gs.push({ uid: uid, items: items, unseen: un.length > 0, close: un.some(function (s) { return s.close; }), last: items[items.length - 1].at });
  });
  var me = S.me.id;
  gs.sort(function (a, b) { if (a.uid === me) return -1; if (b.uid === me) return 1; if (a.unseen !== b.unseen) return a.unseen ? -1 : 1; return b.last - a.last; });
  return gs;
}
/* contour de story : coloré si pas vue, vert si « amis proches », gris si déjà vue */
function groupRing(g) { return !g ? 'none' : g.close ? 'close' : g.unseen ? 'live' : 'seen'; }
function ringOf(uid) { return groupRing(storyGroups().find(function (g) { return g.uid === uid; })); }
function ringAv(uid, size, withOnline) {
  var st = ringOf(uid), av = avatar(uid, size, withOnline);
  if (st === 'none') return av;
  return h('span', { class: 'ring has ' + st + (size < 50 ? ' sm' : ''), style: '--rs:' + (size + (size < 50 ? 10 : 14)) + 'px', 'data-story': uid, title: st === 'close' ? 'Snap pour ses amis proches' : 'Voir son snap' }, av);
}
function openStoriesOf(uid) { var gs = storyGroups(), i = gs.findIndex(function (g) { return g.uid === uid; }); if (i >= 0) openStories(gs, i); return i >= 0; }
// un clic sur un avatar entouré ouvre le snap au lieu de l'action normale
function storyTap(e) { var r = e.target.closest && e.target.closest('[data-story]'); if (!r) return false; e.preventDefault(); e.stopPropagation(); return openStoriesOf(r.getAttribute('data-story')); }
function renderFeed() {
  var st = $('#stories'), box = $('#posts'); st.replaceChildren(); box.replaceChildren();
  var gs = storyGroups(), me = S.me.id, mine = gs.find(function (g) { return g.uid === me; });
  var ring = h('span', { class: 'ring ' + (mine ? groupRing(mine) : 'none') }, avatar(me, 60), h('span', { class: 'plus', 'aria-hidden': 'true' }, icon('plus')));
  st.append(h('button', { class: 'st', type: 'button', 'aria-label': mine ? 'Voir ton snap' : 'Ajouter un snap', onclick: function () { if (mine) openStories(gs, 0); else openComposer('snap'); } }, ring, h('small', { text: mine ? 'Ton snap' : 'Ajouter' })));
  gs.forEach(function (g, i) {
    if (g.uid === me) return;
    st.append(h('button', { class: 'st', type: 'button', 'aria-label': 'Snap de ' + who(g.uid).name + (g.close ? ' (amis proches)' : ''), onclick: function () { openStories(gs, i); } }, h('span', { class: 'ring ' + groupRing(g) }, avatar(g.uid, 60)), h('small', { text: who(g.uid).name })));
  });
  if (!S.posts.length) {
    box.append(h('div', { class: 'empty' }, h('span', { class: 'logo xl' }), h('h2', { text: 'Le fil est tout neuf' }), h('p', { text: 'Publie la première photo, ou envoie un snap qui disparaît au bout de 24 h.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: function () { openComposer('post'); } }, 'Publier une photo'), h('button', { class: 'btn', type: 'button', onclick: function () { openComposer('snap'); } }, 'Envoyer un snap'))));
    return;
  }
  S.posts.forEach(function (p) { box.append(postCard(p)); });
}
function personBtn(uid) {
  var w = who(uid);
  return h('button', { class: 'person', type: 'button', onclick: function (e) { if (storyTap(e)) return; showProfile(uid); } }, ringAv(uid, 36, true), h('span', { class: 'nm' }, h('b', { text: w.name }), w.handle && w.handle !== w.name ? h('small', { text: '@' + w.handle }) : null));
}
var IMG = new Map();
function cachedImg(key, src, alt) {
  var im = IMG.get(key);
  if (!im || im.getAttribute('src') !== src) { im = h('img', { src: src, alt: alt || '', decoding: 'async', draggable: 'false' }); IMG.set(key, im); }
  return im;
}
function postCard(p) {
  var me = S.me.id, liked = p.likes.indexOf(me) >= 0, n = p.likes.length, cs = p.comments, canDel = p.by === me || S.me.admin;
  var media = h('div', { class: 'media', role: 'img', 'aria-label': 'Photo de ' + who(p.by).name }, cachedImg('p' + p.id, p.img, ''));
  var lastTap = 0;
  function dbl(ev) { burst(ev.clientX, ev.clientY); if (p.likes.indexOf(me) < 0) like(p, true); }
  media.addEventListener('dblclick', dbl);
  media.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'touch') return; var t = Date.now(); if (t - lastTap < 300) { ev.preventDefault(); dbl(ev); lastTap = 0; } else lastTap = t; });
  return h('article', { class: 'post' },
    h('header', { class: 'post-h' }, personBtn(p.by), h('span', { class: 'when', text: ago(p.at) }),
      canDel ? h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Supprimer la publication', onclick: function () { S.confirmDel = S.confirmDel === p.id ? null : p.id; renderFeed(); renderSheetDyn(); } }, icon('trash')) : null),
    S.confirmDel === p.id ? h('div', { class: 'confirm' }, h('span', { text: 'Supprimer cette publication pour tout le monde ?' }),
      h('button', { class: 'btn small', type: 'button', onclick: function () { S.confirmDel = null; renderFeed(); renderSheetDyn(); } }, 'Annuler'),
      h('button', { class: 'btn small primary', type: 'button', onclick: function () { S.confirmDel = null; attempt(call('DELETE', '/api/posts/' + p.id), 'Publication supprimée').then(function (ok) { if (ok) { removePost(p.id); if (S.sheet && S.sheet.id === p.id) closeSheet(); } }); } }, 'Supprimer')) : null,
    media,
    h('div', { class: 'acts' },
      h('button', { class: 'iconbtn like' + (liked ? ' on' : ''), type: 'button', 'aria-pressed': String(liked), 'aria-label': liked ? 'Retirer le j’aime' : 'J’aime', onclick: function (ev) { if (!liked) { var r = ev.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); } like(p, !liked); } }, icon('heart')),
      h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Commentaires', onclick: function () { openComments(p.id); } }, icon('comment')),
      p.by !== me ? h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Écrire à ' + who(p.by).name, onclick: function () { openChat(dmFor(p.by)); } }, icon('send')) : null),
    n ? h('p', { class: 'likes', text: n === 1 ? '1 j’aime' : n + ' j’aime' }) : null,
    p.caption ? h('p', { class: 'cap' }, h('b', { text: who(p.by).name, onclick: function () { showProfile(p.by); } }), p.caption) : null,
    h('button', { class: 'linkish', type: 'button', onclick: function () { openComments(p.id); } }, cs.length ? (cs.length === 1 ? 'Voir le commentaire' : 'Voir les ' + cs.length + ' commentaires') : 'Ajouter un commentaire'));
}
function like(p, on) {
  // affichage immédiat, le serveur confirme via le flux temps réel
  var me = S.me.id, before = p.likes.slice();
  p.likes = on ? before.concat(before.indexOf(me) < 0 ? [me] : []) : before.filter(function (x) { return x !== me; });
  renderFeed(); renderSheetDyn();
  attempt(call('POST', '/api/posts/' + p.id + '/like', { on: on })).then(function (r) { if (!r) { p.likes = before; renderFeed(); renderSheetDyn(); } });
}
function removePost(id) { S.posts = S.posts.filter(function (x) { return x.id !== id; }); renderFeed(); renderProfile(); renderSheetDyn(); }
function emojiBurst(x, y, e) {
  var r = $('#phone').getBoundingClientRect();
  if (!x && !y) { x = r.left + r.width / 2; y = r.top + r.height / 2; }
  var b = h('div', { class: 'burst emj', style: 'left:' + (x - r.left) + 'px;top:' + (y - r.top) + 'px', text: e });
  $('#phone').append(b); setTimeout(function () { b.remove(); }, 1200);
  if (navigator.vibrate) navigator.vibrate(12);
}
function burst(x, y) {
  var r = $('#phone').getBoundingClientRect();
  var b = h('div', { class: 'burst', style: 'left:' + (x - r.left) + 'px;top:' + (y - r.top) + 'px' }, icon('heart'));
  $('#phone').append(b); b.addEventListener('animationend', function () { b.remove(); }); setTimeout(function () { b.remove(); }, 1500);
  if (navigator.vibrate) navigator.vibrate(12);
}

function renderChatList() {
  var box = $('#chatlist'); box.replaceChildren();
  box.append(notesStrip());
  // invitation à activer les notifications (une seule fois, tant que le navigateur n'a rien répondu)
  if ('Notification' in window && Notification.permission === 'default' && !LS.get('notifAsked', false)) {
    box.append(h('div', { class: 'card ask' }, h('h3', { text: 'Ne rate aucun message' }), h('p', { text: 'Active les notifications pour savoir tout de suite quand on t’écrit.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: function () { LS.set('notifAsked', true); renderChatList(); } }, 'Plus tard'),
        h('button', { class: 'btn small primary', type: 'button', onclick: enableNotifs }, icon('bell'), 'Activer'))));
  }
  visibleChats().forEach(function (c) {
    var un = isUnread(c), typers = typersIn(c.id), other = otherOf(c);
    var snapIn = c.lastText === '📸 Snap' && c.lastBy && c.lastBy !== S.me.id;
    var prev = typers.length ? h('span', { class: 'typing-txt', text: (c.kind === 'group' ? who(typers[0]).name + ' ' : '') + 'écrit…' })
      : snapIn && un ? h('span', { class: 'typing-txt', text: '📸 Nouveau snap · appuie pour voir' })
      : h('span', { text: c.lastText ? ((c.lastBy === S.me.id ? 'Toi : ' : (c.kind === 'group' && c.lastBy ? who(c.lastBy).name + ' : ' : '')) + c.lastText) : (c.kind === 'group' ? 'Tout le monde peut écrire ici' : 'Nouvelle discussion') });
    box.append(h('div', { class: 'crow-w' }, h('button', { class: 'crow' + (un ? ' unread' : ''), type: 'button', onclick: function (e) { if (storyTap(e)) return; openChat(c); } },
      c.kind === 'group' ? groupAvatar(52) : ringAv(other, 52, true),
      h('span', { class: 't' }, h('b', { text: chatTitle(c) }), prev),
      h('span', { class: 'meta' }, c.lastAt ? h('time', { text: ago(c.lastAt) }) : (c.kind === 'group' ? h('time', { text: S.online.size + ' en ligne' }) : null),
        c.streak ? h('span', { class: 'streak' + (c.streakRisk ? ' risk' : ''), title: c.streakRisk ? 'Ta flamme va s’éteindre : écrivez-vous avant minuit' : c.streak + (c.streak > 1 ? ' jours' : ' jour') + ' d’affilée', text: '🔥 ' + c.streak + (c.streakRisk ? ' ⏳' : '') }) : null,
        un ? h('span', { class: 'udot', 'aria-label': 'Non lu' }) : null)),
      un && c.kind === 'dm' ? h('button', { class: 'peekbtn', type: 'button', 'aria-label': 'Entrouvrir le message de ' + chatTitle(c) + ' sans le marquer comme lu', onclick: function () { peek(c); } }, icon('eye'), hasPlus() ? null : h('span', { class: 'tier', text: '+' })) : null));
  });
  box.append(h('button', { class: 'btn block', type: 'button', style: 'margin-top:12px', onclick: openNewChat }, icon('edit'), 'Écrire à quelqu’un'),
    h('button', { class: 'btn block', type: 'button', style: 'margin-top:8px', onclick: invite }, icon('share'), 'Inviter des amis sur Bulle'));
}
// inviter ses amis : feuille de partage du téléphone, sinon lien copié
function invite() {
  var url = new URL('./', location.href).href, text = 'Rejoins-moi sur Bulle ! Mon pseudo : @' + S.me.handle;
  if (navigator.share) { navigator.share({ title: 'Bulle', text: text, url: url }).catch(function () {}); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(function () { toast('Lien copié : colle-le à tes amis'); }, function () { toast(url); });
  else toast(url);
}

/* ---------------- amis proches : leurs snaps « amis proches » ont un contour vert */
function closeList() { return ((S.me && S.me.close) || []).filter(function (id) { return S.users[id]; }); }
function isClose(uid) { return closeList().indexOf(uid) >= 0; }
function setClose(ids, msg) { return updateMe({ close: ids }, msg).then(function (r) { if (r) { if (S.tab === 'profile') renderProfile(); } return r; }); }
function toggleClose(uid) { var on = !isClose(uid), ids = closeList().filter(function (x) { return x !== uid; }); if (on) ids.push(uid); return setClose(ids, on ? who(uid).name + ' fait partie de tes amis proches' : who(uid).name + ' n’est plus dans tes amis proches'); }
// liste à cocher, enregistrée à chaque appui
function closePicker(onChange) {
  var list = h('div', { class: 'ppl cf' });
  function draw() {
    list.replaceChildren();
    var ids = Object.keys(S.users).filter(function (id) { return id !== S.me.id; }).sort(function (a, b) { return who(a).name.localeCompare(who(b).name); });
    ids.forEach(function (id) {
      var on = isClose(id);
      list.append(h('button', { class: 'ppl-row', type: 'button', role: 'checkbox', 'aria-checked': String(on), onclick: function () {
        var ids2 = closeList().filter(function (x) { return x !== id; }); if (!on) ids2.push(id);
        setClose(ids2).then(function (r) { if (r) { draw(); if (onChange) onChange(); } });
      } }, avatar(id, 44), h('span', { class: 'nm' }, h('b', { text: who(id).name }), h('small', { text: '@' + who(id).handle })), h('span', { class: 'cf-check' + (on ? ' on' : ''), 'aria-hidden': 'true' }, on ? icon('star') : null)));
    });
  }
  draw(); return list;
}
function editClose(done) {
  openSheet('Amis proches', h('div', { class: 'form' },
    h('p', { class: 'hint', text: 'Tes snaps « amis proches » ne sont visibles que par eux, avec un contour vert. Personne n’est prévenu quand tu ajoutes ou retires quelqu’un.' }), closePicker(),
    h('button', { class: 'btn primary', type: 'button', onclick: function () { closeSheet(); if (done) done(); } }, 'Terminé')));
}

/* ---------------- notes (petite phrase au-dessus de l'avatar, 24 h) */
function noteOf(uid) { var cut = Date.now() - DAY; return S.notes.find(function (n) { return n.by === uid && n.at > cut; }); }
function notesStrip() {
  var me = S.me.id, mine = noteOf(me), cut = Date.now() - DAY;
  var others = S.notes.filter(function (n) { return n.by !== me && n.at > cut; }).sort(byNewest);
  var row = h('div', { class: 'notes', role: 'list', 'aria-label': 'Notes de tes amis' });
  row.append(h('button', { class: 'note-it mine', type: 'button', role: 'listitem', 'aria-label': mine ? 'Ta note : ' + mine.text : 'Écrire une note', onclick: function (e) { if (storyTap(e)) return; editNote(); } },
    h('span', { class: 'note-bub' + (mine ? '' : ' empty'), text: mine ? mine.text : 'Ta note…' }), ringAv(me, 58), h('small', { text: 'Ta note' })));
  others.forEach(function (n) {
    row.append(h('button', { class: 'note-it', type: 'button', role: 'listitem', 'aria-label': 'Note de ' + who(n.by).name + ' : ' + n.text, onclick: function (e) { if (storyTap(e)) return; openNote(n); } },
      h('span', { class: 'note-bub', text: n.text }), ringAv(n.by, 58), h('small', { text: who(n.by).name })));
  });
  return row;
}
function editNote() {
  var cur = noteOf(S.me.id);
  var inp = h('input', { id: 'note-in', maxlength: '60', placeholder: 'Une pensée, un plan, une chanson…', autocomplete: 'off', value: cur ? cur.text : '' });
  var count = h('span', { class: 'hint', text: '' });
  function sync() { count.textContent = (60 - inp.value.length) + ' caractères restants · visible par tes amis pendant 24 h'; }
  inp.addEventListener('input', sync); sync();
  function save(text) { attempt(call('POST', '/api/note', { text: text }), text ? 'Note partagée' : 'Note supprimée').then(function (r) { if (r) { setNote(r.note); closeSheet(); } }); }
  openSheet('Ta note', h('form', { class: 'form', onsubmit: function (e) { e.preventDefault(); save(inp.value.trim()); } },
    h('div', { class: 'note-prev' }, h('span', { class: 'note-bub big' }, inp), avatar(S.me.id, 72)), count,
    h('button', { class: 'btn primary', type: 'submit' }, 'Partager'),
    cur ? h('button', { class: 'btn', type: 'button', onclick: function () { save(''); } }, icon('trash'), 'Supprimer ma note') : null));
  setTimeout(function () { inp.focus(); }, 60);
}
function setNote(n) { S.notes = S.notes.filter(function (x) { return x.by !== n.by; }); if (n.text) S.notes.push(n); renderChatList(); }
function openNote(n) {
  var w = who(n.by);
  var inp = h('input', { id: 'note-reply', maxlength: '500', placeholder: 'Répondre à ' + w.name + '…', autocomplete: 'off', enterkeyhint: 'send' });
  openSheet('Note de ' + w.name, h('form', { class: 'form', onsubmit: function (e) {
    e.preventDefault(); var t = inp.value.trim(); if (!t) { inp.focus(); return; }
    sendMsg(dmFor(n.by), { text: t, reply: 'note', ref: n.text }).then(function (ok) { if (ok) { closeSheet(); toast('Réponse envoyée à ' + w.name); } });
  } }, h('div', { class: 'note-prev' }, h('span', { class: 'note-bub big', text: n.text }), avatar(n.by, 72), h('small', { class: 'hint', text: ago(n.at) })),
    h('div', { class: 'quick' }, ['😂', '😍', '🔥', '🙌'].map(function (e) { return h('button', { type: 'button', class: 'emo', 'aria-label': 'Répondre ' + e, onclick: function () { inp.value = e; inp.form.requestSubmit(); } }, e); })),
    h('div', { class: 'inrow' }, inp, h('button', { class: 'sendbtn', type: 'submit', 'aria-label': 'Envoyer' }, icon('send')))));
}

/* ---------------- activité (j'aime, commentaires, vues) */
function actSeen() { return LS.get('actSeen.' + S.me.id, 0); }
function renderActDot() { var d = $('#act-dot'); if (d) d.hidden = !S.activity.some(function (a) { return a.at > actSeen(); }); }
var ACT = { like: 'a aimé ta photo.', comment: 'a commenté : ', view: 'a vu ton snap.' };
function openActivity() { openSheet('Activité', h('div', { id: 'act-list', class: 'act' }), { type: 'activity' }); renderActivity(); }
function renderActivity() {
  var box = $('#act-list'); if (!box) return; box.replaceChildren();
  LS.set('actSeen.' + S.me.id, Date.now()); renderActDot();
  if (!S.activity.length) { box.append(h('div', { class: 'empty' }, icon('bell'), h('p', { text: 'Quand on aimera, commentera ou regardera ce que tu publies, ça s’affichera ici.' }))); return; }
  var lastDay = '';
  S.activity.forEach(function (a) {
    var d = dayLabel(a.at); if (d !== lastDay) { box.append(h('div', { class: 'sep', text: d })); lastDay = d; }
    var p = a.post && S.posts.find(function (x) { return x.id === a.post; }), s = a.story && S.stories.find(function (x) { return x.id === a.story; });
    var thumb = p ? cachedImg('a' + a.id, p.img, '') : s ? h('img', { src: s.img, alt: '' }) : null;
    box.append(h('button', { class: 'act-row', type: 'button', onclick: function () { if (p) openPost(p.id); else showProfile(a.by); } },
      avatar(a.by, 44), h('span', { class: 't' }, h('b', { text: who(a.by).name + ' ' }), ACT[a.type] || '', a.text ? '« ' + a.text + ' »' : '', h('small', { text: ' ' + ago(a.at) })),
      thumb ? h('span', { class: 'act-th' }, thumb) : null));
  });
}
// Bulle+ : lire les derniers messages sans les marquer comme lus
function peek(c) {
  if (!hasPlus()) { openPlans('Entrouvrir un message sans qu’il soit marqué comme lu, c’est avec Bulle+.'); return; }
  var name = chatTitle(c), list = h('div', { class: 'peek' }, h('p', { class: 'hint', text: 'Chargement…' }));
  openSheet('Entrouvert', h('div', { class: 'form' },
    h('p', { class: 'peek-note' }, icon('eye'), name + ' ne saura pas que tu as lu. La discussion reste non lue.'), list,
    h('button', { class: 'btn primary', type: 'button', onclick: function () { openChat(c); } }, 'Ouvrir la discussion')), { type: 'peek' });
  call('GET', '/api/chats/' + c.id + '/messages').then(function (r) {
    var seenAt = readMap()[c.id] || 0;
    var fresh = r.messages.filter(function (m) { return m.by !== S.me.id && m.at > seenAt; }).slice(-5);
    list.replaceChildren.apply(list, fresh.length ? fresh.map(function (m) { return h('div', { class: 'bub', text: msgPreview(m) }); }) : [h('p', { class: 'hint', text: 'Rien de nouveau.' })]);
  }, function () { list.replaceChildren(h('p', { class: 'hint', text: 'Impossible de lire les messages.' })); });
}

/* ---------------- discussion ouverte */
var msgReq = 0;
function openChat(c) {
  stopRec(false); stopPlay();
  S.openChat = c; S.msgs = []; S.forceBottom = true; S.quote = null; markRead(c.id);
  closeSheet(); $('#thread').hidden = false; $('#th-in').value = ''; renderQuote();
  $('#th-snap-l').hidden = c.kind !== 'dm'; syncCompose();
  renderThreadHead(); renderMsgs(); renderTyping(); renderNav(); renderChatList();
  var req = ++msgReq;
  call('GET', '/api/chats/' + c.id + '/messages').then(function (r) {
    if (req !== msgReq || !S.openChat || S.openChat.id !== c.id) return;
    S.msgs = r.messages; S.forceBottom = true; renderMsgs();
  }, function (e) { if (e.status === 401) showAuth(); else toast(e.message); });
  if (window.matchMedia('(hover:hover)').matches) setTimeout(function () { $('#th-in').focus(); }, 60);
}
function closeThread() { stopRec(false); stopPlay(); S.openChat = null; S.msgs = []; S.quote = null; $('#thread').hidden = true; renderChatList(); renderNav(); }
function renderThreadHead() {
  var c = S.openChat, box = $('#th-who'); box.replaceChildren(); if (!c) return;
  if (c.kind === 'group') {
    box.append(groupAvatar(40), h('span', { class: 'nm' }, h('b', { text: 'Le salon' }), h('small', { text: S.online.size > 1 ? S.online.size + ' personnes en ligne' : 'Ouvert à tout le monde' })));
    box.onclick = null;
  } else {
    var o = otherOf(c), on = S.online.has(o);
    box.append(ringAv(o, 40, true), h('span', { class: 'nm' }, h('b', { text: who(o).name }), h('small', { class: on ? 'on' : '', text: on ? 'En ligne' : '@' + who(o).handle })));
    box.onclick = function (e) { if (storyTap(e)) return; showProfile(o); };
  }
}
function renderMsgs() {
  var box = $('#msgs'); if (!S.openChat) return;
  var near = box.scrollHeight - box.scrollTop - box.clientHeight < 140;
  box.replaceChildren();
  var c = S.openChat, group = c.kind === 'group', me = S.me.id, ms = S.msgs, lastDay = '';
  if (!ms.length) box.append(h('div', { class: 'empty' }, group ? groupAvatar(72) : avatar(otherOf(c), 72), h('p', { text: group ? 'Lance la discussion avec tout le monde.' : 'Dis bonjour à ' + who(otherOf(c)).name + '.' })));
  ms.forEach(function (m, i) {
    var d = dayLabel(m.at); if (d !== lastDay) { box.append(h('div', { class: 'sep', text: d })); lastDay = d; }
    var prev = ms[i - 1], next = ms[i + 1];
    var first = !prev || prev.by !== m.by || dayLabel(prev.at) !== d || m.at - prev.at > 5 * 6e4;
    var last = !next || next.by !== m.by || dayLabel(next.at) !== d || next.at - m.at > 5 * 6e4;
    var mine = m.by === me;
    if (group && !mine && first) box.append(h('div', { class: 'sender', text: who(m.by).name }));
    var col = h('div', { class: 'mcol' });
    if (m.reply === 'snap') col.append(h('span', { class: 'rtag', text: mine ? 'Tu as réagi à son snap' : 'A réagi à ton snap' }));
    if (m.reply === 'note') col.append(h('span', { class: 'rtag', text: mine ? 'Tu as répondu à sa note' : 'A répondu à ta note' }), m.ref ? h('span', { class: 'quote note', text: m.ref }) : null);
    if (m.quote) col.append(h('button', { class: 'quote', type: 'button', onclick: function () { var t = $('[data-mid="' + m.quote.id + '"]'); if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.add('flash'); setTimeout(function () { t.classList.remove('flash'); }, 1200); } } },
      h('b', { text: m.quote.by === me ? 'Toi' : who(m.quote.by).name }), h('span', { text: m.quote.text })));
    if (m.once) col.append(snapBubble(m, mine));
    if (m.audio) col.append(voiceBubble(m, mine));
    if (m.img) col.append(h('button', { class: 'bub pic', type: 'button', 'aria-label': 'Agrandir la photo', onclick: function () { viewImage(m.img); } }, cachedImg('m' + m.id, m.img, 'Photo envoyée')));
    if (m.text) col.append(h('div', { class: 'bub' + (/^(?:\p{Extended_Pictographic}️?){1,3}$/u.test(m.text) ? ' big' : ''), text: m.text }));
    var rx = reactsOf(m); if (rx) col.append(rx);
    msgGestures(col, m);
    // dernier message envoyé en privé : « Vu » ou « Envoyé » (si les confirmations de lecture sont actives)
    var status = '';
    if (mine && !group && i === ms.length - 1) {
      var seenAt = (c.seen || {})[otherOf(c)] || 0;
      status = privacy().readReceipts && seenAt >= m.at ? ' · Vu' : ' · Envoyé';
    }
    if (last) col.append(h('span', { class: 'mtime', text: hhmm(m.at) + status }));
    var row = h('div', { class: 'mrow ' + (mine ? 'me' : 'them') + (last ? ' last' : ''), 'data-mid': m.id });
    if (!mine) row.append(last ? h('span', { class: 'mav', onclick: storyTap }, ringAv(m.by, 28)) : h('span', { class: 'spacer' }));
    row.append(col); box.append(row);
  });
  if (near || S.forceBottom) { box.scrollTop = box.scrollHeight; S.forceBottom = false; }
  syncVoice();
}
function renderTyping() {
  var t = $('#typing'); t.replaceChildren();
  var ids = S.openChat ? typersIn(S.openChat.id) : [];
  t.hidden = !ids.length; if (!ids.length) return;
  t.append(h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { text: (ids.length > 1 ? ids.length + ' personnes écrivent' : who(ids[0]).name + ' écrit') + '…' }));
}
/* snaps « vu une fois » : l'image s'ouvre une seule fois, 10 secondes, puis disparaît */
function snapBubble(m, mine) {
  var label = mine ? (m.opened ? 'Ouvert' : 'Snap envoyé') : (m.opened ? 'Snap ouvert' : 'Appuie pour voir le snap');
  var live = !mine && !m.opened;
  return h('button', { class: 'snapmsg' + (live ? ' live' : ''), type: 'button', 'aria-disabled': live ? null : 'true', onclick: function () { if (live) openSnapMsg(m); } },
    h('span', { class: 'sq', 'aria-hidden': 'true' }), h('span', { text: label }));
}
function openSnapMsg(m) {
  var c = S.openChat; if (!c) return;
  call('POST', '/api/chats/' + c.id + '/messages/' + m.id + '/open').then(function (r) {
    m.opened = true; renderMsgs();
    var bar = h('i'), raf = 0, t0 = performance.now();
    var v = h('div', { class: 'snapview', role: 'dialog', 'aria-label': 'Snap de ' + who(m.by).name },
      h('img', { src: r.img, alt: 'Snap de ' + who(m.by).name }),
      h('div', { class: 'sv-top' }, h('div', { class: 'sv-bars' }, h('span', { class: 'sv-bar' }, bar)),
        h('div', { class: 'sv-head' }, h('span', { class: 'sv-who' }, avatar(m.by, 32), h('b', { text: who(m.by).name }), h('time', { text: 'vu une seule fois' })))));
    function close() { cancelAnimationFrame(raf); v.remove(); }
    function step(now) { var p = (now - t0) / 10000; bar.style.width = Math.min(100, p * 100) + '%'; if (p >= 1) close(); else raf = requestAnimationFrame(step); }
    v.addEventListener('click', close);
    $('#phone').append(v); raf = requestAnimationFrame(step);
  }, function (e) { m.opened = true; renderMsgs(); toast(e.message); });
}
/* réactions : double-tap = ❤️, appui long (ou clic droit) = menu */
var EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
function reactsOf(m) {
  var r = m.reacts || {}, ids = Object.keys(r); if (!ids.length) return null;
  var uniq = []; ids.forEach(function (u) { if (uniq.indexOf(r[u]) < 0) uniq.push(r[u]); });
  return h('button', { class: 'reacts' + (r[S.me.id] ? ' mine' : ''), type: 'button', 'aria-label': ids.map(function (u) { return (u === S.me.id ? 'Toi' : who(u).name) + ' ' + r[u]; }).join(', '), onclick: function () { msgMenu(m); } },
    uniq.join(''), ids.length > 1 ? h('small', { text: String(ids.length) }) : null);
}
function react(m, emoji) {
  var c = S.openChat; if (!c) return;
  m.reacts = Object.assign({}, m.reacts); if (m.reacts[S.me.id] === emoji) delete m.reacts[S.me.id]; else m.reacts[S.me.id] = emoji;
  renderMsgs(); if (navigator.vibrate) navigator.vibrate(10);
  call('POST', '/api/chats/' + c.id + '/messages/' + m.id + '/react', { emoji: emoji }).catch(function (e) { toast(e.message); });
}
function msgGestures(el, m) {
  var lastTap = 0, timer = 0;
  el.addEventListener('dblclick', function (e) { if (e.target.closest('.snapmsg,.quote,.voice')) return; react(m, '❤️'); });
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); msgMenu(m); });
  el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') return; timer = setTimeout(function () { timer = 0; msgMenu(m); }, 480); });
  ['pointermove', 'pointercancel'].forEach(function (t) { el.addEventListener(t, function () { clearTimeout(timer); }); });
  el.addEventListener('pointerup', function (e) {
    if (e.pointerType !== 'touch') return; clearTimeout(timer);
    if (e.target.closest('.snapmsg,.quote,.pic,.voice')) return;
    var t = Date.now(); if (t - lastTap < 300) { react(m, '❤️'); lastTap = 0; } else lastTap = t;
  });
}
function msgMenu(m) {
  var mine = m.by === S.me.id, cur = (m.reacts || {})[S.me.id];
  openSheet('Message', h('div', { class: 'form' },
    h('div', { class: 'quick' }, EMOJIS.map(function (e) { return h('button', { type: 'button', class: 'emo' + (cur === e ? ' on' : ''), 'aria-pressed': String(cur === e), 'aria-label': 'Réagir ' + e, onclick: function () { closeSheet(); react(m, e); } }, e); })),
    reactsList(m),
    navRow('reply', 'Répondre', function () { closeSheet(); setQuote(m); }),
    m.text ? navRow('copy', 'Copier le texte', function () { closeSheet(); if (navigator.clipboard) navigator.clipboard.writeText(m.text).then(function () { toast('Copié'); }); }) : null,
    h('p', { class: 'hint', text: (mine ? 'Envoyé ' : 'Reçu ') + dayLabel(m.at).toLowerCase() + ' à ' + hhmm(m.at) })));
}
function reactsList(m) {
  var r = m.reacts || {}, ids = Object.keys(r); if (!ids.length) return null;
  return h('div', { class: 'rx-list' }, ids.map(function (u) { return h('div', { class: 'rx-row' }, avatar(u, 28), h('b', { text: u === S.me.id ? 'Toi' : who(u).name }), h('span', { text: r[u] })); }));
}
function setQuote(m) { S.quote = m; renderQuote(); $('#th-in').focus(); }
function renderQuote() {
  var q = $('#th-quote'), m = S.quote; q.replaceChildren(); q.hidden = !m; if (!m) return;
  q.append(icon('reply'), h('span', { class: 't' }, h('b', { text: 'Réponse à ' + (m.by === S.me.id ? 'toi-même' : who(m.by).name) }), h('span', { text: msgPreview(m) })),
    h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Annuler la réponse', onclick: function () { S.quote = null; renderQuote(); } }, icon('close')));
}
/* ---------------- messages vocaux : appuie sur le micro, parle, envoie */
var MAXREC = 120000, REC = null;
function fmtDur(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function pickMime() { var c = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']; for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i]; return ''; }
function syncCompose() {
  var empty = !$('#th-in').value.trim();
  $('#th-form').classList.toggle('rec', !!REC); $('#recbar').hidden = !REC;
  $('#th-mic').hidden = !!REC || !empty; $('#th-send').hidden = !REC && empty;
}
function startRec() {
  if (REC || !S.openChat) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { toast('Ce navigateur ne permet pas d’enregistrer des messages vocaux.'); return; }
  var chat = S.openChat;
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
    if (REC || !S.openChat || S.openChat.id !== chat.id) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
    var mime = pickMime(), opts = { audioBitsPerSecond: 32000 }, mr; if (mime) opts.mimeType = mime;
    try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
    var AC = window.AudioContext || window.webkitAudioContext, ac = null, an = null;
    try { ac = new AC(); an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an); } catch (e) { an = null; }
    var r = REC = { chat: chat, stream: stream, mr: mr, ac: ac, an: an, buf: an ? new Uint8Array(an.fftSize) : null, chunks: [], levels: [], t0: Date.now(), raf: 0, send: false, lastLv: 0 };
    mr.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
    mr.onstop = function () { finishRec(r); };
    mr.start(250); $('#rec-wave').replaceChildren(); syncCompose(); tickRec();
    if (navigator.vibrate) navigator.vibrate(15);
  }, function (e) {
    toast(e && e.name === 'NotAllowedError' ? 'Autorise le micro pour envoyer un vocal (le cadenas à côté de l’adresse).' : 'Aucun micro trouvé sur cet appareil.');
  });
}
function tickRec() {
  var r = REC; if (!r) return;
  var now = Date.now();
  if (now - r.lastLv >= 100) {
    var lv = 0.15 + Math.random() * 0.1;
    if (r.an) { r.an.getByteTimeDomainData(r.buf); var s = 0; for (var i = 0; i < r.buf.length; i++) { var v = (r.buf[i] - 128) / 128; s += v * v; } lv = Math.min(1, Math.sqrt(s / r.buf.length) * 4); }
    r.levels.push(lv); r.lastLv = now;
    var w = $('#rec-wave'); w.append(h('i', { style: 'height:' + Math.max(10, Math.round(lv * 100)) + '%' })); while (w.children.length > 48) w.firstChild.remove();
  }
  $('#rec-time').textContent = fmtDur((now - r.t0) / 1000);
  if (now - r.t0 >= MAXREC) { stopRec(true); toast('2 minutes maximum : vocal envoyé'); return; }
  r.raf = requestAnimationFrame(tickRec);
}
function stopRec(send) {
  var r = REC; if (!r) return; REC = null;
  r.send = send; r.stopAt = Date.now(); cancelAnimationFrame(r.raf);
  try { if (r.mr.state !== 'inactive') r.mr.stop(); else finishRec(r); } catch (e) { finishRec(r); }
  r.stream.getTracks().forEach(function (t) { t.stop(); });
  if (r.ac) r.ac.close().catch(function () {});
  syncCompose();
}
function resample(a, n) {
  if (!a.length) return [];
  var out = [], mx = Math.max.apply(null, a.concat([0.05]));
  for (var i = 0; i < n; i++) { var s = Math.floor(i * a.length / n), e = Math.max(s + 1, Math.floor((i + 1) * a.length / n)), m = 0; for (var j = s; j < e && j < a.length; j++) m = Math.max(m, a[j]); out.push(Math.round(m / mx * 100) / 100); }
  return out;
}
function finishRec(r) {
  if (!r.send || r.done) return; r.done = true;
  var dur = (r.stopAt - r.t0) / 1000;
  if (dur < 0.8) { toast('Trop court : parle un peu plus longtemps'); return; }
  var blob = new Blob(r.chunks, { type: (r.mr.mimeType || 'audio/webm') });
  var fr = new FileReader();
  fr.onload = function () { sendMsg(r.chat, { audio: fr.result, dur: Math.round(dur * 10) / 10, wave: resample(r.levels, 36) }); };
  fr.onerror = function () { toast('Le message vocal n’a pas pu être lu.'); };
  fr.readAsDataURL(blob);
}
// lecture : une seule à la fois, vitesse 1× / 1,5× / 2×
var PLAY = { id: null, audio: null, dur: 0 }, RATE = LS.get('vrate', 1);
function heard(id) { return LS.get('heard', []).indexOf(id) >= 0; }
function markHeard(id) { var l = LS.get('heard', []); if (l.indexOf(id) < 0) { l.push(id); LS.set('heard', l.slice(-400)); } }
function voiceBubble(m, mine) {
  var bars = m.wave && m.wave.length ? m.wave : [0.3, 0.5, 0.4, 0.7, 0.5, 0.3, 0.6, 0.4, 0.5, 0.3, 0.6, 0.4, 0.3, 0.5, 0.4, 0.3];
  var el = h('div', { class: 'voice' + (mine || heard(m.id) ? '' : ' new'), 'data-voice': m.id, 'data-dur': String(m.dur || 0) },
    h('button', { class: 'vplay', type: 'button', 'aria-label': 'Écouter le message vocal', onclick: function () { togglePlay(m); } }, icon('play')),
    h('span', { class: 'vwave', onclick: function (e) { var r = e.currentTarget.getBoundingClientRect(); togglePlay(m, (e.clientX - r.left) / r.width); } }, bars.map(function (v) { return h('i', { style: 'height:' + Math.max(14, Math.round(v * 100)) + '%' }); })),
    h('span', { class: 'vtime', text: fmtDur(m.dur) }),
    h('button', { class: 'vspeed', type: 'button', 'aria-label': 'Vitesse de lecture', onclick: function () { RATE = RATE === 1 ? 1.5 : RATE === 1.5 ? 2 : 1; LS.set('vrate', RATE); if (PLAY.audio) PLAY.audio.playbackRate = RATE; syncVoice(); } }, RATE + '×'));
  return el;
}
function togglePlay(m, seek) {
  if (PLAY.id === m.id && PLAY.audio) {
    var a0 = PLAY.audio;
    if (seek != null) { a0.currentTime = seek * PLAY.dur; if (a0.paused) a0.play().catch(function () {}); }
    else if (a0.paused) a0.play().catch(function () {}); else a0.pause();
    syncVoice(); return;
  }
  stopPlay();
  var a = new Audio(m.audio); a.playbackRate = RATE;
  PLAY = { id: m.id, audio: a, dur: m.dur || 1 };
  a.addEventListener('loadedmetadata', function () { if (isFinite(a.duration) && a.duration > 0) PLAY.dur = a.duration; if (seek) a.currentTime = seek * PLAY.dur; });
  ['timeupdate', 'play', 'pause'].forEach(function (t) { a.addEventListener(t, syncVoice); });
  a.addEventListener('ended', function () {
    var next = S.msgs.filter(function (x) { return x.audio && x.at > m.at && x.by !== S.me.id && !heard(x.id); })[0];
    stopPlay(); if (next) togglePlay(next); // enchaîne le vocal suivant pas encore écouté
  });
  a.play().catch(function () { toast('Impossible de lire ce vocal sur cet appareil.'); });
  if (m.by !== S.me.id) markHeard(m.id);
  syncVoice();
}
function stopPlay() { if (PLAY.audio) { PLAY.audio.pause(); PLAY.audio.removeAttribute('src'); } PLAY = { id: null, audio: null, dur: 0 }; syncVoice(); }
function syncVoice() {
  $$('[data-voice]').forEach(function (el) {
    var on = el.getAttribute('data-voice') === PLAY.id && PLAY.audio, playing = on && !PLAY.audio.paused;
    var p = on ? Math.min(1, PLAY.audio.currentTime / (PLAY.dur || 1)) : 0, bars = el.querySelectorAll('.vwave i');
    for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('on', on && (i + 0.5) / bars.length <= p);
    var b = el.querySelector('.vplay'); if (b.dataset.st !== (playing ? 'p' : 'r')) { b.dataset.st = playing ? 'p' : 'r'; b.replaceChildren(icon(playing ? 'pause' : 'play')); b.setAttribute('aria-label', playing ? 'Mettre en pause' : 'Écouter le message vocal'); }
    el.classList.toggle('active', !!on); if (on) el.classList.remove('new');
    el.querySelector('.vtime').textContent = on && PLAY.audio.currentTime > 0 ? fmtDur(PLAY.audio.currentTime) : fmtDur(+el.getAttribute('data-dur'));
    el.querySelector('.vspeed').textContent = RATE + '×';
  });
}
function sendMsg(chat, payload) {
  return attempt(call('POST', '/api/chats/' + chat.id + '/messages', payload)).then(function (r) {
    if (!r) return false;
    upsert(S.chats, r.chat);
    if (S.openChat && S.openChat.id === chat.id) { S.openChat = r.chat; if (!S.msgs.some(function (m) { return m.id === r.msg.id; })) S.msgs.push(r.msg); S.forceBottom = true; renderMsgs(); }
    markRead(chat.id); renderChatList(); renderNav();
    return true;
  });
}
function viewImage(src) {
  var v = h('div', { class: 'viewer', role: 'dialog', 'aria-label': 'Photo', onclick: function () { v.remove(); } }, h('img', { src: src, alt: '' }));
  $('#phone').append(v);
}

/* ---------------- profil */
function showProfile(uid) { S.viewUid = uid === S.me.id ? null : uid; S.editing = false; closeSheet(); if (S.openChat) closeThread(); switchTab('profile'); }
function renderProfile() {
  var box = $('#profile'); if (S.editing) return; box.replaceChildren();
  var uid = S.viewUid || S.me.id, w = who(uid), mine = uid === S.me.id;
  var posts = S.posts.filter(function (p) { return p.by === uid; });
  var likes = posts.reduce(function (n, p) { return n + p.likes.length; }, 0);
  var snaps = S.stories.filter(function (s) { return s.by === uid && s.at > Date.now() - DAY; });
  var pf = h('div', { class: 'pf' });
  if (!mine) pf.append(h('button', { class: 'linkish', type: 'button', onclick: function () { S.viewUid = null; renderProfile(); } }, '← Mon profil'));
  else pf.append(h('div', { class: 'pf-bar' }, h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Paramètres', onclick: openSettings }, icon('gear'))));
  pf.append(h('div', { class: 'pf-head' },
    h('button', { class: 'pf-av' + (snaps.length ? '' : ' plain'), type: 'button', 'aria-label': snaps.length ? (mine ? 'Voir ton snap' : 'Voir son snap') : 'Photo de profil', onclick: function () { if (snaps.length) openStoriesOf(uid); else if (mine) editProfile(); } }, ringAv(uid, 88)),
    h('div', { class: 'pf-id' }, h('h1', { class: 'pf-name' }, w.name, tierChip((S.users[uid] || {}).plan, true)), h('p', { class: 'pf-handle', text: '@' + w.handle }), !mine && S.online.has(uid) ? h('p', { class: 'on-line', text: 'En ligne' }) : null,
      h('p', { class: 'pf-chips' }, h('span', { class: 'pchip', title: 'Score Bulle : grimpe à chaque message, snap et publication', text: '⭐ ' + ((S.users[uid] || {}).score || 0) }),
        !mine && dmFor(uid).streak ? h('span', { class: 'pchip', title: 'Jours d’affilée où vous vous êtes écrit', text: '🔥 ' + dmFor(uid).streak }) : null,
        noteOf(uid) ? h('span', { class: 'pchip note', text: '💬 ' + noteOf(uid).text }) : null))));
  if (w.bio) pf.append(h('p', { class: 'pf-bio', text: w.bio }));
  pf.append(h('dl', { class: 'pf-stats' },
    h('div', {}, h('dt', { text: posts.length > 1 ? 'publications' : 'publication' }), h('dd', { text: String(posts.length) })),
    h('div', {}, h('dt', { text: 'j’aime reçus' }), h('dd', { text: String(likes) })),
    h('div', {}, h('dt', { text: 'snaps actifs' }), h('dd', { text: String(snaps.length) }))));
  if (mine) pf.append(h('div', { class: 'pf-acts' }, h('button', { class: 'btn', type: 'button', onclick: editProfile }, icon('edit'), 'Modifier'), h('button', { class: 'btn primary', type: 'button', onclick: function () { openComposer('post'); } }, icon('plus'), 'Publier')));
  else pf.append(h('div', { class: 'pf-acts' }, h('button', { class: 'btn primary', type: 'button', onclick: function () { openChat(dmFor(uid)); } }, icon('send'), 'Envoyer un message'),
    h('button', { class: 'btn cf-btn' + (isClose(uid) ? ' on' : ''), type: 'button', 'aria-pressed': String(isClose(uid)), onclick: function () { toggleClose(uid); } }, icon('star'), isClose(uid) ? 'Ami proche' : 'Amis proches')));
  if (posts.length) pf.append(h('div', { class: 'grid' }, posts.map(function (p) { return h('button', { type: 'button', 'aria-label': 'Ouvrir la publication', onclick: function () { openPost(p.id); } }, cachedImg('g' + p.id, p.img, '')); })));
  else pf.append(h('p', { class: 'muted', style: 'color:var(--muted)', text: mine ? 'Tes photos apparaîtront ici.' : 'Aucune publication pour le moment.' }));
  if (mine) {
    pf.append(proCard(posts, snaps));
    pf.append(installCard());
    pf.append(h('div', { class: 'settings' }, navRow('share', 'Inviter des amis', invite), navRow('gear', 'Paramètres et confidentialité', openSettings)));
  }
  box.append(pf);
}
// Statistiques (Bulle Pro) — sinon un aperçu qui donne envie
function proCard(posts, snaps) {
  if (!isPro()) {
    return h('button', { class: 'promo', type: 'button', onclick: function () { openPlans(); } }, icon('chart'),
      h('span', { class: 'x' }, h('b', { text: 'Tes statistiques' }), h('small', { text: 'Vues, j’aime, meilleure photo : avec Bulle Pro.' })), icon('chev'));
  }
  var week = Date.now() - 7 * DAY, recent = posts.filter(function (p) { return p.at > week; });
  var likes = recent.reduce(function (n, p) { return n + p.likes.length; }, 0);
  var comments = recent.reduce(function (n, p) { return n + p.comments.filter(function (c) { return c.by !== S.me.id; }).length; }, 0);
  var views = snaps.reduce(function (n, s) { return n + (s.views || []).length; }, 0);
  var best = posts.slice().sort(function (a, b) { return b.likes.length - a.likes.length; })[0];
  return h('div', { class: 'card' }, h('h3', { text: 'Statistiques · 7 jours' }),
    h('div', { class: 'stats' },
      h('div', {}, h('b', { text: String(recent.length) }), h('small', { text: 'publications' })),
      h('div', {}, h('b', { text: String(likes) }), h('small', { text: 'j’aime reçus' })),
      h('div', {}, h('b', { text: String(comments) }), h('small', { text: 'commentaires reçus' })),
      h('div', {}, h('b', { text: String(views) }), h('small', { text: 'vues de tes snaps actifs' }))),
    best && best.likes.length ? h('p', { text: 'Ta photo la plus aimée a ' + best.likes.length + ' j’aime. Publie à la même heure pour toucher plus de monde.' }) : h('p', { text: 'Publie une photo pour voir tes premiers chiffres.' }));
}
function navRow(ic, label, fn, sub) {
  return h('button', { class: 'setrow', type: 'button', onclick: fn }, icon(ic), h('span', { class: 'x' }, h('span', { text: label }), sub ? h('small', { class: 'sub', text: sub }) : null), h('span', { class: 'chev' }, icon('chev')));
}
function swRow(label, on, fn, sub, disabled) {
  var b = h('button', { class: 'setrow', type: 'button', role: 'switch', 'aria-checked': String(!!on), 'aria-disabled': disabled ? 'true' : null, onclick: function () {
    if (disabled) { if (typeof disabled === 'function') disabled(); return; }
    var v = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', String(v)); fn(v);
  } }, h('span', { class: 'x', style: 'flex:1' }, h('span', { text: label }), sub ? h('small', { class: 'sub', text: sub }) : null), h('span', { class: 'sw', 'aria-hidden': 'true' }));
  return b;
}

/* ---------------- paramètres */
function openSettings() {
  openSheet('Paramètres', h('div', { id: 'set-body', class: 'set' }), { type: 'settings' });
  renderSettings();
}
function renderSettings() {
  var body = $('#set-body'); if (!body || !S.me) return;
  var card = body.closest('.sheet-card'), keep = card ? card.scrollTop : 0;
  body.replaceChildren();
  function sec(title, kids, hint) { body.append(h('section', { class: 'setsec' }, h('h3', { text: title }), h('div', { class: 'settings' }, kids), hint ? h('p', { class: 'hint', text: hint }) : null)); }

  // offre
  var plan = S.me.plan || 'free';
  body.append(h('button', { class: 'promo', type: 'button', onclick: function () { openPlans(); } }, icon('spark'),
    h('span', { class: 'x' }, h('b', { text: plan === 'pro' ? 'Bulle Pro' : plan === 'plus' ? 'Bulle+' : 'Passe à Bulle+' }), h('small', { text: plan === 'free' ? 'Thèmes exclusifs, entrouvrir les messages, badge…' : 'Ton offre est active. Gérer mon offre' })), icon('chev')));

  sec('Compte', [navRow('edit', 'Modifier le profil', function () { closeSheet(); S.viewUid = null; switchTab('profile'); editProfile(); }, 'Photo, nom affiché, bio')]);

  // apparence
  var seg = h('div', { class: 'seg three', role: 'radiogroup', 'aria-label': 'Mode d’affichage' }, [['auto', 'Auto'], ['light', 'Jour'], ['dark', 'Nuit']].map(function (o) {
    return h('button', { type: 'button', role: 'radio', 'aria-checked': String(PREFS.mode === o[0]), onclick: function () { PREFS.mode = o[0]; savePrefs(); applyLook(); renderSettings(); } }, o[1]);
  }));
  var sws = h('div', { class: 'swatches' }, THEMES.map(function (t) {
    var locked = t.plus && !hasPlus(), cur = (PREFS.theme === t.id) && !locked;
    return h('button', { class: 'swatch', type: 'button', 'aria-pressed': String(cur), 'aria-label': 'Thème ' + t.name + (locked ? ', réservé à Bulle+' : ''), onclick: function () {
      if (locked) { openPlans('Le thème ' + t.name + ' fait partie de Bulle+.'); return; }
      PREFS.theme = t.id; savePrefs(); applyLook(); renderSettings();
    } }, h('span', { class: 'sw-dot', style: 'background:' + t.sw[0] + ';--ink:' + t.sw[1] }, h('i')), h('small', { text: t.name }), locked ? h('span', { class: 'tier', text: '+' }) : null);
  }));
  body.append(h('section', { class: 'setsec' }, h('h3', { text: 'Apparence' }), seg, sws,
    h('p', { class: 'hint', text: 'Auto suit le réglage jour/nuit de ton téléphone ou de ton ordinateur.' })));

  // notifications
  var perm = 'Notification' in window ? Notification.permission : 'unsupported';
  var notifOn = PREFS.notif && perm === 'granted';
  sec('Notifications', [
    swRow('Notifications de messages', notifOn, function (v) { if (v) enableNotifs(); else { PREFS.notif = false; savePrefs(); renderSettings(); } },
      perm === 'denied' ? 'Bloquées par le navigateur : autorise-les dans les réglages du site (cadenas à côté de l’adresse).' : perm === 'unsupported' ? (isIOS && !standalone ? 'Sur iPhone, installe d’abord Bulle sur l’écran d’accueil.' : 'Pas disponibles sur ce navigateur.') : 'Une alerte quand Bulle est en arrière-plan.',
      perm === 'denied' || perm === 'unsupported'),
    swRow('Aperçu du message', PREFS.preview, function (v) { PREFS.preview = v; savePrefs(); }, 'Sinon la notification dit juste « Nouveau message ».'),
    swRow('Bandeau dans l’app', PREFS.heads, function (v) { PREFS.heads = v; savePrefs(); }, 'Un bandeau en haut de l’écran quand un message arrive ailleurs.'),
    notifOn ? navRow('bell', 'Tester une notification', function () { testNotif(); }) : null
  ], 'Version test : les notifications arrivent tant que Bulle est ouverte ou en arrière-plan. Quand l’app est complètement fermée, il faudra le serveur.');

  // confidentialité
  var pv = privacy();
  sec('Confidentialité', [
    swRow('Mode fantôme', pv.ghost, function (v) { setPrivacy({ ghost: v }); }, 'Tes amis ne voient plus ta position sur la carte.'),
    swRow('Afficher quand je suis en ligne', pv.showOnline, function (v) { setPrivacy({ showOnline: v }); }, 'Le point vert à côté de ta photo.'),
    swRow('Confirmations de lecture', pv.readReceipts, function (v) { setPrivacy({ readReceipts: v }); }, 'Si tu les coupes, tu ne vois plus non plus quand les autres ont lu (« Vu »).'),
    h('div', { class: 'setrow', style: 'cursor:default;flex-wrap:wrap' }, h('span', { class: 'x', style: 'flex:1' }, h('span', { text: 'Qui peut m’écrire' })),
      h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Qui peut m’écrire', style: 'width:100%' }, [['all', 'Tout le monde'], ['friends', 'Mes amis']].map(function (o) {
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(pv.dms === o[0]), onclick: function () { setPrivacy({ dms: o[0] }); } }, o[1]);
      }))),
    navRow('star', 'Amis proches', function () { editClose(openSettings); }, closeList().length ? closeList().length + (closeList().length > 1 ? ' personnes' : ' personne') + ' · contour vert sur tes snaps' : 'Personne pour l’instant')
  ],'Version test : tout est enregistré. Le mode fantôme et les confirmations de lecture marchent déjà ; les autres réglages s’appliqueront à tes vrais contacts avec le serveur.');

  sec('Informations légales', [
    navRow('doc', 'Conditions d’utilisation', function () { openLegal('cgu.html', 'Conditions d’utilisation'); }),
    navRow('shield', 'Politique de confidentialité', function () { openLegal('confidentialite.html', 'Confidentialité'); })
  ]);
  sec('Mes données', [
    navRow('download', 'Télécharger mes données', exportData, 'Un fichier avec ton profil, tes photos et tes messages'),
    navRow('trash', 'Tout effacer et recommencer', confirmReset)
  ]);
  body.append(h('div', { class: 'card' }, h('h3', { text: 'Version test' }),
    h('p', { text: 'Tout est enregistré sur cet appareil uniquement : rien n’est envoyé sur Internet. Lou, Inès et Malo sont des contacts d’exemple qui répondent automatiquement. Les vrais messages entre amis arriveront avec le serveur.' })));
  if (card) card.scrollTop = keep;
}
function enableNotifs() {
  if (!('Notification' in window)) { toast('Notifications indisponibles ici.'); renderSettings(); return; }
  Notification.requestPermission().then(function (p) {
    PREFS.notif = p === 'granted'; savePrefs(); LS.set('notifAsked', true);
    if (p === 'granted') testNotif('Les notifications sont activées.'); else toast('Notifications refusées.');
    renderSettings(); renderChatList();
  });
}
function testNotif(text) {
  var opts = { body: text || 'Voilà à quoi ressemble un nouveau message.', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: 'bulle-test' };
  if (swReg) swReg.showNotification('Bulle', opts).catch(function () {}); else try { new Notification('Bulle', opts); } catch (e) { /* rien */ }
}
function openLegal(url, title) {
  openSheet(title, h('div', { class: 'form' }, h('iframe', { class: 'legal-frame', src: url, title: title }),
    h('a', { class: 'btn small', href: url, target: '_blank', rel: 'noopener' }, 'Ouvrir en pleine page')), { type: 'legal' });
}
function exportData() {
  attempt(call('GET', '/api/export')).then(function (d) {
    if (!d) return;
    var a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })), download: 'bulle-mes-donnees.json' });
    document.body.append(a); a.click(); a.remove(); toast('Fichier bulle-mes-donnees.json enregistré');
  });
}

/* ---------------- offres Bulle+ et Bulle Pro */
var PLANS = [
  { id: 'plus', name: 'Bulle+', price: '2,99 € / mois', perks: ['Entrouvrir un message sans qu’il soit marqué comme lu', '3 thèmes exclusifs : Lilas, Soleil, Encre', 'Voir qui a regardé tes snaps (pas seulement le nombre)', 'Le badge + sur ton profil'] },
  { id: 'pro', name: 'Bulle Pro', price: '6,99 € / mois', perks: ['Tout Bulle+', 'Tes statistiques : publications, j’aime, commentaires, vues', 'Le badge PRO sur ton profil', 'Pour les créateurs, artistes et petits commerces'] }
];
function openPlans(reason) {
  openSheet('Bulle+ et Pro', h('div', { id: 'plans-body', class: 'plans' }), { type: 'plans', reason: reason });
  renderPlans();
}
function renderPlans() {
  var box = $('#plans-body'); if (!box) return; box.replaceChildren();
  var cur = S.me.plan || 'free';
  if (S.sheet && S.sheet.reason) box.append(h('p', { style: 'font-weight:700', text: S.sheet.reason }));
  PLANS.forEach(function (p) {
    var mine = cur === p.id;
    box.append(h('div', { class: 'plan' + (mine ? ' cur' : '') },
      h('div', { class: 'plan-h' }, h('h3', {}, p.name), h('span', { text: p.price })),
      h('ul', {}, p.perks.map(function (x) { return h('li', { text: x }); })),
      mine ? h('button', { class: 'btn', type: 'button', onclick: function () { setPlan('free'); } }, 'Arrêter ' + p.name)
        : h('button', { class: 'btn primary', type: 'button', onclick: function () { setPlan(p.id); } }, 'Essayer gratuitement')));
  });
  box.append(h('p', { class: 'hint', text: 'Version test : aucun paiement, l’essai est gratuit et s’arrête quand tu veux. Le vrai paiement arrivera avec le serveur.' }));
}
function setPlan(id) {
  var names = { free: '', plus: 'Bulle+', pro: 'Bulle Pro' };
  updateMe({ plan: id }, id === 'free' ? 'Offre arrêtée' : 'Bienvenue dans ' + names[id] + ' ✨').then(function (r) {
    if (!r) return; applyLook(); renderPlans(); renderProfile(); renderChatList();
  });
}
function installCard() {
  if (standalone) return null;
  if (installEvt) {
    return h('div', { class: 'card' }, h('h3', { text: 'Installer Bulle' }), h('p', { text: 'Ajoute l’app à ton écran d’accueil ou à ton bureau : elle s’ouvre en plein écran, comme une vraie application.' }),
      h('button', { class: 'btn primary', type: 'button', onclick: function () { installEvt.prompt(); installEvt.userChoice.then(function (c) { if (c.outcome === 'accepted') toast('Bulle est installée'); installEvt = null; renderProfile(); }); } }, icon('download'), 'Installer l’application'));
  }
  if (isIOS) {
    return h('div', { class: 'card' }, h('h3', { text: 'Installer sur iPhone' }),
      h('ol', {}, h('li', { text: 'Ouvre Bulle dans Safari.' }), h('li', { text: 'Touche le bouton Partager (carré avec une flèche).' }), h('li', { text: 'Choisis « Sur l’écran d’accueil ».' })));
  }
  if (!window.isSecureContext) {
    return h('div', { class: 'card' }, h('h3', { text: 'Installation indisponible ici' }), h('p', { text: 'Ouverte depuis un fichier, l’app marche mais ne s’installe pas. Pour l’installer, ouvre-la depuis son adresse en https:// (voir le guide).' }));
  }
  return h('div', { class: 'card' }, h('h3', { text: 'Installer Bulle' }), h('p', { text: 'Dans le menu du navigateur (⋮), choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».' }));
}
function confirmReset() {
  openSheet('Tout effacer ?', h('div', { class: 'form' },
    h('p', { text: 'Ton profil, tes photos, tes snaps et tes messages seront supprimés de cet appareil. Impossible de revenir en arrière.' }),
    h('button', { class: 'btn primary', type: 'button', onclick: function () { closeSheet(); logout(); } }, 'Tout effacer'),
    h('button', { class: 'btn', type: 'button', onclick: closeSheet }, 'Annuler')));
}
function editProfile() {
  S.editing = true; var w = who(S.me.id), box = $('#profile'); box.replaceChildren();
  var newAvatar = null, dropAvatar = false;
  var ni = h('input', { id: 'pf-name', maxlength: '40', value: w.name, autocomplete: 'nickname' });
  var bi = h('textarea', { id: 'pf-bio', rows: '3', maxlength: '150', placeholder: 'Quelques mots sur toi' }); bi.value = w.bio;
  var prevBox = h('span', {}, avatar(S.me.id, 88));
  var fi = h('input', { type: 'file', id: 'pf-file', accept: 'image/*', hidden: true });
  var rm = h('button', { class: 'linkish', type: 'button', hidden: !w.avatar, onclick: function () {
    newAvatar = null; dropAvatar = true; rm.hidden = true;
    prevBox.replaceChildren(h('span', { class: 'av', style: '--s:88px;--avc:' + colorOf(S.me.id) }, (w.name || '?').charAt(0).toUpperCase()));
  } }, 'Retirer la photo');
  fi.addEventListener('change', function () {
    var f = fi.files[0]; fi.value = ''; if (!f) return;
    cropPhoto(f).then(function (u) {
      if (!u) return; newAvatar = u; dropAvatar = false; rm.hidden = false;
      prevBox.replaceChildren(h('span', { class: 'av', style: '--s:88px' }, h('img', { src: u, alt: '' })));
    }, function () { toast('Cette image n’a pas pu être lue.'); });
  });
  var save = h('button', { class: 'btn primary', type: 'submit' }, 'Enregistrer');
  box.append(h('form', { class: 'pf form', onsubmit: function (e) {
    e.preventDefault(); save.disabled = true;
    var body = { name: ni.value.trim(), bio: bi.value.trim() }; if (newAvatar) body.avatar = newAvatar; else if (dropAvatar) body.removeAvatar = true;
    attempt(call('PUT', '/api/profile', body), 'Profil enregistré').then(function (r) { save.disabled = false; if (r) { S.me = r.me; S.users[r.me.id] = r.me; S.editing = false; renderAll(); } });
  } },
    h('h1', { class: 'pf-name', text: 'Ton profil' }),
    h('div', { class: 'pf-head' }, prevBox, h('div', { style: 'display:flex;flex-direction:column;align-items:flex-start;gap:8px' }, h('label', { class: 'btn small', for: 'pf-file' }, icon('image'), 'Changer la photo'), rm), fi),
    h('div', { class: 'field' }, h('label', { for: 'pf-name', text: 'Nom affiché' }), ni),
    h('div', { class: 'field' }, h('label', { for: 'pf-bio', text: 'Bio' }), bi),
    h('div', { class: 'pf-acts' }, h('button', { class: 'btn', type: 'button', onclick: function () { S.editing = false; renderProfile(); } }, 'Annuler'), save)));
}
function changePassword() {
  var cur = h('input', { id: 'pw-cur', type: 'password', autocomplete: 'current-password', required: true });
  var nx = h('input', { id: 'pw-new', type: 'password', autocomplete: 'new-password', minlength: '6', required: true });
  openSheet('Mot de passe', h('form', { class: 'form', onsubmit: function (e) { e.preventDefault(); attempt(call('PUT', '/api/password', { current: cur.value, next: nx.value }), 'Mot de passe changé').then(function (r) { if (r) closeSheet(); }); } },
    h('div', { class: 'field' }, h('label', { for: 'pw-cur', text: 'Mot de passe actuel' }), cur),
    h('div', { class: 'field' }, h('label', { for: 'pw-new', text: 'Nouveau mot de passe' }), nx, h('span', { class: 'hint', text: '6 caractères minimum.' })),
    h('button', { class: 'btn primary', type: 'submit' }, 'Changer')));
}
function logout() {
  call('POST', '/api/logout').catch(function () {}).then(function () {
    if (es) es(); es = null; S.me = null; S.users = {}; S.posts = []; S.stories = []; S.chats = []; S.seen = new Set(); LS.set('seen', []);
    $('#a-handle').value = ''; $('#a-name').value = ''; showAuth();
  });
}

/* ---------------- feuilles */
function openSheet(title, body, state) {
  var sh = $('#sheet'); S.sheet = state || { type: 'static' };
  sh.replaceChildren(h('div', { class: 'sheet-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('span', { class: 'sheet-grip' }),
    h('div', { class: 'sheet-h' }, h('h2', { text: title }), h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Fermer', onclick: closeSheet }, icon('close'))), body));
  sh.hidden = false; sh.onclick = function (e) { if (e.target === sh) closeSheet(); };
}
function closeSheet() { var sh = $('#sheet'); if (sh.hidden) return; sh.hidden = true; sh.replaceChildren(); S.sheet = null; }
function renderSheetDyn() {
  if (!S.sheet) return;
  if (S.sheet.type === 'comments') renderComments();
  if (S.sheet.type === 'settings') renderSettings();
  if (S.sheet.type === 'plans') renderPlans();
  if (S.sheet.type === 'activity') renderActivity();
  if (S.sheet.type === 'post') { var box = $('#sheet-post'); if (!box) return; var p = S.posts.find(function (x) { return x.id === S.sheet.id; }); box.replaceChildren(p ? postCard(p) : h('p', { text: 'Cette publication a été supprimée.' })); }
}
function openPost(id) { openSheet('Publication', h('div', { id: 'sheet-post' }), { type: 'post', id: id }); renderSheetDyn(); }
function openComments(id) {
  var inp = h('input', { id: 'c-in', placeholder: 'Ajoute un commentaire…', maxlength: '500', autocomplete: 'off', 'aria-label': 'Commentaire', enterkeyhint: 'send' });
  var form = h('form', { class: 'c-form', onsubmit: function (e) {
    e.preventDefault(); var t = inp.value.trim(); if (!t) return; inp.value = '';
    attempt(call('POST', '/api/posts/' + id + '/comments', { text: t })).then(function (r) { if (r) { upsert(S.posts, r.post, byNewest); renderFeed(); renderSheetDyn(); } else inp.value = t; });
  } }, avatar(S.me.id, 32), inp, h('button', { class: 'btn small primary', type: 'submit' }, 'Publier'));
  openSheet('Commentaires', h('div', { style: 'display:flex;flex-direction:column;gap:14px' }, h('div', { id: 'c-list', class: 'c-list' }), form), { type: 'comments', id: id });
  renderComments();
}
function renderComments() {
  var box = $('#c-list'); if (!box) return; var p = S.posts.find(function (x) { return x.id === S.sheet.id; }); box.replaceChildren();
  if (!p) { box.append(h('p', { text: 'Cette publication a été supprimée.' })); return; }
  function line(uid, text, at, cid) {
    var canDel = cid && (uid === S.me.id || p.by === S.me.id || S.me.admin);
    return h('div', { class: 'cm' }, avatar(uid, 32), h('div', { class: 'tx' }, h('b', { text: who(uid).name, onclick: function () { showProfile(uid); } }), text, h('small', { text: ago(at) })),
      canDel ? h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Supprimer le commentaire', onclick: function () { attempt(call('DELETE', '/api/posts/' + p.id + '/comments/' + cid)).then(function (r) { if (r) { upsert(S.posts, r.post, byNewest); renderFeed(); renderSheetDyn(); } }); } }, icon('trash')) : null);
  }
  if (p.caption) box.append(line(p.by, p.caption, p.at, null));
  if (!p.comments.length) box.append(h('p', { style: 'color:var(--muted)', text: 'Pas encore de commentaire. Lance la conversation.' }));
  p.comments.forEach(function (c) { box.append(line(c.by, c.text, c.at, c.id)); });
}
function openNewChat() {
  var inp = h('input', { class: 'search', id: 'ppl-q', type: 'search', placeholder: 'Rechercher une personne…', autocomplete: 'off', 'aria-label': 'Rechercher une personne' });
  var list = h('div', { class: 'ppl' });
  function draw() {
    var q = inp.value.trim().toLowerCase(); list.replaceChildren();
    if (!q) list.append(h('button', { class: 'ppl-row', type: 'button', onclick: function () { openChat(visibleChats().find(function (c) { return c.id === 'general'; })); } }, groupAvatar(44), h('span', { class: 'nm' }, h('b', { text: 'Le salon' }), h('small', { text: 'Ouvert à tout le monde' }))));
    var ids = Object.keys(S.users).filter(function (id) { if (id === S.me.id) return false; var w = who(id); return !q || w.name.toLowerCase().indexOf(q) >= 0 || w.handle.indexOf(q) >= 0; });
    ids.sort(function (a, b) { return (S.online.has(b) - S.online.has(a)) || who(a).name.localeCompare(who(b).name); });
    if (!ids.length) list.append(h('p', { style: 'color:var(--muted);padding:8px 10px', text: q ? 'Personne ne correspond.' : 'Personne d’autre pour l’instant. Invite tes amis à créer un compte.' }));
    ids.forEach(function (id) { var w = who(id); list.append(h('button', { class: 'ppl-row', type: 'button', onclick: function () { openChat(dmFor(id)); } }, avatar(id, 44, true), h('span', { class: 'nm' }, h('b', { text: w.name }), h('small', { text: '@' + w.handle + (S.online.has(id) ? ' · en ligne' : '') })))); });
  }
  inp.addEventListener('input', draw); draw();
  openSheet('Nouveau message', h('div', { style: 'display:flex;flex-direction:column;gap:12px' }, inp, list));
}
/* filtres photo (calculés pixel par pixel : même rendu sur tous les téléphones) */
var FILTERS = [
  { id: 'none', name: 'Normal' },
  { id: 'rose', name: 'Rosé', sat: 1.05, tint: [18, -6, 10] },
  { id: 'eclat', name: 'Éclat', sat: 1.35, con: 1.12 },
  { id: 'chaud', name: 'Chaud', sat: 1.1, tint: [18, 5, -16] },
  { id: 'froid', name: 'Froid', sat: 0.95, tint: [-14, 2, 20] },
  { id: 'vintage', name: 'Vintage', sepia: 0.55, con: 0.9, tint: [10, 2, -8] },
  { id: 'noir', name: 'Noir', sat: 0, con: 1.2 }
];
function filterPixels(d, f) {
  var s = f.sat == null ? 1 : f.sat, c = f.con || 1, sp = f.sepia || 0, t = f.tint || [0, 0, 0];
  for (var i = 0; i < d.length; i += 4) {
    var r = d[i], g = d[i + 1], b = d[i + 2], l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * s; g = l + (g - l) * s; b = l + (b - l) * s;
    if (sp) { var sr = 0.393 * r + 0.769 * g + 0.189 * b, sg = 0.349 * r + 0.686 * g + 0.168 * b, sb = 0.272 * r + 0.534 * g + 0.131 * b; r += (sr - r) * sp; g += (sg - g) * sp; b += (sb - b) * sp; }
    d[i] = (r - 128) * c + 128 + t[0]; d[i + 1] = (g - 128) * c + 128 + t[1]; d[i + 2] = (b - 128) * c + 128 + t[2];
  }
}
function applyFilter(src, fid, max, q) {
  var f = FILTERS.find(function (x) { return x.id === fid; });
  return new Promise(function (res, rej) {
    var im = new Image(); im.onerror = rej;
    im.onload = function () {
      var k = Math.min(1, (max || 1e5) / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
      if (f && f.id !== 'none') { var px = x.getImageData(0, 0, c.width, c.height); filterPixels(px.data, f); x.putImageData(px, 0, 0); }
      res(c.toDataURL('image/jpeg', q || 0.86));
    };
    im.src = src;
  });
}
function openComposer(mode) {
  var st = { mode: mode || 'post', file: null, url: null, base: null, shown: null, filter: 'none', thumbs: {} };
  var frow = h('div', { class: 'filters', role: 'radiogroup', 'aria-label': 'Filtre' });
  function drawFilters() {
    frow.replaceChildren(); frow.hidden = !st.base;
    FILTERS.forEach(function (f) {
      frow.append(h('button', { type: 'button', role: 'radio', class: 'flt', 'aria-checked': String(st.filter === f.id), onclick: function () {
        st.filter = f.id; drawFilters();
        applyFilter(st.base, f.id, 900, 0.8).then(function (u) { if (st.filter === f.id) { st.shown = u; sync(); } });
      } }, h('span', { class: 'flt-im' }, st.thumbs[f.id] ? h('img', { src: st.thumbs[f.id], alt: '' }) : null), h('small', { text: f.name })));
    });
  }
  var seg = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Type de publication' });
  var drop = h('label', { class: 'drop', for: 'cmp-pick' });
  var pick = h('input', { type: 'file', accept: 'image/*', id: 'cmp-pick', hidden: true });
  var cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', id: 'cmp-cam', hidden: true });
  var cap = h('textarea', { id: 'cmp-cap', rows: '3', maxlength: '2200', placeholder: 'Écris une légende…' });
  var stx = h('input', { id: 'cmp-snap', maxlength: '80', placeholder: 'Texte sur la photo (facultatif)', autocomplete: 'off' });
  var capField = h('div', { class: 'field' }, h('label', { for: 'cmp-cap', text: 'Légende' }), cap);
  // public du snap : tout le monde, ou seulement tes amis proches (contour vert)
  var aud = h('div', { class: 'aud', role: 'radiogroup', 'aria-label': 'Qui peut voir ce snap' });
  function drawAud() {
    var n = closeList().length; if (!n) st.close = false;
    aud.replaceChildren(h('div', { class: 'aud-row' },
      h('button', { type: 'button', role: 'radio', class: 'aud-b', 'aria-checked': String(!st.close), onclick: function () { st.close = false; drawAud(); } }, 'Tout le monde'),
      h('button', { type: 'button', role: 'radio', class: 'aud-b close', 'aria-checked': String(!!st.close), onclick: function () { if (!n) { st.pick = true; drawAud(); return; } st.close = true; drawAud(); } }, icon('star'), 'Amis proches' + (n ? ' (' + n + ')' : ''))),
      h('button', { type: 'button', class: 'linkish', onclick: function () { st.pick = !st.pick; drawAud(); } }, st.pick ? 'Fermer la liste' : n ? 'Modifier la liste' : 'Choisir mes amis proches'),
      st.pick ? closePicker(function () { if (closeList().length && !st.close) st.close = true; drawAud(); }) : null);
  }
  drawAud();
  var snapField = h('div', { class: 'field' }, h('label', { for: 'cmp-snap', text: 'Texte du snap' }), stx, aud, h('span', { class: 'hint', text: 'Visible 24 h, puis il disparaît. Les amis proches voient un contour vert.' }));
  var go = h('button', { class: 'btn primary', type: 'submit' }, 'Partager');
  function setFile(f) {
    if (!f || !/^image\//.test(f.type)) { if (f) toast('Choisis une image (JPEG, PNG…).'); return; }
    if (st.url) URL.revokeObjectURL(st.url); st.file = f; st.url = URL.createObjectURL(f); st.base = null; st.shown = null; st.filter = 'none'; st.thumbs = {}; sync(); drawFilters();
    shrink(f, 900, 0.82).then(function (base) {
      if (st.file !== f) return; st.base = base; st.shown = base; drawFilters();
      FILTERS.forEach(function (x) { applyFilter(base, x.id, 120, 0.7).then(function (u) { if (st.file !== f) return; st.thumbs[x.id] = u; drawFilters(); }); });
    }).catch(function () {});
  }
  pick.addEventListener('change', function () { setFile(pick.files[0]); });
  cam.addEventListener('change', function () { setFile(cam.files[0]); });
  stx.addEventListener('input', sync);
  drop.addEventListener('dragover', function (e) { e.preventDefault(); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); setFile(e.dataTransfer.files[0]); });
  function sync() {
    seg.replaceChildren();
    [['post', 'Publication'], ['snap', 'Snap · 24 h']].forEach(function (m) { seg.append(h('button', { type: 'button', role: 'tab', 'aria-selected': String(st.mode === m[0]), onclick: function () { st.mode = m[0]; sync(); } }, m[1])); });
    drop.className = 'drop' + (st.mode === 'snap' ? ' snap' : '') + (st.url ? ' has' : ''); drop.replaceChildren();
    if (st.url) { drop.append(h('img', { src: st.shown || st.url, alt: 'Aperçu' })); if (st.mode === 'snap' && stx.value.trim()) drop.append(h('div', { class: 'snapcap', text: stx.value.trim() })); }
    else drop.append(h('span', { class: 'ph' }, icon('image'), h('span', { text: 'Choisis une photo' })));
    capField.hidden = st.mode !== 'post'; snapField.hidden = st.mode !== 'snap';
    go.textContent = st.mode === 'post' ? 'Partager' : 'Envoyer le snap';
  }
  var form = h('form', { class: 'form', onsubmit: function (e) {
    e.preventDefault(); if (!st.file) { toast('Choisis une photo d’abord.'); return; }
    go.disabled = true; var label = go.textContent; go.textContent = 'Envoi…';
    shrink(st.file).then(function (img) { return st.filter === 'none' ? img : applyFilter(img, st.filter, 0, 0.84); }).then(function (img) {
      return st.mode === 'post'
        ? attempt(call('POST', '/api/posts', { image: img, caption: cap.value.trim() }), 'Publié').then(function (r) { if (r) { upsert(S.posts, r.post, byNewest); } return r; })
        : attempt(call('POST', '/api/stories', { image: img, text: stx.value.trim(), close: !!st.close }), st.close ? 'Snap envoyé à tes amis proches' : 'Snap envoyé · visible 24 h').then(function (r) { if (r) { upsert(S.stories, r.story, byOldest); } return r; });
    }, function () { toast('Cette image n’a pas pu être lue. Essaie un JPEG ou un PNG.'); return false; })
      .then(function (r) { go.disabled = false; go.textContent = label; if (r) { closeSheet(); if (S.openChat) closeThread(); switchTab('feed'); } });
  } }, seg, drop, frow, pick, cam, h('div', { class: 'pick-row' }, h('label', { class: 'btn small', for: 'cmp-pick' }, icon('image'), 'Galerie'), h('label', { class: 'btn small', for: 'cmp-cam' }, icon('camera'), 'Appareil photo')), capField, snapField, go);
  sync(); drawFilters(); openSheet('Créer', form);
}

/* ---------------- snaps */
var SVs = null;
function openStories(groups, gi) {
  var g = groups[gi]; if (!g) return;
  var si = g.items.findIndex(function (s) { return !S.seen.has(s.id); });
  SVs = { groups: groups, gi: gi, si: si < 0 ? 0 : si, elapsed: 0, last: performance.now(), paused: false, raf: 0, down: 0 };
  $('#story').hidden = false; buildStory(); SVs.raf = requestAnimationFrame(tick);
}
function closeStory() { if (!SVs) return; cancelAnimationFrame(SVs.raf); SVs = null; var r = $('#story'); r.hidden = true; r.replaceChildren(); renderFeed(); renderChatList(); if (S.openChat) { renderThreadHead(); renderMsgs(); } if (S.tab === 'profile') renderProfile(); if (S.tab === 'map' && MAP.map) drawPlaces(); }
function markSeen(id) { if (S.seen.has(id)) return; S.seen.add(id); LS.set('seen', Array.from(S.seen).slice(-600)); }
function buildStory() {
  var g = SVs.groups[SVs.gi], s = g.items[SVs.si]; if (!s) { closeStory(); return; }
  markSeen(s.id); SVs.elapsed = 0; SVs.last = performance.now(); SVs.paused = false; SVs.menu = false;
  var mine = g.uid === S.me.id, canDel = mine || S.me.admin, w = who(g.uid);
  var root = $('#story');

  // en-tête : avatar rond, nom, heure — puis pause, menu, fermer
  var pauseBtn = h('button', { class: 'sv-ic', type: 'button' });
  function syncPause() { pauseBtn.replaceChildren(icon(SVs.hold ? 'play' : 'pause')); pauseBtn.setAttribute('aria-label', SVs.hold ? 'Reprendre' : 'Mettre en pause'); }
  pauseBtn.addEventListener('click', function () { SVs.hold = !SVs.hold; SVs.last = performance.now(); syncPause(); });
  syncPause();
  var menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } SVs.menu = false; SVs.last = performance.now(); }
  var moreBtn = h('button', { class: 'sv-ic dots', type: 'button', 'aria-label': 'Plus d’options', onclick: function () {
    if (menu) { closeMenu(); return; }
    SVs.menu = true;
    var del = canDel ? h('button', { class: 'danger', type: 'button', onclick: function () {
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Confirmer la suppression'; return; }
      attempt(call('DELETE', '/api/stories/' + s.id), 'Snap supprimé').then(function (r) { if (r) { S.stories = S.stories.filter(function (x) { return x.id !== s.id; }); closeStory(); } });
    } }, 'Supprimer ce snap') : null;
    menu = h('div', { class: 'sv-menu', role: 'menu' }, del,
      !mine ? h('button', { type: 'button', onclick: function () { closeStory(); showProfile(g.uid); } }, 'Voir le profil') : null,
      h('button', { type: 'button', onclick: closeMenu }, 'Annuler'));
    root.append(menu);
  } }, icon('more'));
  var top = h('div', { class: 'sv-top' },
    h('div', { class: 'sv-bars' }, g.items.map(function (_, i) { return h('span', { class: 'sv-bar' }, h('i', { style: 'width:' + (i < SVs.si ? 100 : 0) + '%' })); })),
    h('div', { class: 'sv-head' },
      h('button', { class: 'sv-who', type: 'button', onclick: function () { if (!mine) { closeStory(); showProfile(g.uid); } } }, avatar(g.uid, 32), h('b', { text: mine ? 'Ton snap' : (w.handle || w.name) }), h('time', { text: ago(s.at) }), s.close ? h('span', { class: 'cf-tag' }, icon('star'), 'Amis proches') : null),
      pauseBtn, moreBtn,
      h('button', { class: 'sv-ic', type: 'button', 'aria-label': 'Fermer', onclick: closeStory }, icon('close'))));

  // photo dans une carte arrondie, texte du snap en dessous
  var stage = h('div', { class: 'sv-stage' }, h('div', { class: 'sv-card' }, h('img', { src: s.img, alt: 'Snap de ' + w.name })), s.text ? h('p', { class: 'sv-cap', text: s.text }) : null);
  stage.addEventListener('pointerdown', function () { if (menu) return; SVs.paused = true; SVs.down = Date.now(); });
  stage.addEventListener('pointerup', function (e) {
    if (!SVs) return; if (menu) { closeMenu(); return; }
    SVs.paused = false; SVs.last = performance.now();
    if (Date.now() - SVs.down < 260) { var r = stage.getBoundingClientRect(); if (e.clientX - r.left < r.width / 3) prevStory(); else nextStory(); }
  });
  stage.addEventListener('pointercancel', function () { if (SVs) { SVs.paused = false; SVs.last = performance.now(); } });

  // bas : réponse en pilule, cœur, envoyer
  var foot;
  if (mine) {
    var left = Math.max(1, Math.round((s.at + DAY - Date.now()) / 36e5));
    var cur = S.stories.find(function (x) { return x.id === s.id; }) || s, vs = cur.views || [];
    // nombre de vues pour tout le monde, les noms avec Bulle+
    var seenTxt = !vs.length ? 'Pas encore vu' : hasPlus() ? 'Vu par ' + vs.map(function (u) { return who(u).name; }).join(', ') : 'Vu par ' + vs.length + (vs.length > 1 ? ' personnes' : ' personne');
    foot = h('div', { class: 'sv-foot' }, h('span', { class: 'sv-note' }, icon('eye'), ' ', seenTxt, ' · disparaît dans ' + left + ' h'),
      vs.length && !hasPlus() ? h('button', { class: 'sv-ic', type: 'button', 'aria-label': 'Voir qui a regardé (Bulle+)', onclick: function () { closeStory(); openPlans('Voir qui a regardé tes snaps, c’est avec Bulle+.'); } }, h('span', { class: 'tier', text: '+' })) : null);
  } else {
    var liked = LS.get('storyLikes', []).indexOf(s.id) >= 0;
    var ri = h('input', { id: 'sv-reply', class: 'sv-reply', placeholder: 'Répondre à ' + (w.handle || w.name) + '…', maxlength: '500', autocomplete: 'off', 'aria-label': 'Réponse au snap', enterkeyhint: 'send' });
    // réactions rapides façon Instagram : elles apparaissent quand on commence à répondre
    var quick = h('div', { class: 'sv-quick', hidden: true }, ['😂', '😮', '😍', '😢', '👏', '🔥'].map(function (e) {
      return h('button', { type: 'button', class: 'emo', 'aria-label': 'Réagir ' + e, onpointerdown: function (ev) { ev.preventDefault(); }, onclick: function (ev) {
        emojiBurst(ev.clientX || 0, ev.clientY || 0, e); ri.blur();
        sendMsg(dmFor(g.uid), { text: e, reply: 'snap' }).then(function (ok) { if (ok) toast('Réaction envoyée à ' + w.name); });
      } }, e);
    }));
    ri.addEventListener('focus', function () { SVs.paused = true; quick.hidden = false; });
    ri.addEventListener('blur', function () { quick.hidden = true; if (SVs) { SVs.paused = false; SVs.last = performance.now(); } });
    var heart = h('button', { class: 'sv-ic' + (liked ? ' liked' : ''), type: 'button', 'aria-pressed': String(liked), 'aria-label': 'J’aime ce snap', onclick: function (ev) {
      if (liked) return;
      liked = true; heart.classList.add('liked'); heart.setAttribute('aria-pressed', 'true');
      var l = LS.get('storyLikes', []); l.push(s.id); LS.set('storyLikes', l.slice(-500));
      var r = heart.getBoundingClientRect(); burst(r.left + r.width / 2, r.top);
      sendMsg(dmFor(g.uid), { text: '❤️', reply: 'snap' });
    } }, icon('heart'));
    var send = function () { var t = ri.value.trim(); if (!t) { ri.focus(); return; } ri.value = ''; ri.blur(); sendMsg(dmFor(g.uid), { text: t, reply: 'snap' }).then(function (ok) { if (ok) toast('Réponse envoyée à ' + w.name); }); };
    foot = h('form', { class: 'sv-foot', onsubmit: function (e) { e.preventDefault(); send(); } }, quick, ri, heart,
      h('button', { class: 'sv-ic', type: 'submit', 'aria-label': 'Envoyer' }, icon('send')));
  }
  root.replaceChildren(h('img', { class: 'sv-bg', src: s.img, alt: '' }), top, stage, foot);
}
function tick(now) {
  if (!SVs) return;
  var dt = now - SVs.last; SVs.last = now; if (!SVs.paused && !SVs.hold && !SVs.menu) SVs.elapsed += dt;
  var bar = $$('.sv-bar i')[SVs.si]; if (bar) bar.style.width = Math.min(100, SVs.elapsed / 5000 * 100) + '%';
  if (SVs.elapsed >= 5000) { nextStory(); if (!SVs) return; }
  SVs.raf = requestAnimationFrame(tick);
}
function nextStory() { var g = SVs.groups[SVs.gi]; if (SVs.si < g.items.length - 1) SVs.si++; else if (SVs.gi < SVs.groups.length - 1) { SVs.gi++; SVs.si = 0; } else { closeStory(); return; } buildStory(); }
function prevStory() { if (SVs.si > 0) SVs.si--; else if (SVs.gi > 0) { SVs.gi--; SVs.si = 0; } buildStory(); }

/* ---------------- onglets */
function switchTab(t) {
  S.tab = t;
  ['feed', 'map', 'chat', 'profile'].forEach(function (v) { $('#v-' + v).hidden = v !== t; });
  if (t !== 'profile') S.editing = false;
  $('#screen').classList.toggle('flush', t === 'map');
  renderNav(); if (t === 'profile') renderProfile();
  if (t === 'map') showMap();
  $('#screen').scrollTop = 0;
}

/* ---------------- carte façon Snap Map (Leaflet + fonds de carte CARTO / OpenStreetMap) */
var MAP = { map: null, tiles: null, layer: null, places: [], pos: null, loading: null, sel: null, intro: false };
var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (!MAP.loading) MAP.loading = new Promise(function (res, rej) {
    document.head.append(h('link', { rel: 'stylesheet', href: LEAFLET + 'leaflet.css', crossorigin: '' }));
    var s = h('script', { src: LEAFLET + 'leaflet.js', crossorigin: '' });
    s.onload = res; s.onerror = function () { MAP.loading = null; s.remove(); rej(new Error('leaflet')); };
    document.head.append(s);
  });
  return MAP.loading;
}
function showMap() {
  var box = $('#map');
  if (MAP.map) { MAP.map.invalidateSize(); locate(); return; }
  box.replaceChildren(h('div', { class: 'map-wait' }, h('span', { class: 'logo xl' }), h('p', { text: 'Chargement de la carte…' })));
  loadLeaflet().then(initMap, function () {
    box.replaceChildren(h('div', { class: 'map-wait' }, h('h2', { class: 'pf-name', text: 'Carte indisponible' }), h('p', { text: 'La carte a besoin d’Internet. Reconnecte-toi puis réessaie.' }), h('button', { class: 'btn', type: 'button', onclick: showMap }, 'Réessayer')));
  });
}
function initMap() {
  var box = $('#map'), el = h('div', { class: 'map-canvas' });
  box.replaceChildren(el, h('div', { class: 'map-ui', id: 'map-ui' }));
  MAP.map = L.map(el, { zoomControl: false, center: [45.764, 4.8357], zoom: 13, minZoom: 3 });
  MAP.map.attributionControl.setPrefix(false);
  setTiles();
  MAP.layer = L.layerGroup().addTo(MAP.map);
  MAP.map.on('click', function () { if (MAP.sel) { MAP.sel = null; renderMapUI(); } });
  renderMapUI();
  locate();
}
// Fond de carte OpenStreetMap (gratuit, sans clé). Les couleurs du thème et le mode nuit sont appliqués en CSS.
// Pour un vrai lancement avec beaucoup d'utilisateurs, il faudra un fournisseur de tuiles dédié (MapTiler, Stadia…).
function setTiles() {
  if (!window.L || !MAP.map || MAP.tiles) return;
  MAP.tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a>'
  }).addTo(MAP.map);
}
// Position : demandée seulement après un choix clair (Activer / Mode fantôme)
function locate(force) {
  if (!MAP.map) return;
  var pv = privacy();
  if (!LS.get('mapAsked', false) && !force) { MAP.intro = true; renderMapUI(); refreshPlaces(); return; }
  MAP.intro = false;
  if (pv.ghost || !navigator.geolocation) { refreshPlaces(); return; }
  navigator.geolocation.getCurrentPosition(function (p) {
    var first = !MAP.pos; MAP.pos = [p.coords.latitude, p.coords.longitude];
    refreshPlaces(); if (first || force) MAP.map.setView(MAP.pos, 14);
  }, function () { toast('Position indisponible : autorise-la dans les réglages du navigateur.'); refreshPlaces(); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 });
}
function refreshPlaces() {
  if (!MAP.map) return;
  var body = MAP.pos && !privacy().ghost ? { lat: MAP.pos[0], lng: MAP.pos[1] } : {};
  call('POST', '/api/location', body).then(function (r) {
    MAP.places = r.places || [];
    if (!MAP.pos && r.base && !MAP.centered) { MAP.map.setView(r.base, 13); MAP.centered = true; }
    drawPlaces(); renderMapUI();
  }, function () { /* hors ligne : on garde l'affichage */ });
}
function km(a, b) { var R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r; var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
function placeLine(p) {
  var bits = [];
  if (MAP.pos) { var d = km(MAP.pos, [p.lat, p.lng]); bits.push(d < 1 ? Math.round(d * 1000 / 50) * 50 + ' m' : d.toFixed(1).replace('.', ',') + ' km'); }
  bits.push(ago(p.at) === 'à l’instant' ? 'à l’instant' : 'il y a ' + ago(p.at));
  return bits.join(' · ');
}
function drawPlaces() {
  if (!MAP.layer) return;
  MAP.layer.clearLayers();
  var gs = storyGroups(), ghost = privacy().ghost;
  function marker(uid, ll, extra) {
    var live = gs.some(function (g) { return g.uid === uid && g.unseen && uid !== S.me.id; });
    var el = h('div', { class: 'mk' + extra }, h('span', { class: 'mk-ring' + (live ? ' live' : '') }, avatar(uid, 46)), h('span', { class: 'mk-name', text: uid === S.me.id ? (ghost ? 'Toi · fantôme' : 'Toi') : who(uid).name }));
    var mk = L.marker(ll, { icon: L.divIcon({ html: el, className: 'mk-wrap', iconSize: [70, 80], iconAnchor: [35, 56] }), riseOnHover: true, title: who(uid).name, alt: who(uid).name });
    mk.on('click', function (e) { L.DomEvent.stopPropagation(e); MAP.sel = uid === S.me.id ? null : uid; renderMapUI(); });
    MAP.layer.addLayer(mk);
  }
  MAP.places.forEach(function (p) { marker(p.uid, [p.lat, p.lng], ''); });
  if (MAP.pos) marker(S.me.id, MAP.pos, ' me' + (ghost ? ' ghost' : ''));
}
function renderMapUI() {
  var ui = $('#map-ui'); if (!ui) return; ui.replaceChildren();
  var ghost = privacy().ghost;
  ui.append(h('div', { class: 'map-top' }, h('span', { class: 'map-title', text: 'Carte' }),
    h('div', { class: 'map-btns' },
      h('button', { class: 'map-btn', type: 'button', 'aria-pressed': String(ghost), 'aria-label': ghost ? 'Désactiver le mode fantôme' : 'Activer le mode fantôme', onclick: function () {
        setPrivacy({ ghost: !ghost }).then(function (r) {
          if (!r) return;
          toast(!ghost ? 'Mode fantôme activé : tes amis ne te voient plus' : 'Tes amis voient de nouveau ta position');
          if (ghost) { LS.set('mapAsked', true); locate(true); } // on vient de sortir du mode fantôme
          renderMapUI(); drawPlaces();
        });
      } }, icon('ghost')),
      h('button', { class: 'map-btn', type: 'button', 'aria-label': 'Me localiser', onclick: function () { LS.set('mapAsked', true); if (MAP.pos) MAP.map.setView(MAP.pos, 15); locate(true); } }, icon('locate')))));
  var bottom = h('div', { class: 'map-bottom' }); ui.append(bottom);
  if (MAP.intro) {
    bottom.append(h('div', { class: 'map-card' }, h('div', { class: 'who' }, h('span', { class: 'nm' }, h('b', { text: 'Retrouve tes amis' }), h('small', { text: 'Ta position n’est visible que par tes amis, et tu peux te cacher quand tu veux.' }))),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: function () { LS.set('mapAsked', true); MAP.intro = false; setPrivacy({ ghost: true }).then(function () { renderMapUI(); }); } }, icon('ghost'), 'Mode fantôme'),
        h('button', { class: 'btn primary', type: 'button', onclick: function () { LS.set('mapAsked', true); MAP.intro = false; (privacy().ghost ? setPrivacy({ ghost: false }) : Promise.resolve()).then(function () { locate(true); renderMapUI(); }); } }, icon('locate'), 'Partager'))));
    return;
  }
  if (MAP.sel) {
    var uid = MAP.sel, p = MAP.places.find(function (x) { return x.uid === uid; });
    var g = storyGroups(), gi = g.findIndex(function (x) { return x.uid === uid; });
    bottom.append(h('div', { class: 'map-card' },
      h('div', { class: 'who' }, avatar(uid, 52), h('span', { class: 'nm' }, h('b', { text: who(uid).name }), h('small', { text: p ? placeLine(p) : '' }))),
      h('div', { class: 'row' },
        gi >= 0 ? h('button', { class: 'btn', type: 'button', onclick: function () { openStories(g, gi); } }, 'Ses snaps') : h('button', { class: 'btn', type: 'button', onclick: function () { showProfile(uid); } }, 'Profil'),
        h('button', { class: 'btn primary', type: 'button', onclick: function () { switchTab('chat'); openChat(dmFor(uid)); } }, icon('send'), 'Message'))));
    return;
  }
  if (MAP.places.length) {
    bottom.append(h('div', { class: 'map-people' }, MAP.places.map(function (p) {
      return h('button', { class: 'chip', type: 'button', onclick: function () { MAP.sel = p.uid; MAP.map.flyTo([p.lat, p.lng], 15, { duration: 0.6 }); renderMapUI(); } }, avatar(p.uid, 34), h('span', { class: 'nm' }, h('b', { text: who(p.uid).name }), h('small', { text: placeLine(p) })));
    })));
  }
}
$$('[data-tab]').forEach(function (el) { el.addEventListener('click', function () { var t = el.getAttribute('data-tab'); if (t === 'profile') S.viewUid = null; if (S.openChat) closeThread(); switchTab(t); }); });
$$('[data-create]').forEach(function (el) { el.addEventListener('click', function () { openComposer('post'); }); });
$$('[data-snap]').forEach(function (el) { el.addEventListener('click', function () { openComposer('snap'); }); });
$('#brand').addEventListener('click', function () { if (S.tab === 'feed') $('#screen').scrollTo({ top: 0, behavior: 'smooth' }); else switchTab('feed'); });
$('#newchat').addEventListener('click', openNewChat);
$('#th-back').addEventListener('click', closeThread);
var lastTypingPing = 0;
$('#th-mic').addEventListener('click', startRec);
$('#rec-cancel').addEventListener('click', function () { stopRec(false); toast('Message vocal supprimé'); });
$('#th-in').addEventListener('input', function () {
  syncCompose();
  if (!S.openChat || !this.value) return; var now = Date.now();
  if (now - lastTypingPing > 2500) { lastTypingPing = now; call('POST', '/api/typing', { chatId: S.openChat.id }).catch(function () {}); }
});
$('#th-form').addEventListener('submit', function (e) {
  e.preventDefault(); if (REC) { stopRec(true); return; }
  var inp = $('#th-in'), t = inp.value.trim(); if (!t || !S.openChat) return;
  inp.value = ''; lastTypingPing = 0; syncCompose();
  var q = S.quote; S.quote = null; renderQuote();
  sendMsg(S.openChat, { text: t, quote: q ? q.id : undefined }).then(function (ok) { if (!ok) { inp.value = t; S.quote = q; renderQuote(); } });
});
$('#th-file').addEventListener('change', function () {
  var f = this.files[0]; this.value = ''; if (!f || !S.openChat) return;
  var chat = S.openChat; toast('Envoi de la photo…');
  shrink(f, 1440).then(function (img) { return sendMsg(chat, { image: img }); }, function () { toast('Cette image n’a pas pu être envoyée.'); });
});
$('#th-snap').addEventListener('change', function () {
  var f = this.files[0]; this.value = ''; if (!f || !S.openChat) return;
  var chat = S.openChat, name = chatTitle(chat);
  shrink(f, 1280).then(function (img) { return sendMsg(chat, { image: img, once: true }); }, function () { toast('Cette image n’a pas pu être envoyée.'); return false; })
    .then(function (ok) { if (ok) toast('Snap envoyé : ' + name + ' pourra le voir une seule fois'); });
});
$('#act-btn').addEventListener('click', openActivity);
document.addEventListener('keydown', function (e) {
  if (SVs) { if (e.key === 'Escape') closeStory(); else if (document.activeElement.id !== 'sv-reply') { if (e.key === 'ArrowRight') nextStory(); else if (e.key === 'ArrowLeft') prevStory(); } return; }
  if (e.key === 'Escape') { var v = $('.viewer, .snapview'); if (v) v.click(); else if (!$('#sheet').hidden) closeSheet(); else if (S.openChat) closeThread(); }
});
setInterval(function () { if (S.me && !document.hidden && !SVs) { var a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName)) return; renderFeed(); renderChatList(); } }, 60000);

/* ================================================================ temps réel */
function connectEvents() {
  if (es) es();
  var handlers = {};
  es = window.BulleLocal.subscribe(function (type, d) { if (handlers[type]) handlers[type](d); });
  function on(type, fn) { handlers[type] = fn; }
  on('storage-error', function () { toast('Espace de stockage plein : supprime quelques photos.'); });
  on('user', function (u) { S.users[u.id] = u; if (u.id === S.me.id) { S.me = u; applyLook(); } renderAll(); });
  on('post', function (p) { upsert(S.posts, p, byNewest); renderFeed(); renderSheetDyn(); if (S.tab === 'profile') renderProfile(); });
  on('post-del', function (d) { removePost(d.id); });
  on('story', function (s) { upsert(S.stories, s, byOldest); if (!SVs) renderFeed(); });
  on('story-del', function (d) { S.stories = S.stories.filter(function (x) { return x.id !== d.id; }); if (!SVs) renderFeed(); });
  on('chat', function (c) { upsert(S.chats, c); if (S.openChat && S.openChat.id === c.id) { S.openChat = c; markRead(c.id); renderMsgs(); } renderChatList(); renderNav(); });
  on('msgupd', function (d) {
    if (!S.openChat || S.openChat.id !== d.chatId) return;
    var i = S.msgs.findIndex(function (x) { return x.id === d.msg.id; }); if (i >= 0) { S.msgs[i] = d.msg; renderMsgs(); }
  });
  on('note', function (n) { setNote(n); });
  on('score', function (d) { if (S.users[d.uid]) S.users[d.uid].score = d.score; if (d.uid === S.me.id) S.me.score = d.score; if (S.tab === 'profile') renderProfile(); });
  on('activity', function (a) { S.activity.unshift(a); renderActDot(); if (S.sheet && S.sheet.type === 'activity') renderActivity(); });
  on('presence', function (d) { S.online = new Set(d.online || []); renderLight(); });
  on('typing', function (d) { var t = S.typing[d.chatId] = S.typing[d.chatId] || {}; t[d.by] = Date.now() + 4000; renderLight(); setTimeout(renderLight, 4100); });
  on('msg', function (d) {
    var m = d.msg; if (S.typing[d.chatId]) delete S.typing[d.chatId][m.by];
    var open = S.openChat && S.openChat.id === d.chatId;
    if (open && !S.msgs.some(function (x) { return x.id === m.id; })) { S.msgs.push(m); renderMsgs(); renderTyping(); }
    if (m.by !== S.me.id && document.hidden) notify(d.chatId, m);
    else if (m.by !== S.me.id && !open) headsUp(d.chatId, m);
  });
}
function msgPreview(m) { return m.once ? '📸 T’a envoyé un snap' : m.audio ? '🎤 Message vocal (' + fmtDur(m.dur) + ')' : m.reply === 'note' ? 'A répondu à ta note : ' + m.text : (m.text || '📷 Photo'); }
function msgTitle(chatId, m) { var c = S.chats.find(function (x) { return x.id === chatId; }); return c && c.kind === 'group' ? 'Le salon · ' + who(m.by).name : who(m.by).name; }
function notify(chatId, m) {
  if (!PREFS.notif || !('Notification' in window) || Notification.permission !== 'granted' || !swReg) return;
  swReg.showNotification(msgTitle(chatId, m), { body: PREFS.preview ? msgPreview(m) : 'Nouveau message', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: chatId, renotify: true, data: { chatId: chatId } }).catch(function () {});
}
// bandeau en haut de l'écran quand l'app est ouverte sur autre chose
var huT = null;
function headsUp(chatId, m) {
  if (!PREFS.heads) return;
  var el = $('#hu'), c = visibleChats().find(function (x) { return x.id === chatId; });
  el.replaceChildren(h('button', { class: 'hu-in', type: 'button', onclick: function () { el.hidden = true; if (!c) return; if (SVs) closeStory(); closeSheet(); switchTab('chat'); openChat(c); } },
    avatar(m.by, 40), h('span', { class: 't' }, h('b', { text: msgTitle(chatId, m) }), h('span', { text: PREFS.preview ? msgPreview(m) : 'Nouveau message' }))));
  el.hidden = false; clearTimeout(huT); huT = setTimeout(function () { el.hidden = true; }, 4500);
  if (navigator.vibrate) navigator.vibrate(18);
}

/* ================================================================ connexion */
$('#a-handle').addEventListener('input', function () { var v = this.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); if (v !== this.value) this.value = v; });
$('#auth-form').addEventListener('submit', function (e) {
  e.preventDefault(); var go = $('#auth-go'), err = $('#auth-err'); go.disabled = true; err.hidden = true;
  call('POST', '/api/register', { handle: $('#a-handle').value.trim(), name: $('#a-name').value.trim(), terms: $('#a-ok').checked })
    .then(function () { return start().then(function () { toast('Bienvenue sur Bulle !'); }); }, function (e2) { err.textContent = e2.message; err.hidden = false; })
    .then(function () { go.disabled = false; });
});
$$('[data-legal]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openLegal(a.getAttribute('href'), a.textContent.charAt(0).toUpperCase() + a.textContent.slice(1)); }); });
function showAuth() { if (es) { es(); es = null; } $('#splash').hidden = true; $('#shell').hidden = true; $('#auth').hidden = false; closeSheet(); closeStory(); $('#a-handle').focus(); }
function showSplash(msg, retry) { $('#splash-msg').textContent = msg || ''; $('#splash-retry').hidden = !retry; $('#splash').hidden = false; }
$('#splash-retry').addEventListener('click', function () { showSplash('Connexion…'); start(); });

function start() {
  return call('GET', '/api/state').then(function (st) {
    applyState(st); applyLook();
    $('#auth').hidden = true; $('#splash').hidden = true; $('#shell').hidden = false;
    renderAll(); connectEvents();
    var q = new URLSearchParams(location.search), tabs = ['feed', 'map', 'chat', 'profile'];
    if (q.get('tab')) switchTab(tabs.indexOf(q.get('tab')) >= 0 ? q.get('tab') : 'feed');
    if (q.get('create')) openComposer(q.get('create') === 'snap' ? 'snap' : 'post');
    var cid = q.get('chat'); if (cid) { var c = visibleChats().find(function (x) { return x.id === cid; }); if (c) { switchTab('chat'); openChat(c); } }
    if (location.search) history.replaceState(null, '', location.pathname);
  }, function (e) {
    if (e.status === 401) showAuth();
    else showSplash('Bulle n’arrive pas à lire ses données sur cet appareil. Réessaie, ou ferme puis rouvre l’app.', true);
  });
}

/* ================================================================ application installable */
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (S.me && S.tab === 'profile') renderProfile(); });
window.addEventListener('appinstalled', function () { installEvt = null; toast('Bulle est installée'); });
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').then(function (reg) { swReg = reg; }).catch(function (e) { console.warn('Service worker', e); });
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'open-chat' && S.me) { var c = visibleChats().find(function (x) { return x.id === e.data.chatId; }); if (c) { switchTab('chat'); openChat(c); } }
  });
}
document.addEventListener('visibilitychange', function () { if (!document.hidden && S.me && S.openChat) { markRead(S.openChat.id); renderNav(); } });

showSplash('');
start();
})();
