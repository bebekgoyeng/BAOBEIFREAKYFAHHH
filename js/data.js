/* ============================================================
   data.js — 歌曲清單與預設貼文
   想換成你們自己的歌：把 mp3 放進 audio/，封面放進 img/covers/，
   再改下面的 TRACKS 就好（duration 是秒數，只是載入前先顯示用）。
   ============================================================ */

const TRACKS = [
  { id: 'aqua-bubble',    title: 'Aqua Bubble',    artist: 'BFF Radio', mood: '清透泡泡・晴天好心情',   src: 'audio/aqua-bubble.mp3',    cover: 'img/covers/cover-1.svg', duration: 79 },
  { id: 'mint-hologram',  title: 'Mint Hologram',  artist: 'BFF Radio', mood: '綠草地・陽光・小蝴蝶',   src: 'audio/mint-hologram.mp3',  cover: 'img/covers/cover-2.svg', duration: 68 },
  { id: 'pink-cloud-pop', title: 'Pink Cloud Pop', artist: 'BFF Radio', mood: '粉紅雲朵・星星亮晶晶',   src: 'audio/pink-cloud-pop.mp3', cover: 'img/covers/cover-3.svg', duration: 64 },
  { id: 'crystal-lagoon', title: 'Crystal Lagoon', artist: 'BFF Radio', mood: '海底水族館・慢慢放空',   src: 'audio/crystal-lagoon.mp3', cover: 'img/covers/cover-4.svg', duration: 94 },
  { id: 'dial-up-dream',  title: 'Dial-Up Dream',  artist: 'BFF Radio', mood: 'Y2K 光碟・格子地板',     src: 'audio/dial-up-dream.mp3',  cover: 'img/covers/cover-5.svg', duration: 72 },
  { id: 'glossy-sky',     title: 'Glossy Sky',     artist: 'BFF Radio', mood: '彩虹天空・放學後散步',   src: 'audio/glossy-sky.mp3',     cover: 'img/covers/cover-6.svg', duration: 86 },
];

/* 預設貼文：讓首頁一開始不會空空的（使用者自己發的文會排在前面） */
const SEED_POSTS = [
  {
    id: 'seed-welcome',
    author: 'BFF 小編',
    title: '歡迎來到 BFF ✦',
    date: '2026-10-26',
    image: 'img/posts/post-1.svg',
    text: '嗨嗨！這裡是 BAOBEIFREAKYFAHHH，一個可以一起聽歌、拍照、分享心情的小宇宙。\n\n' +
          '在 Music 挑一首喜歡的歌，它會在你逛網站的時候一直陪著你；到 Photobooth 拍一張照片或上傳照片，選一個相框、貼滿貼紙，就可以存下來或直接發文。\n\n' +
          '想說什麼都可以到 Post 寫下來，配一張圖更好看喔！',
  },
  {
    id: 'seed-aquarium',
    author: 'aqua.kid',
    title: '今天的水族館好療癒',
    date: '2026-10-24',
    image: 'img/posts/post-2.svg',
    text: '放學跟朋友去水族館，整面玻璃牆的藍色真的會讓人整個放鬆下來。粉紅色的小魚一直在我面前游來游去，好像在跟我打招呼 🐟\n\n' +
          '回家路上一直重複聽 Crystal Lagoon，感覺還在水裡一樣。推薦大家找一天去發呆一下！',
  },
  {
    id: 'seed-y2k',
    author: 'mint.soda',
    title: 'Y2K 穿搭靈感筆記',
    date: '2026-10-21',
    image: '',
    text: '最近超迷 Frutiger Aero 的配色：水藍、薄荷綠、粉紅色，再加一點點亮面材質。\n\n' +
          '1. 透明感的包包或手機殼，越像泡泡越好\n2. 銀色、彩虹光的小配件（像光碟反光那種！）\n3. 白色球鞋配淺色系襪子\n4. 頭髮夾上星星或蝴蝶髮夾\n\n' +
          '重點是「乾淨又閃亮」，整體看起來像 2000 年代的電腦桌布就對了 ✦',
  },
];

/* 興趣建議（只是建議，使用者可以輸入任何興趣） */
const INTEREST_SUGGESTIONS = ['音樂', '拍照', '穿搭', '動漫', '遊戲', '旅行', '美食', '畫畫'];
