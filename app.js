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
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
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
var S = { me: null, users: {}, posts: [], stories: [], chats: [], online: new Set(), typing: {}, tab: 'feed', openChat: null, msgs: [], viewUid: null, sheet: null, editing: false, confirmDel: null, forceBottom: false, offline: false, seen: new Set(LS.get('seen', [])) };
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
function renderAll() { if (!S.me) return; renderBanner(); renderNav(); renderFeed(); renderChatList(); if (S.openChat) { renderThreadHead(); renderMsgs(); renderTyping(); } renderProfile(); renderSheetDyn(); }
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
  var gs = []; m.forEach(function (items, uid) { gs.push({ uid: uid, items: items, unseen: items.some(function (s) { return !S.seen.has(s.id); }), last: items[items.length - 1].at }); });
  var me = S.me.id;
  gs.sort(function (a, b) { if (a.uid === me) return -1; if (b.uid === me) return 1; if (a.unseen !== b.unseen) return a.unseen ? -1 : 1; return b.last - a.last; });
  return gs;
}
function renderFeed() {
  var st = $('#stories'), box = $('#posts'); st.replaceChildren(); box.replaceChildren();
  var gs = storyGroups(), me = S.me.id, mine = gs.find(function (g) { return g.uid === me; });
  var ring = h('span', { class: 'ring ' + (mine ? (mine.unseen ? 'live' : 'seen') : 'none') }, avatar(me, 60), h('span', { class: 'plus', 'aria-hidden': 'true' }, icon('plus')));
  st.append(h('button', { class: 'st', type: 'button', 'aria-label': mine ? 'Voir ton snap' : 'Ajouter un snap', onclick: function () { if (mine) openStories(gs, 0); else openComposer('snap'); } }, ring, h('small', { text: mine ? 'Ton snap' : 'Ajouter' })));
  gs.forEach(function (g, i) {
    if (g.uid === me) return;
    st.append(h('button', { class: 'st', type: 'button', 'aria-label': 'Snap de ' + who(g.uid).name, onclick: function () { openStories(gs, i); } }, h('span', { class: 'ring ' + (g.unseen ? 'live' : 'seen') }, avatar(g.uid, 60)), h('small', { text: who(g.uid).name })));
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
  return h('button', { class: 'person', type: 'button', onclick: function () { showProfile(uid); } }, avatar(uid, 36, true), h('span', { class: 'nm' }, h('b', { text: w.name }), w.handle && w.handle !== w.name ? h('small', { text: '@' + w.handle }) : null));
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
function burst(x, y) {
  var r = $('#phone').getBoundingClientRect();
  var b = h('div', { class: 'burst', style: 'left:' + (x - r.left) + 'px;top:' + (y - r.top) + 'px' }, icon('heart'));
  $('#phone').append(b); b.addEventListener('animationend', function () { b.remove(); }); setTimeout(function () { b.remove(); }, 1500);
  if (navigator.vibrate) navigator.vibrate(12);
}

function renderChatList() {
  var box = $('#chatlist'); box.replaceChildren();
  // invitation à activer les notifications (une seule fois, tant que le navigateur n'a rien répondu)
  if ('Notification' in window && Notification.permission === 'default' && !LS.get('notifAsked', false)) {
    box.append(h('div', { class: 'card ask' }, h('h3', { text: 'Ne rate aucun message' }), h('p', { text: 'Active les notifications pour savoir tout de suite quand on t’écrit.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: function () { LS.set('notifAsked', true); renderChatList(); } }, 'Plus tard'),
        h('button', { class: 'btn small primary', type: 'button', onclick: enableNotifs }, icon('bell'), 'Activer'))));
  }
  visibleChats().forEach(function (c) {
    var un = isUnread(c), typers = typersIn(c.id), other = otherOf(c);
    var prev = typers.length ? h('span', { class: 'typing-txt', text: (c.kind === 'group' ? who(typers[0]).name + ' ' : '') + 'écrit…' })
      : h('span', { text: c.lastText ? ((c.lastBy === S.me.id ? 'Toi : ' : (c.kind === 'group' && c.lastBy ? who(c.lastBy).name + ' : ' : '')) + c.lastText) : (c.kind === 'group' ? 'Tout le monde peut écrire ici' : 'Nouvelle discussion') });
    box.append(h('div', { class: 'crow-w' }, h('button', { class: 'crow' + (un ? ' unread' : ''), type: 'button', onclick: function () { openChat(c); } },
      c.kind === 'group' ? groupAvatar(52) : avatar(other, 52, true),
      h('span', { class: 't' }, h('b', { text: chatTitle(c) }), prev),
      h('span', { class: 'meta' }, c.lastAt ? h('time', { text: ago(c.lastAt) }) : (c.kind === 'group' ? h('time', { text: S.online.size + ' en ligne' }) : null), un ? h('span', { class: 'udot', 'aria-label': 'Non lu' }) : null)),
      un && c.kind === 'dm' ? h('button', { class: 'peekbtn', type: 'button', 'aria-label': 'Entrouvrir le message de ' + chatTitle(c) + ' sans le marquer comme lu', onclick: function () { peek(c); } }, icon('eye'), hasPlus() ? null : h('span', { class: 'tier', text: '+' })) : null));
  });
  box.append(h('button', { class: 'btn block', type: 'button', style: 'margin-top:12px', onclick: openNewChat }, icon('edit'), 'Écrire à quelqu’un'));
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
    list.replaceChildren.apply(list, fresh.length ? fresh.map(function (m) { return h('div', { class: 'bub', text: m.text || '📷 Photo' }); }) : [h('p', { class: 'hint', text: 'Rien de nouveau.' })]);
  }, function () { list.replaceChildren(h('p', { class: 'hint', text: 'Impossible de lire les messages.' })); });
}

/* ---------------- discussion ouverte */
var msgReq = 0;
function openChat(c) {
  S.openChat = c; S.msgs = []; S.forceBottom = true; markRead(c.id);
  closeSheet(); $('#thread').hidden = false; $('#th-in').value = '';
  renderThreadHead(); renderMsgs(); renderTyping(); renderNav(); renderChatList();
  var req = ++msgReq;
  call('GET', '/api/chats/' + c.id + '/messages').then(function (r) {
    if (req !== msgReq || !S.openChat || S.openChat.id !== c.id) return;
    S.msgs = r.messages; S.forceBottom = true; renderMsgs();
  }, function (e) { if (e.status === 401) showAuth(); else toast(e.message); });
  if (window.matchMedia('(hover:hover)').matches) setTimeout(function () { $('#th-in').focus(); }, 60);
}
function closeThread() { S.openChat = null; S.msgs = []; $('#thread').hidden = true; renderChatList(); renderNav(); }
function renderThreadHead() {
  var c = S.openChat, box = $('#th-who'); box.replaceChildren(); if (!c) return;
  if (c.kind === 'group') {
    box.append(groupAvatar(40), h('span', { class: 'nm' }, h('b', { text: 'Le salon' }), h('small', { text: S.online.size > 1 ? S.online.size + ' personnes en ligne' : 'Ouvert à tout le monde' })));
    box.onclick = null;
  } else {
    var o = otherOf(c), on = S.online.has(o);
    box.append(avatar(o, 40, true), h('span', { class: 'nm' }, h('b', { text: who(o).name }), h('small', { class: on ? 'on' : '', text: on ? 'En ligne' : '@' + who(o).handle })));
    box.onclick = function () { showProfile(o); };
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
    if (m.reply === 'snap') col.append(h('span', { class: 'rtag', text: mine ? 'Tu as répondu à un snap' : 'A répondu à ton snap' }));
    if (m.img) col.append(h('button', { class: 'bub pic', type: 'button', 'aria-label': 'Agrandir la photo', onclick: function () { viewImage(m.img); } }, cachedImg('m' + m.id, m.img, 'Photo envoyée')));
    if (m.text) col.append(h('div', { class: 'bub', text: m.text }));
    // dernier message envoyé en privé : « Vu » ou « Envoyé » (si les confirmations de lecture sont actives)
    var status = '';
    if (mine && !group && i === ms.length - 1) {
      var seenAt = (c.seen || {})[otherOf(c)] || 0;
      status = privacy().readReceipts && seenAt >= m.at ? ' · Vu' : ' · Envoyé';
    }
    if (last) col.append(h('span', { class: 'mtime', text: hhmm(m.at) + status }));
    var row = h('div', { class: 'mrow ' + (mine ? 'me' : 'them') + (last ? ' last' : '') });
    if (!mine) row.append(last ? avatar(m.by, 28) : h('span', { class: 'spacer' }));
    row.append(col); box.append(row);
  });
  if (near || S.forceBottom) { box.scrollTop = box.scrollHeight; S.forceBottom = false; }
}
function renderTyping() {
  var t = $('#typing'); t.replaceChildren();
  var ids = S.openChat ? typersIn(S.openChat.id) : [];
  t.hidden = !ids.length; if (!ids.length) return;
  t.append(h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { text: (ids.length > 1 ? ids.length + ' personnes écrivent' : who(ids[0]).name + ' écrit') + '…' }));
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
    h('button', { class: 'pf-av' + (snaps.length ? '' : ' plain'), type: 'button', 'aria-label': snaps.length ? 'Voir ses snaps' : 'Photo de profil', onclick: function () { if (!snaps.length) return; var gs = storyGroups(); var i = gs.findIndex(function (g) { return g.uid === uid; }); if (i >= 0) openStories(gs, i); } }, avatar(uid, 88)),
    h('div', { class: 'pf-id' }, h('h1', { class: 'pf-name' }, w.name, tierChip((S.users[uid] || {}).plan, true)), h('p', { class: 'pf-handle', text: '@' + w.handle }), !mine && S.online.has(uid) ? h('p', { class: 'on-line', text: 'En ligne' }) : null)));
  if (w.bio) pf.append(h('p', { class: 'pf-bio', text: w.bio }));
  pf.append(h('dl', { class: 'pf-stats' },
    h('div', {}, h('dt', { text: posts.length > 1 ? 'publications' : 'publication' }), h('dd', { text: String(posts.length) })),
    h('div', {}, h('dt', { text: 'j’aime reçus' }), h('dd', { text: String(likes) })),
    h('div', {}, h('dt', { text: 'snaps actifs' }), h('dd', { text: String(snaps.length) }))));
  if (mine) pf.append(h('div', { class: 'pf-acts' }, h('button', { class: 'btn', type: 'button', onclick: editProfile }, icon('edit'), 'Modifier'), h('button', { class: 'btn primary', type: 'button', onclick: function () { openComposer('post'); } }, icon('plus'), 'Publier')));
  else pf.append(h('div', { class: 'pf-acts' }, h('button', { class: 'btn primary', type: 'button', onclick: function () { openChat(dmFor(uid)); } }, icon('send'), 'Envoyer un message')));
  if (posts.length) pf.append(h('div', { class: 'grid' }, posts.map(function (p) { return h('button', { type: 'button', 'aria-label': 'Ouvrir la publication', onclick: function () { openPost(p.id); } }, cachedImg('g' + p.id, p.img, '')); })));
  else pf.append(h('p', { class: 'muted', style: 'color:var(--muted)', text: mine ? 'Tes photos apparaîtront ici.' : 'Aucune publication pour le moment.' }));
  if (mine) {
    pf.append(proCard(posts, snaps));
    pf.append(installCard());
    pf.append(h('div', { class: 'settings' }, navRow('gear', 'Paramètres et confidentialité', openSettings)));
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
      })))
  ], 'Version test : tout est enregistré. Le mode fantôme et les confirmations de lecture marchent déjà ; les autres réglages s’appliqueront à tes vrais contacts avec le serveur.');

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
function openComposer(mode) {
  var st = { mode: mode || 'post', file: null, url: null };
  var seg = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Type de publication' });
  var drop = h('label', { class: 'drop', for: 'cmp-pick' });
  var pick = h('input', { type: 'file', accept: 'image/*', id: 'cmp-pick', hidden: true });
  var cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', id: 'cmp-cam', hidden: true });
  var cap = h('textarea', { id: 'cmp-cap', rows: '3', maxlength: '2200', placeholder: 'Écris une légende…' });
  var stx = h('input', { id: 'cmp-snap', maxlength: '80', placeholder: 'Texte sur la photo (facultatif)', autocomplete: 'off' });
  var capField = h('div', { class: 'field' }, h('label', { for: 'cmp-cap', text: 'Légende' }), cap);
  var snapField = h('div', { class: 'field' }, h('label', { for: 'cmp-snap', text: 'Texte du snap' }), stx, h('span', { class: 'hint', text: 'Visible 24 h, puis il disparaît.' }));
  var go = h('button', { class: 'btn primary', type: 'submit' }, 'Partager');
  function setFile(f) { if (!f || !/^image\//.test(f.type)) { if (f) toast('Choisis une image (JPEG, PNG…).'); return; } if (st.url) URL.revokeObjectURL(st.url); st.file = f; st.url = URL.createObjectURL(f); sync(); }
  pick.addEventListener('change', function () { setFile(pick.files[0]); });
  cam.addEventListener('change', function () { setFile(cam.files[0]); });
  stx.addEventListener('input', sync);
  drop.addEventListener('dragover', function (e) { e.preventDefault(); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); setFile(e.dataTransfer.files[0]); });
  function sync() {
    seg.replaceChildren();
    [['post', 'Publication'], ['snap', 'Snap · 24 h']].forEach(function (m) { seg.append(h('button', { type: 'button', role: 'tab', 'aria-selected': String(st.mode === m[0]), onclick: function () { st.mode = m[0]; sync(); } }, m[1])); });
    drop.className = 'drop' + (st.mode === 'snap' ? ' snap' : '') + (st.url ? ' has' : ''); drop.replaceChildren();
    if (st.url) { drop.append(h('img', { src: st.url, alt: 'Aperçu' })); if (st.mode === 'snap' && stx.value.trim()) drop.append(h('div', { class: 'snapcap', text: stx.value.trim() })); }
    else drop.append(h('span', { class: 'ph' }, icon('image'), h('span', { text: 'Choisis une photo' })));
    capField.hidden = st.mode !== 'post'; snapField.hidden = st.mode !== 'snap';
    go.textContent = st.mode === 'post' ? 'Partager' : 'Envoyer le snap';
  }
  var form = h('form', { class: 'form', onsubmit: function (e) {
    e.preventDefault(); if (!st.file) { toast('Choisis une photo d’abord.'); return; }
    go.disabled = true; var label = go.textContent; go.textContent = 'Envoi…';
    shrink(st.file).then(function (img) {
      return st.mode === 'post'
        ? attempt(call('POST', '/api/posts', { image: img, caption: cap.value.trim() }), 'Publié').then(function (r) { if (r) { upsert(S.posts, r.post, byNewest); } return r; })
        : attempt(call('POST', '/api/stories', { image: img, text: stx.value.trim() }), 'Snap envoyé · visible 24 h').then(function (r) { if (r) { upsert(S.stories, r.story, byOldest); } return r; });
    }, function () { toast('Cette image n’a pas pu être lue. Essaie un JPEG ou un PNG.'); return false; })
      .then(function (r) { go.disabled = false; go.textContent = label; if (r) { closeSheet(); if (S.openChat) closeThread(); switchTab('feed'); } });
  } }, seg, drop, pick, cam, h('div', { class: 'pick-row' }, h('label', { class: 'btn small', for: 'cmp-pick' }, icon('image'), 'Galerie'), h('label', { class: 'btn small', for: 'cmp-cam' }, icon('camera'), 'Appareil photo')), capField, snapField, go);
  sync(); openSheet('Créer', form);
}

/* ---------------- snaps */
var SVs = null;
function openStories(groups, gi) {
  var g = groups[gi]; if (!g) return;
  var si = g.items.findIndex(function (s) { return !S.seen.has(s.id); });
  SVs = { groups: groups, gi: gi, si: si < 0 ? 0 : si, elapsed: 0, last: performance.now(), paused: false, raf: 0, down: 0 };
  $('#story').hidden = false; buildStory(); SVs.raf = requestAnimationFrame(tick);
}
function closeStory() { if (!SVs) return; cancelAnimationFrame(SVs.raf); SVs = null; var r = $('#story'); r.hidden = true; r.replaceChildren(); renderFeed(); }
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
      h('button', { class: 'sv-who', type: 'button', onclick: function () { if (!mine) { closeStory(); showProfile(g.uid); } } }, avatar(g.uid, 32), h('b', { text: mine ? 'Ton snap' : (w.handle || w.name) }), h('time', { text: ago(s.at) })),
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
    ri.addEventListener('focus', function () { SVs.paused = true; });
    ri.addEventListener('blur', function () { if (SVs) { SVs.paused = false; SVs.last = performance.now(); } });
    var heart = h('button', { class: 'sv-ic' + (liked ? ' liked' : ''), type: 'button', 'aria-pressed': String(liked), 'aria-label': 'J’aime ce snap', onclick: function (ev) {
      if (liked) return;
      liked = true; heart.classList.add('liked'); heart.setAttribute('aria-pressed', 'true');
      var l = LS.get('storyLikes', []); l.push(s.id); LS.set('storyLikes', l.slice(-500));
      var r = heart.getBoundingClientRect(); burst(r.left + r.width / 2, r.top);
      sendMsg(dmFor(g.uid), { text: '❤️', reply: 'snap' });
    } }, icon('heart'));
    var send = function () { var t = ri.value.trim(); if (!t) { ri.focus(); return; } ri.value = ''; ri.blur(); sendMsg(dmFor(g.uid), { text: t, reply: 'snap' }).then(function (ok) { if (ok) toast('Réponse envoyée à ' + w.name); }); };
    foot = h('form', { class: 'sv-foot', onsubmit: function (e) { e.preventDefault(); send(); } }, ri, heart,
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
$('#th-in').addEventListener('input', function () {
  if (!S.openChat || !this.value) return; var now = Date.now();
  if (now - lastTypingPing > 2500) { lastTypingPing = now; call('POST', '/api/typing', { chatId: S.openChat.id }).catch(function () {}); }
});
$('#th-form').addEventListener('submit', function (e) {
  e.preventDefault(); var inp = $('#th-in'), t = inp.value.trim(); if (!t || !S.openChat) return;
  inp.value = ''; lastTypingPing = 0;
  sendMsg(S.openChat, { text: t }).then(function (ok) { if (!ok) inp.value = t; });
});
$('#th-file').addEventListener('change', function () {
  var f = this.files[0]; this.value = ''; if (!f || !S.openChat) return;
  var chat = S.openChat; toast('Envoi de la photo…');
  shrink(f, 1440).then(function (img) { return sendMsg(chat, { image: img }); }, function () { toast('Cette image n’a pas pu être envoyée.'); });
});
document.addEventListener('keydown', function (e) {
  if (SVs) { if (e.key === 'Escape') closeStory(); else if (document.activeElement.id !== 'sv-reply') { if (e.key === 'ArrowRight') nextStory(); else if (e.key === 'ArrowLeft') prevStory(); } return; }
  if (e.key === 'Escape') { var v = $('.viewer'); if (v) v.remove(); else if (!$('#sheet').hidden) closeSheet(); else if (S.openChat) closeThread(); }
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
function msgTitle(chatId, m) { var c = S.chats.find(function (x) { return x.id === chatId; }); return c && c.kind === 'group' ? 'Le salon · ' + who(m.by).name : who(m.by).name; }
function notify(chatId, m) {
  if (!PREFS.notif || !('Notification' in window) || Notification.permission !== 'granted' || !swReg) return;
  swReg.showNotification(msgTitle(chatId, m), { body: PREFS.preview ? (m.text || '📷 Photo') : 'Nouveau message', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: chatId, renotify: true, data: { chatId: chatId } }).catch(function () {});
}
// bandeau en haut de l'écran quand l'app est ouverte sur autre chose
var huT = null;
function headsUp(chatId, m) {
  if (!PREFS.heads) return;
  var el = $('#hu'), c = visibleChats().find(function (x) { return x.id === chatId; });
  el.replaceChildren(h('button', { class: 'hu-in', type: 'button', onclick: function () { el.hidden = true; if (!c) return; if (SVs) closeStory(); closeSheet(); switchTab('chat'); openChat(c); } },
    avatar(m.by, 40), h('span', { class: 't' }, h('b', { text: msgTitle(chatId, m) }), h('span', { text: PREFS.preview ? (m.text || '📷 Photo') : 'Nouveau message' }))));
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
