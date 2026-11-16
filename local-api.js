/* Bulle — version test sans serveur.
   Imite l'API du futur serveur, mais tout est enregistré sur l'appareil (IndexedDB).
   Lou, Inès et Malo sont des contacts d'exemple qui répondent tout seuls.
   Quand le vrai serveur sera en ligne, il suffira de retirer ce fichier. */
(function () {
'use strict';
var DAY = 864e5;
var db = null, conn = null, memOnly = false, listeners = [];

function empty() { return { me: null, users: {}, posts: {}, stories: {}, chats: {}, msgs: {} }; }
function rid(n) { var s = ''; var a = new Uint8Array(Math.ceil((n || 12) / 2)); crypto.getRandomValues(a); a.forEach(function (b) { s += b.toString(16).padStart(2, '0'); }); return s.slice(0, n || 12); }
function fail(status, message) { var e = new Error(message); e.status = status; return e; }
function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }

/* ---------- stockage ---------- */
function open() {
  if (conn) return Promise.resolve(conn);
  return new Promise(function (res, rej) {
    var r = indexedDB.open('bulle-test', 1);
    r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
    r.onsuccess = function () { conn = r.result; res(conn); };
    r.onerror = function () { rej(r.error); };
  });
}
var loading = null;
function load() {
  if (db) return Promise.resolve(db);
  if (!loading) loading = open().then(function (c) {
    return new Promise(function (res) {
      var g = c.transaction('kv').objectStore('kv').get('db');
      g.onsuccess = function () { db = g.result || empty(); res(db); };
      g.onerror = function () { db = empty(); res(db); };
    });
  }).catch(function () { memOnly = true; db = empty(); return db; });
  return loading;
}
var saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(function () {
    if (memOnly) return;
    open().then(function (c) {
      var t = c.transaction('kv', 'readwrite'); t.objectStore('kv').put(db, 'db');
      t.onerror = function () { emit('storage-error', {}); };
    });
  }, 150);
}
function emit(type, data) { listeners.forEach(function (fn) { try { fn(type, data); } catch (e) { console.warn(e); } }); }

/* ---------- formes publiques (identiques au futur serveur) ---------- */
var PRIVACY = { showOnline: true, readReceipts: true, ghost: false, dms: 'all' };
function privacyOf(u) { var p = u.privacy || {}, o = {}; Object.keys(PRIVACY).forEach(function (k) { o[k] = p[k] == null ? PRIVACY[k] : p[k]; }); return o; }
function pubUser(u) {
  var o = { id: u.id, handle: u.handle, name: u.name || u.handle, bio: u.bio || '', avatar: u.avatar || '', admin: u.id === db.me, bot: !!u.bot, plan: u.plan || 'free', score: u.score || 0 };
  if (u.id === db.me) { o.privacy = privacyOf(u); o.close = Object.keys(u.close || {}).filter(function (id) { return db.users[id]; }); } // réglages privés : seulement pour soi
  return o;
}
function outPost(p) { return { id: p.id, by: p.by, caption: p.caption, at: p.at, img: p.image, likes: Object.keys(p.likes || {}), comments: p.comments || [] }; }
// les vues d'un snap ne sont renvoyées qu'à son auteur
function outStory(s) { return { id: s.id, by: s.by, text: s.text, at: s.at, img: s.image, close: !!s.close, views: s.by === db.me ? Object.keys(s.views || {}) : [] }; }
// un snap « amis proches » n'est visible que par les personnes de la liste de son auteur
function canSeeStory(s, uid) { if (!s.close || s.by === uid) return true; var a = db.users[s.by]; return !!(a && a.close && a.close[uid]); }
// ajoute aux comptes existants ce qui est apparu depuis (notes, snap « amis proches » d'Inès)
function upgrade(meId) {
  var now = Date.now(), D = 864e5, bh = function (h) { return bots().find(function (b) { return b.handle === h; }); };
  var ines = bh('ines_b'), lou = bh('lou.gr'), malo = bh('malo.wav');
  if (!db.v5) {
    db.v5 = true;
    if (ines) {
      ines.close = ines.close || {}; ines.close[meId] = true;
      var id = rid(12); db.stories[id] = { id: id, by: ines.id, at: now - 35 * 6e4, text: 'Que pour vous ✨', image: art(106, '#CDEBD3', '#140D10', '#16C060', 720, 1280), close: true };
    }
    if (!db.notes && lou) { db.notes = {}; db.notes[lou.id] = { by: lou.id, text: 'Qui est chaud pour un ciné ce soir ? 🎬', at: now - 2 * 36e5 }; }
  }
  if (!db.v6) {
    db.v6 = true; db.highlights = db.highlights || {};
    // stories « à la une » des contacts d'exemple
    var hl = function (u, title, list) {
      if (!u) return; var id = rid(12), items = list.map(function (x, i) { return { id: rid(12), img: art(x[0], x[1], x[2], x[3], 720, 1280), text: x[4] || '', at: now - x[5] * D + i * 6e4 }; });
      db.highlights[id] = { id: id, by: u.id, title: title, items: items, cover: items[0].id, at: now - 3 * D };
    };
    hl(lou, 'Été ☀️', [[201, '#FFE1EA', '#D81B55', '#F6B6C8', 'Plage à 7 h', 120], [202, '#F6B6C8', '#140D10', '#FFE1EA', '', 118], [203, '#D81B55', '#FFE1EA', '#140D10', 'Dernier coucher de soleil', 110]]);
    hl(lou, 'Argentique', [[211, '#140D10', '#F6B6C8', '#D81B55', 'Premier rouleau', 40], [212, '#FFE1EA', '#140D10', '#D81B55', '', 39]]);
    hl(malo, 'Studio 🎧', [[221, '#140D10', '#D81B55', '#F6B6C8', 'Nouveau son bientôt', 20], [222, '#D81B55', '#140D10', '#FFE1EA', '', 12]]);
    hl(ines, 'Lyon', [[231, '#FFE1EA', '#D81B55', '#140D10', 'Croix-Rousse', 30]]);
  }
}
// Archive (tes snaps de plus de 24 h, gardés pour toi) et stories « à la une »
function outHighlight(x, viewer) {
  var a = db.users[x.by], items = x.items.filter(function (it) { return !it.close || x.by === viewer || !!(a && a.close && a.close[viewer]); });
  if (!items.length) return null;
  var cov = items.find(function (it) { return it.id === x.cover; }) || items[0];
  return { id: x.id, by: x.by, title: x.title, at: x.at, cover: cov.id, coverImg: cov.img, items: items.map(function (it) { return { id: it.id, img: it.img, text: it.text, at: it.at, close: !!it.close }; }) };
}
function myHighlights(uid) { return Object.values(db.highlights || {}).sort(function (a, b) { return a.at - b.at; }).map(function (x) { return outHighlight(x, uid); }).filter(Boolean); }
function hlItems(u, ids, keep) {
  // reprend les éléments déjà à la une, sinon copie le snap (actif ou archivé) pour qu'il reste après 24 h
  var out = [];
  (Array.isArray(ids) ? ids : []).slice(0, 100).forEach(function (sid) {
    if (typeof sid !== 'string' || out.some(function (o) { return o.id === sid; })) return;
    var old = keep && keep.find(function (it) { return it.id === sid; });
    var s = old ? null : (db.stories[sid] || (db.archive || {})[sid]);
    if (old) out.push(old);
    else if (s && s.by === u.id) out.push({ id: s.id, img: s.image, text: s.text || '', at: s.at, close: !!s.close });
  });
  if (!out.length) throw fail(400, 'Choisis au moins un snap.');
  return out;
}
// un snap « vu une fois » n'envoie jamais son image dans la liste : il faut l'ouvrir (une seule fois)
function outMsg(m) {
  var o = { id: m.id, by: m.by, at: m.at, text: m.text || '', img: m.once ? '' : (m.image || ''), reply: m.reply || null, ref: m.ref || '', quote: m.quote || null, reacts: m.reacts || {} };
  if (m.once) { o.once = true; o.opened = !!m.openedAt; }
  if (m.audio) { o.audio = m.audio; o.dur = m.dur || 0; o.wave = m.wave || []; }
  return o;
}
// messages vocaux
function audio(v) { if (typeof v !== 'string' || v.length > 4e6 || !/^data:audio\/[a-z0-9.+-]+(;[a-z0-9=.+-]+)*;base64,/i.test(v)) throw fail(400, 'Message vocal invalide.'); return v; }
function cleanWave(w) { return Array.isArray(w) ? w.slice(0, 48).map(function (x) { x = +x; return x >= 0 && x <= 1 ? Math.round(x * 100) / 100 : 0; }) : []; }
function durTxt(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function msgLabel(m) { return m.once ? '📸 Snap' : m.audio ? '🎤 Message vocal (' + durTxt(m.dur) + ')' : m.text ? m.text.slice(0, 90) : 'Photo'; }
// « voix » des contacts d'exemple : un petit fredonnement synthétisé, en WAV
function fakeVoice(seed) {
  var r = rng(seed), sr = 8000, secs = 2.2 + r() * 2.5, n = Math.floor(sr * secs), pcm = new Int16Array(n);
  var f0 = 170 + r() * 90, sy = [], t = 0.15;
  while (t < secs - 0.3) { var d = 0.12 + r() * 0.22; sy.push([t, d, 0.8 + r() * 0.5]); t += d + 0.04 + r() * (r() < 0.2 ? 0.35 : 0.08); }
  var ph = 0, k = 0;
  for (var i = 0; i < n; i++) {
    var tt = i / sr, a = 0, p = f0;
    while (k < sy.length - 1 && tt >= sy[k][0] + sy[k][1]) k++;
    var s = sy[k]; if (s && tt >= s[0] && tt < s[0] + s[1]) { var x = (tt - s[0]) / s[1]; a = Math.sin(Math.PI * x); p = f0 * s[2] * (1 + 0.08 * Math.sin(x * 6)); }
    ph += 2 * Math.PI * p / sr;
    var v = a * (0.55 * Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph) + 0.06 * Math.sin(5 * ph));
    pcm[i] = Math.max(-1, Math.min(1, v * 0.7)) * 32767;
  }
  var B = 32, wave = [], seg = Math.floor(n / B);
  for (var b = 0; b < B; b++) { var mx = 0; for (var j = b * seg; j < (b + 1) * seg; j += 8) mx = Math.max(mx, Math.abs(pcm[j]) / 32767); wave.push(Math.round(Math.min(1, mx / 0.7) * 100) / 100); }
  var buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf), o = 0;
  var w4 = function (s) { for (var q = 0; q < 4; q++) dv.setUint8(o++, s.charCodeAt(q)); }, u32 = function (x) { dv.setUint32(o, x, true); o += 4; }, u16 = function (x) { dv.setUint16(o, x, true); o += 2; };
  w4('RIFF'); u32(36 + n * 2); w4('WAVE'); w4('fmt '); u32(16); u16(1); u16(1); u32(sr); u32(sr * 2); u16(2); u16(16); w4('data'); u32(n * 2);
  for (var z = 0; z < n; z++) { dv.setInt16(o, pcm[z], true); o += 2; }
  var bytes = new Uint8Array(buf), bin = '';
  for (var c = 0; c < bytes.length; c += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(c, c + 0x8000));
  return { audio: 'data:audio/wav;base64,' + btoa(bin), dur: Math.round(secs * 10) / 10, wave: wave };
}
// Flammes : nombre de jours d'affilée où les deux personnes se sont écrit
function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function markDay(c, uid, at) {
  if (c.kind !== 'dm') return;
  c.days = c.days || {}; var k = dayKey(at); (c.days[k] = c.days[k] || {})[uid] = true;
  var ks = Object.keys(c.days); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(function (x) { delete c.days[x]; });
}
function streakOf(c) {
  if (c.kind !== 'dm' || !c.days) return { n: 0, risk: false };
  var both = function (d) { var x = c.days[dayKey(d)]; return !!(x && c.members.every(function (u) { return x[u]; })); };
  var cur = new Date(); cur.setHours(12, 0, 0, 0);
  var today = both(cur), n = 0;
  if (!today) cur.setDate(cur.getDate() - 1);
  while (both(cur)) { n++; cur.setDate(cur.getDate() - 1); }
  var end = new Date(); end.setHours(24, 0, 0, 0);
  return { n: n, risk: n > 0 && !today && end - Date.now() < 4 * 36e5 };
}
function outChat(c) { var s = streakOf(c); return { id: c.id, kind: c.kind, members: c.members, lastAt: c.lastAt, lastText: c.lastText, lastBy: c.lastBy, seen: c.seen || {}, streak: s.n, streakRisk: s.risk }; }
function addScore(uid, n) { var u = db.users[uid]; if (!u) return; u.score = (u.score || 0) + n; emit('score', { uid: uid, score: u.score }); }
// Activité : j'aime, commentaires, vues de snaps sur ce que tu publies
function pushAct(type, by, extra) {
  db.activity = db.activity || [];
  var a = Object.assign({ id: rid(10), type: type, by: by, at: Date.now() }, extra || {});
  db.activity.push(a); while (db.activity.length > 100) db.activity.shift();
  emit('activity', a);
}
function liveNotes() { var cut = Date.now() - DAY; return Object.values(db.notes || {}).filter(function (n) { return n.at > cut && db.users[n.by]; }); }
function image(v) { if (typeof v !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(v)) throw fail(400, 'Image invalide.'); return v; }
function me() { var u = db.me && db.users[db.me]; if (!u) throw fail(401, 'Crée ton profil pour commencer.'); return u; }
function bots() { return Object.values(db.users).filter(function (u) { return u.bot; }); }
function canSee(c, uid) { return c.kind === 'group' || c.members.indexOf(uid) >= 0; }

/* ---------- contacts d'exemple ---------- */
function rng(seed) { var s = seed >>> 0 || 1; return function () { s = Math.imul(s ^ (s >>> 15), s | 1); s ^= s + Math.imul(s ^ (s >>> 7), s | 61); return ((s ^ (s >>> 14)) >>> 0) / 4294967296; }; }
function blobPath(cx, cy, r, n, rand) { var pts = []; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = r * (0.62 + rand() * 0.62); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } var f = function (v) { return v.toFixed(1); }; var pl = pts[n - 1], d = 'M' + f((pl[0] + pts[0][0]) / 2) + ' ' + f((pl[1] + pts[0][1]) / 2); for (var j = 0; j < n; j++) { var p = pts[j], q = pts[(j + 1) % n]; d += 'Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2); } return d + 'Z'; }
// dessine une image d'exemple (formes rondes aux couleurs de Bulle) et la renvoie en JPEG
function art(seed, bg, fg, ac, w, h) {
  w = w || 800; h = h || 1000; var r = rng(seed);
  var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  [[fg, w * (0.3 + r() * 0.4), h * (0.3 + r() * 0.4), w * (0.32 + r() * 0.1), 7], [ac, w * (0.2 + r() * 0.6), h * (0.2 + r() * 0.6), w * (0.12 + r() * 0.08), 6]].forEach(function (b) {
    x.fillStyle = b[0]; x.fill(new Path2D(blobPath(b[1], b[2], b[3], b[4], r)));
  });
  x.fillStyle = fg; x.beginPath(); x.arc(w * (0.1 + r() * 0.8), h * (0.1 + r() * 0.8), w * (0.025 + r() * 0.03), 0, Math.PI * 2); x.fill();
  return c.toDataURL('image/jpeg', 0.82);
}
function seed(meId) {
  var now = Date.now(), M = 6e4, H = 36e5;
  var mk = function (handle, name, bio) { var u = { id: rid(12), handle: handle, name: name, bio: bio, avatar: '', bot: true, createdAt: now, score: 300 + Math.floor(Math.random() * 4000) }; db.users[u.id] = u; return u.id; };
  var lou = mk('lou.gr', 'Lou', 'Photos floues et plantes vertes.');
  var ines = mk('ines_b', 'Inès', 'Lyon · argentique · thé glacé');
  var malo = mk('malo.wav', 'Malo', 'Je fais du son le soir.');
  var post = function (by, at, caption, img, likes, comments) { var id = rid(12); var l = {}; likes.forEach(function (u) { l[u] = true; }); db.posts[id] = { id: id, by: by, at: at, caption: caption, image: img, likes: l, comments: comments.map(function (c) { return { id: rid(10), by: c[0], text: c[1], at: c[2] }; }) }; };
  post(lou, now - 18 * M, 'Premier essai à l’argentique, ce rose me rend folle.', art(11, '#F6B6C8', '#140D10', '#D81B55'), [ines, malo], [[ines, 'Le grain est trop beau', now - 12 * M], [malo, 'Tu m’apprends ?', now - 8 * M]]);
  post(malo, now - 3 * H, 'Studio du soir. Nouveau son vendredi.', art(27, '#140D10', '#F6B6C8', '#FFE1EA'), [lou], []);
  post(ines, now - 9 * H, 'Marché de la Croix-Rousse, 8 h du mat.', art(41, '#FFE1EA', '#D81B55', '#140D10'), [lou, malo], [[malo, 'On y va dimanche ?', now - 7 * H]]);
  var story = function (by, at, text, img) { var id = rid(12); db.stories[id] = { id: id, by: by, at: at, text: text, image: img }; };
  story(lou, now - 40 * M, 'Devine où je suis', art(101, '#140D10', '#F6B6C8', '#D81B55', 720, 1280));
  story(lou, now - 20 * M, '', art(102, '#F6B6C8', '#140D10', '#FFE1EA', 720, 1280));
  story(malo, now - 2 * H, 'Concert samedi, qui vient ?', art(103, '#D81B55', '#140D10', '#F6B6C8', 720, 1280));
  story(ines, now - 5 * H, '', art(104, '#FFE1EA', '#140D10', '#D81B55', 720, 1280));
  var msg = function (cid, by, at, text) { (db.msgs[cid] = db.msgs[cid] || []).push({ id: rid(12), by: by, at: at, text: text }); var c = db.chats[cid]; c.lastAt = at; c.lastText = text; c.lastBy = by; };
  db.chats.general = { id: 'general', kind: 'group', members: [], lastAt: 0 };
  msg('general', ines, now - 50 * M, 'Coucou tout le monde !');
  msg('general', lou, now - 48 * M, 'Hello Inès');
  msg('general', malo, now - 5 * M, 'Quelqu’un vient au concert samedi ?');
  var ids = [meId, lou].sort(), dm = 'dm-' + ids[0] + '-' + ids[1];
  db.chats[dm] = { id: dm, kind: 'dm', members: ids, lastAt: 0 };
  msg(dm, lou, now - 27 * M, 'Bienvenue sur Bulle ! Écris-moi pour tester les messages.');
  // un snap « vu une fois » qui attend d'être ouvert
  db.msgs[dm].push({ id: rid(12), by: lou, at: now - 26 * M, text: '', image: art(105, '#F6B6C8', '#D81B55', '#140D10', 720, 1280), once: true });
  db.chats[dm].lastAt = now - 26 * M; db.chats[dm].lastText = '📸 Snap';
  // notes : une petite phrase au-dessus de l'avatar, visible 24 h
  db.notes = {};
  db.notes[lou] = { by: lou, text: 'Qui est chaud pour un ciné ce soir ? 🎬', at: now - 2 * H };
  db.notes[malo] = { by: malo, text: '🎧 en boucle depuis ce matin', at: now - 6 * H };
}
var LINES = ['Trop bien 😄', 'Haha grave', 'J’arrive dans 10 min', 'Envoie la photo !', 'Ok ça marche', 'Je te dis ça ce soir', 'Attends je regarde', 'Carrément', 'T’es où là ?', 'Mdr'];
var COMMENTS = ['Trop belle !', 'J’adore', 'Wow', 'La lumière 😍', 'Elle est où ?', 'Magnifique'];
var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
var SNAP_LINES = ['Mdrr 😂', 'T’es où là ?', 'Trop beau', 'Renvoie-moi un snap !', 'Haha je garde ça en tête'];
var COLORS = ['#F6B6C8', '#140D10', '#D81B55', '#FFE1EA', '#B9DDF7', '#CDEBD3'];
function findMsg(cid, mid) { return (db.msgs[cid] || []).find(function (x) { return x.id === mid; }); }
function botReply(c, sent) {
  var b = c.kind === 'dm' ? db.users[c.members.find(function (m) { return m !== db.me; })] : pick(bots().filter(function (u) { return u.handle !== 'ines_b'; }));
  if (!b || !b.bot) return;
  // en privé, le contact « ouvre » le message avant de répondre (affiche « Vu »)
  if (c.kind === 'dm') setTimeout(function () { var cur = db.chats[c.id]; if (!cur) return; cur.seen = cur.seen || {}; cur.seen[b.id] = Date.now(); save(); emit('chat', outChat(cur)); }, 500);
  // il ouvre ton snap, ou réagit parfois à ton message
  if (c.kind === 'dm' && sent) setTimeout(function () {
    var m = findMsg(c.id, sent.id); if (!m) return;
    if (m.once) { if (m.openedAt) return; m.openedAt = Date.now(); m.image = ''; }
    else if (Math.random() < 0.35) { m.reacts = m.reacts || {}; m.reacts[b.id] = pick(['❤️', '😂', '🔥']); }
    else return;
    save(); emit('msgupd', { chatId: c.id, msg: outMsg(m) });
  }, 1300);
  setTimeout(function () { emit('typing', { chatId: c.id, by: b.id }); }, 700);
  setTimeout(function () {
    var cur = db.chats[c.id]; if (!cur) return;
    var at = Date.now(), voice = !!(sent && sent.audio) && Math.random() < 0.65, snap = !voice && c.kind === 'dm' && Math.random() < 0.22;
    var m = snap ? { id: rid(12), by: b.id, at: at, text: '', image: art(Math.floor(Math.random() * 1e6), pick(COLORS), pick(COLORS), pick(COLORS), 720, 1280), once: true }
      : voice ? Object.assign({ id: rid(12), by: b.id, at: at, text: '' }, fakeVoice(Math.floor(Math.random() * 1e6)))
      : { id: rid(12), by: b.id, at: at, text: sent && sent.once ? pick(SNAP_LINES) : sent && sent.audio ? pick(['J’adore ta voix 😂', 'Ok je t’écoute ce soir', 'Mdr ton vocal', 'Bien reçu !']) : pick(LINES) };
    (db.msgs[c.id] = db.msgs[c.id] || []).push(m);
    cur.lastAt = m.at; cur.lastText = msgLabel(m); cur.lastBy = b.id; markDay(cur, b.id, at); addScore(b.id, snap ? 3 : 1); save();
    emit('msg', { chatId: c.id, msg: outMsg(m) }); emit('chat', outChat(cur));
  }, 2400 + Math.random() * 1200);
}
function botsReactTo(postId) {
  bots().forEach(function (b, i) {
    if (Math.random() < 0.25) return;
    setTimeout(function () { var p = db.posts[postId]; if (!p) return; p.likes[b.id] = true; save(); emit('post', outPost(p)); pushAct('like', b.id, { post: postId }); save(); }, 2500 + i * 1800 + Math.random() * 1500);
  });
  setTimeout(function () { var p = db.posts[postId]; if (!p) return; var b = pick(bots()), text = pick(COMMENTS); p.comments.push({ id: rid(10), by: b.id, text: text, at: Date.now() }); save(); emit('post', outPost(p)); pushAct('comment', b.id, { post: postId, text: text }); save(); }, 7000 + Math.random() * 3000);
}

/* ---------- routes (mêmes adresses que le futur serveur) ---------- */
var routes = [];
function route(method, pattern, fn) { routes.push({ method: method, re: new RegExp('^' + pattern + '$'), fn: fn }); }
function getPost(id) { var p = db.posts[id]; if (!p) throw fail(404, 'Cette publication n’existe plus.'); return p; }
var CHAT = '(general|dm-[0-9a-f]{12}-[0-9a-f]{12})';
function resolveChat(cid, uid, create) {
  var c = db.chats[cid]; if (c) return canSee(c, uid) ? c : null;
  var m = /^dm-([0-9a-f]{12})-([0-9a-f]{12})$/.exec(cid);
  if (cid === 'general') c = { id: 'general', kind: 'group', members: [], lastAt: 0 };
  else if (m && db.users[m[1]] && db.users[m[2]] && (uid === m[1] || uid === m[2])) c = { id: cid, kind: 'dm', members: [m[1], m[2]], lastAt: 0 };
  else return null;
  if (create) db.chats[cid] = c;
  return c;
}

function register(b) {
  if (db.me && db.users[db.me]) return { me: pubUser(db.users[db.me]) };
  var handle = str(b.handle, 40).toLowerCase();
  if (!/^[a-z0-9._]{3,24}$/.test(handle)) throw fail(400, 'Pseudo : 3 à 24 caractères, lettres minuscules, chiffres, point ou tiret bas.');
  if (b.terms !== true) throw fail(400, 'Coche la case pour accepter les conditions.');
  var u = { id: rid(12), handle: handle, name: str(b.name, 40) || handle, bio: '', avatar: '', createdAt: Date.now(), terms: { version: '2026-11', at: Date.now() } };
  db.users[u.id] = u; db.me = u.id; seed(u.id); save();
  return { me: pubUser(u) };
}
route('POST', '/api/register', register);
route('POST', '/api/login', register);
route('POST', '/api/logout', function () { db = empty(); save(); return { ok: true }; });
route('GET', '/api/state', function () {
  var u = me(), cut = Date.now() - DAY;
  if (!db.v6) { upgrade(u.id); save(); }
  // un snap de plus de 24 h disparaît pour les autres, mais le tien est gardé dans ton archive
  db.archive = db.archive || {};
  Object.values(db.stories).forEach(function (s) { if (s.at < cut) { if (s.by === u.id) db.archive[s.id] = s; delete db.stories[s.id]; } });
  var ar = Object.values(db.archive).sort(function (a, b) { return b.at - a.at; }); ar.slice(100).forEach(function (s) { delete db.archive[s.id]; });
  var online = [u.id].concat(bots().filter(function (b) { return b.handle !== 'ines_b'; }).map(function (b) { return b.id; }));
  return {
    me: pubUser(u), users: Object.values(db.users).map(pubUser),
    posts: Object.values(db.posts).sort(function (a, b) { return b.at - a.at; }).map(outPost),
    stories: Object.values(db.stories).filter(function (s) { return canSeeStory(s, u.id); }).sort(function (a, b) { return a.at - b.at; }).map(outStory),
    chats: Object.values(db.chats).filter(function (c) { return canSee(c, u.id); }).map(outChat),
    online: online, notes: liveNotes(), activity: (db.activity || []).slice(-60), highlights: myHighlights(u.id)
  };
});
route('PUT', '/api/profile', function (b) {
  var u = me();
  if (typeof b.name === 'string') u.name = str(b.name, 40) || u.handle;
  if (typeof b.bio === 'string') u.bio = str(b.bio, 150);
  if (b.avatar) u.avatar = image(b.avatar);
  if (b.removeAvatar) u.avatar = '';
  if (b.privacy && typeof b.privacy === 'object') {
    var cur = privacyOf(u);
    ['showOnline', 'readReceipts', 'ghost'].forEach(function (k) { if (typeof b.privacy[k] === 'boolean') cur[k] = b.privacy[k]; });
    if (b.privacy.dms === 'all' || b.privacy.dms === 'friends') cur.dms = b.privacy.dms;
    u.privacy = cur;
    if (cur.ghost && db.places) delete db.places[u.id];
  }
  // Version test : l'offre change sans paiement. Avec le serveur, seul le paiement confirmé pourra la changer.
  if (b.plan === 'free' || b.plan === 'plus' || b.plan === 'pro') u.plan = b.plan;
  if (Array.isArray(b.close)) { u.close = {}; b.close.forEach(function (id) { if (typeof id === 'string' && db.users[id] && id !== u.id) u.close[id] = true; }); }
  save(); emit('user', pubUser(u)); return { me: pubUser(u) };
});
route('GET', '/api/export', function () {
  var u = me();
  return {
    exportedAt: new Date().toISOString(), note: 'Toutes les données de ton compte Bulle (version test, enregistrées sur cet appareil).',
    profile: pubUser(u), acceptedTerms: u.terms || null,
    posts: Object.values(db.posts).filter(function (p) { return p.by === u.id; }).map(outPost),
    stories: Object.values(db.stories).filter(function (s) { return s.by === u.id; }).map(outStory),
    chats: Object.values(db.chats).filter(function (c) { return canSee(c, u.id); }).map(function (c) { return { chat: outChat(c), messages: (db.msgs[c.id] || []).map(outMsg) }; }),
    location: (db.places && db.places[u.id]) || null,
    note: (db.notes && db.notes[u.id]) || null,
    highlights: myHighlights(u.id).filter(function (x) { return x.by === u.id; })
  };
});
// Carte : enregistre ta position (sauf en mode fantôme) et renvoie celle de tes amis
function km(a, b) { var R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r; var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
route('POST', '/api/location', function (b) {
  var u = me(), now = Date.now(), pv = privacyOf(u);
  var has = typeof b.lat === 'number' && typeof b.lng === 'number' && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180;
  db.places = db.places || {};
  if (pv.ghost) delete db.places[u.id]; else if (has) db.places[u.id] = { lat: b.lat, lng: b.lng, at: now };
  var base = has ? [b.lat, b.lng] : (db.mapBase || [45.764, 4.8357]); // Lyon par défaut
  var moved = !db.mapBase || km(db.mapBase, base) > 30;
  if (moved) db.mapBase = base;
  bots().forEach(function (bt) {
    var p = db.places[bt.id];
    if (!p || moved || now - p.at > 25 * 6e4) {
      var a = Math.random() * Math.PI * 2, d = 0.4 + Math.random() * 2.6;
      db.places[bt.id] = { lat: base[0] + d / 111 * Math.cos(a), lng: base[1] + d / (111 * Math.cos(base[0] * Math.PI / 180)) * Math.sin(a), at: now - Math.floor(Math.random() * 40) * 6e4 };
    }
  });
  save();
  return { base: db.mapBase, places: Object.keys(db.places).filter(function (id) { return db.users[id] && id !== u.id; }).map(function (id) { var p = db.places[id]; return { uid: id, lat: p.lat, lng: p.lng, at: p.at }; }) };
});
route('POST', '/api/posts', function (b) {
  var u = me(); var p = { id: rid(12), by: u.id, caption: str(b.caption, 2200), image: image(b.image), at: Date.now(), likes: {}, comments: [] };
  db.posts[p.id] = p; addScore(u.id, 5); save(); botsReactTo(p.id); return { post: outPost(p) };
});
route('POST', '/api/posts/([0-9a-f]{12})/like', function (b, id) {
  var u = me(), p = getPost(id); if (b.on) p.likes[u.id] = true; else delete p.likes[u.id];
  save(); return { post: outPost(p) };
});
route('POST', '/api/posts/([0-9a-f]{12})/comments', function (b, id) {
  var u = me(), p = getPost(id), text = str(b.text, 500); if (!text) throw fail(400, 'Le commentaire est vide.');
  p.comments.push({ id: rid(10), by: u.id, text: text, at: Date.now() }); save(); return { post: outPost(p) };
});
route('DELETE', '/api/posts/([0-9a-f]{12})/comments/([0-9a-f]{10})', function (b, id, cid) {
  me(); var p = getPost(id); p.comments = p.comments.filter(function (c) { return c.id !== cid; }); save(); return { post: outPost(p) };
});
route('DELETE', '/api/posts/([0-9a-f]{12})', function (b, id) { me(); getPost(id); delete db.posts[id]; save(); return { ok: true }; });
route('POST', '/api/stories', function (b) {
  var u = me(); var s = { id: rid(12), by: u.id, text: str(b.text, 80), image: image(b.image), at: Date.now(), views: {}, close: !!b.close };
  if (s.close && !Object.keys(u.close || {}).length) throw fail(400, 'Ta liste d’amis proches est vide : ajoute quelqu’un d’abord.');
  db.stories[s.id] = s; save();
  // les contacts d'exemple regardent ton snap au bout de quelques secondes (seulement tes amis proches si c'est pour eux)
  bots().forEach(function (bt, i) {
    if (!canSeeStory(s, bt.id) || Math.random() < 0.2) return;
    setTimeout(function () { var x = db.stories[s.id]; if (!x) return; x.views = x.views || {}; x.views[bt.id] = Date.now(); emit('story', outStory(x)); pushAct('view', bt.id, { story: s.id }); save(); }, 3000 + i * 4000 + Math.random() * 2500);
  });
  addScore(u.id, 5); save();
  return { story: outStory(s) };
});
route('DELETE', '/api/stories/([0-9a-f]{12})', function (b, id) { me(); delete db.stories[id]; save(); return { ok: true }; });
route('GET', '/api/archive', function () {
  var u = me(), all = Object.values(db.stories).concat(Object.values(db.archive || {}));
  return { stories: all.filter(function (s) { return s.by === u.id; }).sort(function (a, b) { return b.at - a.at; }).map(outStory) };
});
route('POST', '/api/highlights', function (b) {
  var u = me(), items = hlItems(u, b.items), id = rid(12);
  db.highlights = db.highlights || {};
  if (Object.values(db.highlights).filter(function (x) { return x.by === u.id; }).length >= 30) throw fail(400, '30 stories à la une maximum.');
  db.highlights[id] = { id: id, by: u.id, title: str(b.title, 20) || 'À la une', items: items, cover: items.some(function (it) { return it.id === b.cover; }) ? b.cover : items[0].id, at: Date.now() };
  save(); return { highlight: outHighlight(db.highlights[id], u.id) };
});
route('PUT', '/api/highlights/([0-9a-f]{12})', function (b, id) {
  var u = me(), x = (db.highlights || {})[id]; if (!x || x.by !== u.id) throw fail(404, 'Cette story à la une n’existe plus.');
  if (typeof b.title === 'string') x.title = str(b.title, 20) || 'À la une';
  if (Array.isArray(b.items)) x.items = hlItems(u, b.items, x.items);
  if (typeof b.cover === 'string' && x.items.some(function (it) { return it.id === b.cover; })) x.cover = b.cover;
  if (!x.items.some(function (it) { return it.id === x.cover; })) x.cover = x.items[0].id;
  save(); return { highlight: outHighlight(x, u.id) };
});
route('DELETE', '/api/highlights/([0-9a-f]{12})', function (b, id) {
  var u = me(), x = (db.highlights || {})[id]; if (!x || x.by !== u.id) throw fail(404, 'Cette story à la une n’existe plus.');
  delete db.highlights[id]; save(); return { ok: true };
});
route('GET', '/api/chats/' + CHAT + '/messages', function (b, cid) {
  var u = me(), c = resolveChat(cid, u.id, false); if (!c) throw fail(404, 'Discussion introuvable.');
  return { chat: outChat(c), messages: (db.msgs[cid] || []).slice(-200).map(outMsg) };
});
route('POST', '/api/chats/' + CHAT + '/messages', function (b, cid) {
  var u = me(), c = resolveChat(cid, u.id, true); if (!c) throw fail(404, 'Discussion introuvable.');
  var text = str(b.text, 2000), img = b.image ? image(b.image) : '', snd = b.audio ? audio(b.audio) : '';
  if (snd) { text = ''; img = ''; }
  if (!text && !img && !snd) throw fail(400, 'Le message est vide.');
  var list = (db.msgs[cid] = db.msgs[cid] || []);
  var reply = b.reply === 'snap' || b.reply === 'note' ? b.reply : null, once = !!(b.once && img && c.kind === 'dm');
  var qm = typeof b.quote === 'string' ? list.find(function (x) { return x.id === b.quote; }) : null;
  var m = { id: rid(12), by: u.id, at: Date.now(), text: once ? '' : text, image: img, reply: reply, ref: reply ? str(b.ref, 80) : '',
    quote: qm ? { id: qm.id, by: qm.by, text: qm.once ? '📸 Snap' : qm.audio ? '🎤 Message vocal' : (qm.text ? qm.text.slice(0, 80) : '📷 Photo') } : null };
  if (once) m.once = true;
  if (snd) { m.audio = snd; m.dur = Math.max(0, Math.min(600, +b.dur || 0)); m.wave = cleanWave(b.wave); }
  list.push(m); while (list.length > 300) list.shift();
  c.lastAt = m.at; c.lastText = msgLabel(m); c.lastBy = u.id;
  markDay(c, u.id, m.at); addScore(u.id, once ? 3 : 1); save();
  botReply(c, m);
  return { msg: outMsg(m), chat: outChat(c) };
});
// ouvrir un snap « vu une fois » : l'image est renvoyée une seule fois puis effacée
route('POST', '/api/chats/' + CHAT + '/messages/([0-9a-f]{12})/open', function (b, cid, mid) {
  var u = me(), c = resolveChat(cid, u.id, false); if (!c) throw fail(404, 'Discussion introuvable.');
  var m = findMsg(cid, mid); if (!m || !m.once) throw fail(404, 'Ce snap n’existe plus.');
  if (m.by === u.id) throw fail(403, 'Ton snap ne peut être ouvert que par ton ami.');
  if (m.openedAt) throw fail(410, 'Ce snap a déjà été ouvert.');
  var img = m.image; m.openedAt = Date.now(); m.image = ''; save();
  emit('msgupd', { chatId: cid, msg: outMsg(m) });
  return { img: img, msg: outMsg(m) };
});
var EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
route('POST', '/api/chats/' + CHAT + '/messages/([0-9a-f]{12})/react', function (b, cid, mid) {
  var u = me(), c = resolveChat(cid, u.id, false); if (!c) throw fail(404, 'Discussion introuvable.');
  var m = findMsg(cid, mid); if (!m) throw fail(404, 'Ce message n’existe plus.');
  m.reacts = m.reacts || {};
  if (EMOJIS.indexOf(b.emoji) < 0 || m.reacts[u.id] === b.emoji) delete m.reacts[u.id]; else m.reacts[u.id] = b.emoji;
  save(); emit('msgupd', { chatId: cid, msg: outMsg(m) });
  return { msg: outMsg(m) };
});
// note : une phrase de 60 caractères max, visible 24 h au-dessus de ton avatar
route('POST', '/api/note', function (b) {
  var u = me(), text = str(b.text, 60); db.notes = db.notes || {};
  var n = { by: u.id, text: text, at: Date.now() };
  if (text) db.notes[u.id] = n; else delete db.notes[u.id];
  save(); emit('note', n);
  // un contact d'exemple répond parfois à ta note
  if (text) setTimeout(function () {
    var bt = pick(bots()), ids = [u.id, bt.id].sort(), cid = 'dm-' + ids[0] + '-' + ids[1], c = resolveChat(cid, u.id, true); if (!c) return;
    var m = { id: rid(12), by: bt.id, at: Date.now(), text: pick(['Haha ta note 😂', 'Grave !', 'Moi aussi', 'Raconte']), reply: 'note', ref: text };
    (db.msgs[cid] = db.msgs[cid] || []).push(m); c.lastAt = m.at; c.lastText = m.text; c.lastBy = bt.id; markDay(c, bt.id, m.at); save();
    emit('msg', { chatId: cid, msg: outMsg(m) }); emit('chat', outChat(c));
  }, 6000 + Math.random() * 3000);
  return { note: n };
});
route('POST', '/api/typing', function () { return { ok: true }; });

window.BulleLocal = {
  call: function (method, url, body) {
    return load().then(function () {
      var p = url.split('?')[0];
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i]; if (r.method !== method) continue;
        var m = r.re.exec(p); if (!m) continue;
        // copie profonde : l'app ne doit jamais modifier les données enregistrées directement
        return JSON.parse(JSON.stringify(r.fn.apply(null, [body || {}].concat(m.slice(1)))));
      }
      throw fail(404, 'Action inconnue.');
    });
  },
  subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
  persistent: function () { return !memOnly; }
};
})();
