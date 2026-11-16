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
function pubUser(u) { return { id: u.id, handle: u.handle, name: u.name || u.handle, bio: u.bio || '', avatar: u.avatar || '', admin: u.id === db.me, bot: !!u.bot }; }
function outPost(p) { return { id: p.id, by: p.by, caption: p.caption, at: p.at, img: p.image, likes: Object.keys(p.likes || {}), comments: p.comments || [] }; }
function outStory(s) { return { id: s.id, by: s.by, text: s.text, at: s.at, img: s.image }; }
function outMsg(m) { return { id: m.id, by: m.by, at: m.at, text: m.text || '', img: m.image || '', reply: m.reply || null }; }
function outChat(c) { return { id: c.id, kind: c.kind, members: c.members, lastAt: c.lastAt, lastText: c.lastText, lastBy: c.lastBy }; }
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
  var mk = function (handle, name, bio) { var u = { id: rid(12), handle: handle, name: name, bio: bio, avatar: '', bot: true, createdAt: now }; db.users[u.id] = u; return u.id; };
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
}
var LINES = ['Trop bien 😄', 'Haha grave', 'J’arrive dans 10 min', 'Envoie la photo !', 'Ok ça marche', 'Je te dis ça ce soir', 'Attends je regarde', 'Carrément', 'T’es où là ?', 'Mdr'];
var COMMENTS = ['Trop belle !', 'J’adore', 'Wow', 'La lumière 😍', 'Elle est où ?', 'Magnifique'];
var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
function botReply(c) {
  var b = c.kind === 'dm' ? db.users[c.members.find(function (m) { return m !== db.me; })] : pick(bots().filter(function (u) { return u.handle !== 'ines_b'; }));
  if (!b || !b.bot) return;
  setTimeout(function () { emit('typing', { chatId: c.id, by: b.id }); }, 700);
  setTimeout(function () {
    var m = { id: rid(12), by: b.id, at: Date.now(), text: pick(LINES) };
    var cur = db.chats[c.id]; if (!cur) return;
    (db.msgs[c.id] = db.msgs[c.id] || []).push(m);
    cur.lastAt = m.at; cur.lastText = m.text; cur.lastBy = b.id; save();
    emit('msg', { chatId: c.id, msg: outMsg(m) }); emit('chat', outChat(cur));
  }, 2400 + Math.random() * 1200);
}
function botsReactTo(postId) {
  bots().forEach(function (b, i) {
    if (Math.random() < 0.25) return;
    setTimeout(function () { var p = db.posts[postId]; if (!p) return; p.likes[b.id] = true; save(); emit('post', outPost(p)); }, 2500 + i * 1800 + Math.random() * 1500);
  });
  setTimeout(function () { var p = db.posts[postId]; if (!p) return; var b = pick(bots()); p.comments.push({ id: rid(10), by: b.id, text: pick(COMMENTS), at: Date.now() }); save(); emit('post', outPost(p)); }, 7000 + Math.random() * 3000);
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
  var u = { id: rid(12), handle: handle, name: str(b.name, 40) || handle, bio: '', avatar: '', createdAt: Date.now() };
  db.users[u.id] = u; db.me = u.id; seed(u.id); save();
  return { me: pubUser(u) };
}
route('POST', '/api/register', register);
route('POST', '/api/login', register);
route('POST', '/api/logout', function () { db = empty(); save(); return { ok: true }; });
route('GET', '/api/state', function () {
  var u = me(), cut = Date.now() - DAY;
  Object.values(db.stories).forEach(function (s) { if (s.at < cut) delete db.stories[s.id]; });
  var online = [u.id].concat(bots().filter(function (b) { return b.handle !== 'ines_b'; }).map(function (b) { return b.id; }));
  return {
    me: pubUser(u), users: Object.values(db.users).map(pubUser),
    posts: Object.values(db.posts).sort(function (a, b) { return b.at - a.at; }).map(outPost),
    stories: Object.values(db.stories).sort(function (a, b) { return a.at - b.at; }).map(outStory),
    chats: Object.values(db.chats).filter(function (c) { return canSee(c, u.id); }).map(outChat),
    online: online
  };
});
route('PUT', '/api/profile', function (b) {
  var u = me();
  if (typeof b.name === 'string') u.name = str(b.name, 40) || u.handle;
  if (typeof b.bio === 'string') u.bio = str(b.bio, 150);
  if (b.avatar) u.avatar = image(b.avatar);
  if (b.removeAvatar) u.avatar = '';
  save(); emit('user', pubUser(u)); return { me: pubUser(u) };
});
route('POST', '/api/posts', function (b) {
  var u = me(); var p = { id: rid(12), by: u.id, caption: str(b.caption, 2200), image: image(b.image), at: Date.now(), likes: {}, comments: [] };
  db.posts[p.id] = p; save(); botsReactTo(p.id); return { post: outPost(p) };
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
  var u = me(); var s = { id: rid(12), by: u.id, text: str(b.text, 80), image: image(b.image), at: Date.now() };
  db.stories[s.id] = s; save(); return { story: outStory(s) };
});
route('DELETE', '/api/stories/([0-9a-f]{12})', function (b, id) { me(); delete db.stories[id]; save(); return { ok: true }; });
route('GET', '/api/chats/' + CHAT + '/messages', function (b, cid) {
  var u = me(), c = resolveChat(cid, u.id, false); if (!c) throw fail(404, 'Discussion introuvable.');
  return { chat: outChat(c), messages: (db.msgs[cid] || []).slice(-200).map(outMsg) };
});
route('POST', '/api/chats/' + CHAT + '/messages', function (b, cid) {
  var u = me(), c = resolveChat(cid, u.id, true); if (!c) throw fail(404, 'Discussion introuvable.');
  var text = str(b.text, 2000), img = b.image ? image(b.image) : '';
  if (!text && !img) throw fail(400, 'Le message est vide.');
  var m = { id: rid(12), by: u.id, at: Date.now(), text: text, image: img, reply: b.reply === 'snap' ? 'snap' : null };
  var list = (db.msgs[cid] = db.msgs[cid] || []); list.push(m); while (list.length > 300) list.shift();
  c.lastAt = m.at; c.lastText = text ? text.slice(0, 90) : 'Photo'; c.lastBy = u.id; save();
  botReply(c);
  return { msg: outMsg(m), chat: outChat(c) };
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
