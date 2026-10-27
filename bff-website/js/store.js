/* ============================================================
   store.js — 存資料 (localStorage / sessionStorage) 與共用小工具
   注意：資料只存在「這台電腦的這個瀏覽器」，別人看不到你的貼文。
   想讓所有人互相看到貼文，需要接後端（例如 Firebase）。
   ============================================================ */

const Store = {
  memory: {}, // 瀏覽器不給存的時候（無痕模式等），先放在記憶體裡

  read(area, key, fallback) {
    try {
      const raw = window[area].getItem('bff.' + key);
      return raw === null ? (this.memory[area + key] ?? fallback) : JSON.parse(raw);
    } catch {
      return this.memory[area + key] ?? fallback;
    }
  },

  write(area, key, value) {
    this.memory[area + key] = value;
    try {
      if (value === null) window[area].removeItem('bff.' + key);
      else window[area].setItem('bff.' + key, JSON.stringify(value));
      return true;
    } catch {
      return false; // 通常是容量滿了
    }
  },

  get: (key, fallback) => Store.read('localStorage', key, fallback),
  set: (key, value) => Store.write('localStorage', key, value),
  sget: (key, fallback) => Store.read('sessionStorage', key, fallback),
  sset: (key, value) => Store.write('sessionStorage', key, value),

  user: () => Store.get('user', null),

  /* 自己發的文排前面，再接預設貼文 */
  posts() {
    const mine = Store.get('posts', []).map(p => ({ ...p, mine: true }));
    return [...mine, ...SEED_POSTS].sort((a, b) => (b.created || Date.parse(b.date)) - (a.created || Date.parse(a.date)));
  },

  addPost(post) {
    const list = Store.get('posts', []);
    list.unshift(post);
    return Store.set('posts', list);
  },

  deletePost(id) {
    Store.set('posts', Store.get('posts', []).filter(p => p.id !== id));
  },
};

/* ---------- 小工具 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* 日期顯示成 dd/mm/yyyy（照 wireframe） */
function formatDate(value) {
  const d = new Date(value);
  return [d.getDate(), d.getMonth() + 1].map(n => String(n).padStart(2, '0')).join('/') + '/' + d.getFullYear();
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function cloneTemplate(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

/* 讀取使用者選的圖片，縮小並壓縮成 dataURL（避免把儲存空間塞爆） */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function shrinkImage(src, maxSide = 1200, quality = 0.85) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/* 頭像圓圈顯示名字第一個字 */
function firstLetter(name) {
  return [...(name || 'B').trim()][0]?.toUpperCase() || 'B';
}
