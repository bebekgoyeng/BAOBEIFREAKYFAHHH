/* ============================================================
   stickers.js — 拍貼用的「相框」和「貼紙」
   全部用 SVG 寫在這裡（不是讀 img 檔），這樣就算直接雙擊 index.html
   開網站，拍完照也能正常「儲存照片」。
   想加自己畫的貼紙：在 STICKERS 裡加一筆 { id, name, src: 'img/stickers/xxx.png' }
   （用 png 檔的話，要用 VS Code Live Server 或架站開網站才能存圖）。
   ============================================================ */

const C = { cyan: '#4cffff', green: '#48ff65', pink: '#ffa4fb', ink: '#0b4a63' };
const FONT = "'Arial Black','Arial Rounded MT Bold',Arial,sans-serif";

/* width / height 要寫，Firefox 才畫得進 canvas；貼紙用 2 倍大，存圖比較清楚 */
function wrapSvg(body, defs = '', viewBox = '0 0 200 200') {
  const [, , w, h] = viewBox.split(' ').map(Number);
  const k = w < 400 ? 2 : 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w * k}" height="${h * k}"><defs>${defs}</defs>${body}</svg>`;
}

function svgSrc(item) {
  return item.src || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg);
}

/* 四角星（和署名條上的星星同款） */
function sparkle(cx, cy, s, fill = C.green, stroke = C.pink, sw = s * 0.12) {
  const k = s * 0.16;
  return `<path d="M${cx},${cy - s} C${cx + k},${cy - k} ${cx + k},${cy - k} ${cx + s},${cy} ` +
    `C${cx + k},${cy + k} ${cx + k},${cy + k} ${cx},${cy + s} C${cx - k},${cy + k} ${cx - k},${cy + k} ${cx - s},${cy} ` +
    `C${cx - k},${cy - k} ${cx - k},${cy - k} ${cx},${cy - s}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

const BUBBLE_DEFS = `
  <radialGradient id="bub" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".7" stop-color="#c8fdff" stop-opacity=".3"/>
    <stop offset=".92" stop-color="${C.cyan}" stop-opacity=".85"/><stop offset="1" stop-color="#fff"/>
  </radialGradient>
  <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

function bubble(cx, cy, r) {
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bub)"/>` +
    `<ellipse cx="${cx - r * .3}" cy="${cy - r * .42}" rx="${r * .42}" ry="${r * .24}" fill="url(#shine)" transform="rotate(-28 ${cx - r * .3} ${cy - r * .42})"/>` +
    `<circle cx="${cx + r * .45}" cy="${cy + r * .42}" r="${r * .08}" fill="#fff" opacity=".9"/></g>`;
}

/* 亮面高光（Frutiger Aero 的招牌光澤） */
function gloss(cx, cy, rx, ry, rot = -20) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shine)" opacity=".9" transform="rotate(${rot} ${cx} ${cy})"/>`;
}

function heartPath(cx, cy, s) {
  const p = (x, y) => `${cx + (x - 100) * s},${cy + (y - 100) * s}`;
  return `M${p(100, 172)} C${p(40, 130)} ${p(14, 98)} ${p(22, 64)} C${p(30, 30)} ${p(74, 22)} ${p(100, 56)} ` +
    `C${p(126, 22)} ${p(170, 30)} ${p(178, 64)} C${p(186, 98)} ${p(160, 130)} ${p(100, 172)}Z`;
}

function starPath(cx, cy, R, r, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = (-90 + i * 180 / points) * Math.PI / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
}

function cdWedges(cx, cy, R) {
  const cols = ['#f4f8ff', '#ffd3f8', '#d7c9ff', '#c4f2ff', '#d6fff0', '#ffffff', '#ffe9f6', '#9ff7ff', '#e9e9f5', '#ffc9f3', '#bfffd2'];
  let out = '';
  for (let i = 0; i < 44; i++) {
    const a0 = 2 * Math.PI * i / 44, a1 = 2 * Math.PI * (i + 1.08) / 44;
    out += `<path d="M${cx},${cy} L${(cx + R * Math.cos(a0)).toFixed(1)},${(cy + R * Math.sin(a0)).toFixed(1)} ` +
      `A${R},${R} 0 0 1 ${(cx + R * Math.cos(a1)).toFixed(1)},${(cy + R * Math.sin(a1)).toFixed(1)}Z" fill="${cols[(i * 4) % cols.length]}"/>`;
  }
  return out;
}

/* ============================================================
   相框：畫布 1250 × 1000（5:4），win = 照片要放的位置
   ============================================================ */
const FRAMES = [
  {
    id: 'aqua',
    name: '泡泡水族',
    win: { x: 95, y: 95, w: 1060, h: 810, r: 40 },
    svg: wrapSvg(`
      <g mask="url(#hole)">
        <rect width="1250" height="1000" rx="60" fill="url(#body)"/>
        <rect width="1250" height="430" rx="60" fill="url(#shine)" opacity=".55"/>
        ${Array.from({ length: 26 }, (_, i) => `<circle cx="${30 + i * 48}" cy="960" r="${6 + (i % 3) * 3}" fill="#fff" opacity=".7"/>`).join('')}
      </g>
      <rect x="95" y="95" width="1060" height="810" rx="40" fill="none" stroke="#fff" stroke-width="12"/>
      <rect x="7" y="7" width="1236" height="986" rx="56" fill="none" stroke="#fff" stroke-width="14"/>
      ${bubble(70, 120, 62)}${bubble(150, 40, 30)}${bubble(1180, 860, 74)}${bubble(1080, 955, 34)}
      ${bubble(1200, 300, 28)}${bubble(40, 640, 36)}${bubble(620, 40, 22)}
      ${sparkle(1170, 70, 46)}${sparkle(80, 930, 38, C.pink, '#fff')}
      <text x="590" y="972" text-anchor="end" font-family="${FONT}" font-size="56" fill="#fff" stroke="#11b9d0" stroke-width="10" paint-order="stroke" textLength="150" lengthAdjust="spacingAndGlyphs">BFF</text>
      ${sparkle(625, 952, 22, C.pink, '#fff', 4)}
      <text x="660" y="972" font-family="${FONT}" font-size="56" fill="#fff" stroke="#11b9d0" stroke-width="10" paint-order="stroke" textLength="190" lengthAdjust="spacingAndGlyphs">AQUA</text>`,
      `${BUBBLE_DEFS}
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8fdff"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="#10c2dc"/></linearGradient>
      <mask id="hole"><rect width="1250" height="1000" fill="#fff"/><rect x="95" y="95" width="1060" height="810" rx="40" fill="#000"/></mask>`,
      '0 0 1250 1000'),
  },
  {
    id: 'pink',
    name: '粉紅網點',
    win: { x: 100, y: 100, w: 1050, h: 690, r: 28 },
    svg: wrapSvg(`
      <g mask="url(#hole)">
        <rect width="1250" height="1000" rx="48" fill="url(#body)"/>
        <rect width="1250" height="1000" fill="url(#dots)" opacity=".75"/>
        <rect width="1250" height="380" fill="url(#shine)" opacity=".45"/>
      </g>
      <rect x="100" y="100" width="1050" height="690" rx="28" fill="none" stroke="#fff" stroke-width="12"/>
      <rect x="7" y="7" width="1236" height="986" rx="44" fill="none" stroke="#fff" stroke-width="14"/>
      <path d="${starPath(1150, 120, 110, 50)}" fill="#fff" stroke="#ff6cf0" stroke-width="10" stroke-linejoin="round"/>
      ${sparkle(1150, 124, 30)}
      <path d="${heartPath(105, 790, .9)}" fill="#ff7cf5" stroke="#fff" stroke-width="10"/>
      ${gloss(80, 750, 26, 12)}
      <text x="625" y="905" text-anchor="middle" font-family="${FONT}" font-size="78" fill="#fff" stroke="#ff5fec" stroke-width="12" paint-order="stroke" textLength="820" lengthAdjust="spacingAndGlyphs">BAOBEIFREAKYFAHHH</text>
      ${sparkle(160, 900, 34)}${sparkle(1090, 900, 34)}`,
      `<linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd8fd"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
      <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="5" fill="#fff"/><circle cx="23" cy="23" r="5" fill="#fff"/></pattern>
      <mask id="hole"><rect width="1250" height="1000" fill="#fff"/><rect x="100" y="100" width="1050" height="690" rx="28" fill="#000"/></mask>`,
      '0 0 1250 1000'),
  },
  {
    id: 'mint',
    name: '薄荷格紋',
    win: { x: 110, y: 140, w: 1030, h: 740, r: 70 },
    svg: wrapSvg(`
      <g mask="url(#hole)">
        <rect width="1250" height="1000" rx="56" fill="#fff"/>
        <rect width="1250" height="1000" fill="url(#check)"/>
        <rect width="1250" height="1000" fill="url(#fadeGreen)"/>
      </g>
      <rect x="110" y="140" width="1030" height="740" rx="70" fill="none" stroke="#fff" stroke-width="22"/>
      <rect x="98" y="128" width="1054" height="764" rx="80" fill="none" stroke="${C.green}" stroke-width="8"/>
      <rect x="7" y="7" width="1236" height="986" rx="52" fill="none" stroke="#fff" stroke-width="14"/>
      <rect x="295" y="28" width="660" height="88" rx="44" fill="url(#pill)" stroke="#fff" stroke-width="8"/>
      <rect x="320" y="36" width="610" height="30" rx="15" fill="#fff" opacity=".55"/>
      <text x="625" y="91" text-anchor="middle" font-family="${FONT}" font-size="44" fill="#fff" stroke="#ff5fec" stroke-width="9" paint-order="stroke" textLength="560" lengthAdjust="spacingAndGlyphs">BEST FRIENDS FOREVER</text>
      ${sparkle(255, 72, 30)}${sparkle(995, 72, 30)}
      ${sparkle(95, 120, 70)}${sparkle(1155, 120, 70)}${sparkle(95, 900, 70)}${sparkle(1155, 900, 70)}`,
      `<pattern id="check" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#a6ffff"/><rect x="30" y="30" width="30" height="30" fill="#a6ffff"/></pattern>
      <linearGradient id="fadeGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${C.green}" stop-opacity=".35"/></linearGradient>
      <linearGradient id="pill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6fe"/><stop offset="1" stop-color="#ff9ef8"/></linearGradient>
      <mask id="hole"><rect width="1250" height="1000" fill="#fff"/><rect x="110" y="140" width="1030" height="740" rx="70" fill="#000"/></mask>`,
      '0 0 1250 1000'),
  },
  {
    id: 'window',
    name: 'BFF.exe 視窗',
    win: { x: 40, y: 135, w: 1170, h: 745, r: 14 },
    svg: wrapSvg(`
      <g mask="url(#hole)">
        <rect width="1250" height="1000" rx="34" fill="url(#body)"/>
        <rect width="1250" height="112" rx="34" fill="url(#bar)"/>
        <rect y="70" width="1250" height="42" fill="url(#bar2)"/>
        <rect x="16" y="10" width="1218" height="44" rx="22" fill="#fff" opacity=".55"/>
      </g>
      <rect x="40" y="135" width="1170" height="745" rx="14" fill="none" stroke="#7fe9f5" stroke-width="8"/>
      <rect x="5" y="5" width="1240" height="990" rx="32" fill="none" stroke="#2cc4dc" stroke-width="10"/>
      <rect x="13" y="13" width="1224" height="974" rx="26" fill="none" stroke="#fff" stroke-width="6"/>
      <circle cx="62" cy="58" r="26" fill="#fff"/><path d="${starPath(62, 60, 20, 9)}" fill="${C.pink}"/>
      <text x="104" y="76" font-family="${FONT}" font-size="46" fill="#fff" stroke="#0a8fa3" stroke-width="9" paint-order="stroke" textLength="470" lengthAdjust="spacingAndGlyphs">BFF.exe - photobooth</text>
      ${[[1040, C.green, 'M1028,58 h24'], [1112, C.cyan, 'M1101,47 h22 v22 h-22z'], [1184, C.pink, 'M1173,47 l22,22 M1195,47 l-22,22']]
        .map(([x, col, d]) => `<circle cx="${x}" cy="58" r="28" fill="${col}" stroke="#fff" stroke-width="6"/><ellipse cx="${x}" cy="46" rx="18" ry="9" fill="#fff" opacity=".7"/><path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      <path d="${heartPath(70, 938, .3)}" fill="${C.pink}" stroke="#fff" stroke-width="3"/>
      <text x="104" y="950" font-family="${FONT}" font-size="36" fill="#0b6a80" textLength="380" lengthAdjust="spacingAndGlyphs">cuteness loading...</text>
      <rect x="600" y="912" width="600" height="50" rx="25" fill="#fff" stroke="#7fe9f5" stroke-width="5"/>
      <rect x="608" y="920" width="584" height="34" rx="17" fill="url(#prog)"/>
      <rect x="616" y="922" width="568" height="12" rx="6" fill="#fff" opacity=".6"/>
      <text x="900" y="949" text-anchor="middle" font-family="${FONT}" font-size="26" fill="#fff" stroke="#139a3c" stroke-width="6" paint-order="stroke" textLength="72" lengthAdjust="spacingAndGlyphs">100%</text>`,
      `<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ffff"/><stop offset="1" stop-color="#c3f5ff"/></linearGradient>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2fdff"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset=".52" stop-color="#14c7de"/><stop offset="1" stop-color="#3fe3f7"/></linearGradient>
      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14c7de"/><stop offset="1" stop-color="#3fe3f7"/></linearGradient>
      <linearGradient id="prog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9ffb7"/><stop offset="1" stop-color="#1fd64a"/></linearGradient>
      <mask id="hole"><rect width="1250" height="1000" fill="#fff"/><rect x="40" y="135" width="1170" height="745" rx="14" fill="#000"/></mask>`,
      '0 0 1250 1000'),
  },
];

/* ============================================================
   貼紙：每張都是 200 × 200 的 SVG
   ============================================================ */
const SHINE = `<linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

function halftoneHeartDots() {
  let dots = '';
  for (let y = 10; y < 195; y += 11) {
    for (let x = 6 + ((y / 11) % 2 ? 5.5 : 0); x < 196; x += 11) {
      const X = (x - 100) / 84, Y = -(y - 108) / 84;
      if ((X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 > 0) continue;
      const r = 5.2 * (0.45 + 0.55 * (1 - Math.min(1, Math.hypot(x - 100, y - 100) / 95)));
      dots += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}"/>`;
    }
  }
  return `<g fill="#ff7cf5">${dots}</g>`;
}

const STICKERS = [
  { id: 'sparkle-green', name: '綠星星', svg: wrapSvg(sparkle(100, 100, 88, C.green, C.pink, 10)) },
  { id: 'sparkle-pink', name: '粉星星', svg: wrapSvg(sparkle(100, 100, 88, C.pink, '#fff', 10)) },
  { id: 'bubble', name: '泡泡', svg: wrapSvg(bubble(100, 100, 92), BUBBLE_DEFS) },
  {
    id: 'heart', name: '愛心',
    svg: wrapSvg(`<path d="${heartPath(100, 100, 1)}" fill="url(#g)" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>${gloss(66, 62, 26, 13, -35)}`,
      `${SHINE}<radialGradient id="g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd6fd"/><stop offset="1" stop-color="#ff4fe6"/></radialGradient>`),
  },
  {
    id: 'star', name: '亮亮星',
    svg: wrapSvg(`<path d="${starPath(100, 108, 90, 42)}" fill="url(#g)" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>${gloss(84, 74, 24, 10, -20)}`,
      `${SHINE}<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ffff"/><stop offset="1" stop-color="#12c5de"/></linearGradient>`),
  },
  {
    id: 'cd', name: '光碟',
    svg: wrapSvg(`<circle cx="100" cy="100" r="92" fill="#eef8ff"/>${cdWedges(100, 100, 92)}<circle cx="100" cy="100" r="92" fill="none" stroke="#fff" stroke-width="5"/>` +
      `<circle cx="100" cy="100" r="30" fill="#fff" opacity=".8"/><circle cx="100" cy="100" r="15" fill="#bdf6ff"/><circle cx="100" cy="100" r="8" fill="#fff"/>${gloss(68, 56, 30, 12, -35)}`, SHINE),
  },
  {
    id: 'butterfly', name: '蝴蝶',
    svg: wrapSvg(`<g transform="translate(100 96)">
      <path d="M0,0 C-30,-70 -95,-60 -80,-15 C-72,10 -30,8 0,0Z" fill="${C.cyan}" stroke="#fff" stroke-width="7"/>
      <path d="M0,0 C30,-70 95,-60 80,-15 C72,10 30,8 0,0Z" fill="${C.cyan}" stroke="#fff" stroke-width="7"/>
      <path d="M0,2 C-25,20 -60,50 -45,62 C-30,72 -8,40 0,2Z" fill="${C.pink}" stroke="#fff" stroke-width="7"/>
      <path d="M0,2 C25,20 60,50 45,62 C30,72 8,40 0,2Z" fill="${C.pink}" stroke="#fff" stroke-width="7"/>
      <ellipse cx="-48" cy="-38" rx="18" ry="8" fill="#fff" opacity=".75" transform="rotate(-30 -48 -38)"/>
      <ellipse cx="48" cy="-38" rx="18" ry="8" fill="#fff" opacity=".75" transform="rotate(30 48 -38)"/>
      <rect x="-5" y="-24" width="10" height="72" rx="5" fill="${C.ink}"/></g>`),
  },
  {
    id: 'fish', name: '小魚',
    svg: wrapSvg(`<g transform="translate(92 100) scale(.95)">
      <path d="M-70,0 C-46,-56 36,-56 58,0 C36,56 -46,56 -70,0Z" fill="url(#g)" stroke="#fff" stroke-width="8"/>
      <path d="M52,0 L100,-40 C90,-12 90,12 100,40Z" fill="url(#g)" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>
      <ellipse cx="-14" cy="-24" rx="38" ry="11" fill="#fff" opacity=".7"/>
      <circle cx="-40" cy="-6" r="9" fill="${C.ink}"/><circle cx="-43" cy="-9" r="3" fill="#fff"/></g>`,
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2fd"/><stop offset="1" stop-color="#ff6fee"/></linearGradient>`),
  },
  {
    id: 'daisy', name: '小雛菊',
    svg: wrapSvg(`${Array.from({ length: 10 }, (_, i) => `<ellipse cx="100" cy="46" rx="20" ry="44" fill="#fff" stroke="#ffc4fb" stroke-width="5" transform="rotate(${i * 36} 100 100)"/>`).join('')}` +
      `<circle cx="100" cy="100" r="30" fill="url(#g)" stroke="#fff" stroke-width="6"/>${gloss(92, 88, 14, 7)}`,
      `${SHINE}<radialGradient id="g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d4ffd9"/><stop offset="1" stop-color="#1fd64a"/></radialGradient>`),
  },
  {
    id: 'cloud', name: '雲朵',
    svg: wrapSvg(`<g fill="#9fdcff" opacity=".45" transform="translate(0 8)"><circle cx="55" cy="112" r="38"/><circle cx="92" cy="86" r="48"/><circle cx="138" cy="98" r="42"/><circle cx="160" cy="122" r="28"/><circle cx="105" cy="122" r="38"/></g>` +
      `<g fill="#fff" stroke="#c9f4ff" stroke-width="4"><circle cx="55" cy="112" r="38"/><circle cx="92" cy="86" r="48"/><circle cx="138" cy="98" r="42"/><circle cx="160" cy="122" r="28"/><circle cx="105" cy="122" r="38"/></g>` +
      `<g fill="#fff"><circle cx="55" cy="112" r="34"/><circle cx="92" cy="86" r="44"/><circle cx="138" cy="98" r="38"/><circle cx="160" cy="122" r="24"/><circle cx="105" cy="122" r="34"/></g>`),
  },
  {
    id: 'drop', name: '水滴',
    svg: wrapSvg(`<path d="M100 14 C100 14 36 92 36 130 A64 64 0 0 0 164 130 C164 92 100 14 100 14Z" fill="url(#g)" stroke="#fff" stroke-width="8"/>${gloss(78, 110, 14, 30, 20)}<circle cx="128" cy="160" r="7" fill="#fff"/>`,
      `${SHINE}<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6ffff"/><stop offset="1" stop-color="#0fbfe0"/></linearGradient>`),
  },
  {
    id: 'note', name: '音符',
    svg: wrapSvg(`<path d="M70 50 L160 30 L160 136" fill="none" stroke="#fff" stroke-width="30" stroke-linejoin="round"/>` +
      `<path d="M70 50 L160 30 L160 136 M70 50 L70 156" fill="none" stroke="url(#g)" stroke-width="16" stroke-linejoin="round"/>` +
      `<path d="M70 50 L70 156" fill="none" stroke="#fff" stroke-width="30"/><path d="M70 50 L70 156" fill="none" stroke="url(#g)" stroke-width="16"/>` +
      `<ellipse cx="52" cy="158" rx="30" ry="24" fill="url(#g)" stroke="#fff" stroke-width="8"/><ellipse cx="142" cy="138" rx="30" ry="24" fill="url(#g)" stroke="#fff" stroke-width="8"/>` +
      `${gloss(44, 150, 12, 6)}${gloss(134, 130, 12, 6)}`,
      `${SHINE}<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.pink}"/><stop offset="1" stop-color="#ff4fe6"/></linearGradient>`),
  },
  {
    id: 'cursor', name: '游標',
    svg: wrapSvg(`<path d="M52 18 L52 166 L90 130 L116 186 L144 174 L118 118 L170 118 Z" fill="#fff" stroke="${C.ink}" stroke-width="9" stroke-linejoin="round"/>` +
      `<path d="M66 50 L66 132 L92 108 Z" fill="${C.cyan}" opacity=".55"/>`),
  },
  {
    id: 'crown', name: '皇冠',
    svg: wrapSvg(`<path d="M28 150 L20 62 L66 100 L100 40 L134 100 L180 62 L172 150 Z" fill="url(#g)" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>` +
      `<rect x="28" y="146" width="144" height="26" rx="10" fill="url(#g)" stroke="#fff" stroke-width="8"/>` +
      `<circle cx="100" cy="118" r="14" fill="${C.cyan}" stroke="#fff" stroke-width="5"/><circle cx="58" cy="128" r="10" fill="${C.green}" stroke="#fff" stroke-width="4"/><circle cx="142" cy="128" r="10" fill="${C.green}" stroke="#fff" stroke-width="4"/>` +
      `${gloss(72, 92, 22, 7, -30)}`,
      `${SHINE}<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0fe"/><stop offset="1" stop-color="#ff7cf5"/></linearGradient>`),
  },
  {
    id: 'bff', name: 'BFF',
    svg: wrapSvg(`<rect x="10" y="52" width="180" height="96" rx="48" fill="url(#g)" stroke="#fff" stroke-width="9"/><rect x="28" y="60" width="144" height="34" rx="17" fill="#fff" opacity=".55"/>` +
      `<text x="100" y="126" text-anchor="middle" font-family="${FONT}" font-size="58" fill="#fff" stroke="#0a9fb5" stroke-width="9" paint-order="stroke" textLength="128" lengthAdjust="spacingAndGlyphs">BFF</text>${sparkle(172, 54, 22)}`,
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ffff"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset=".52" stop-color="#16c8df"/><stop offset="1" stop-color="#46e6f8"/></linearGradient>`),
  },
  {
    id: 'love', name: 'LOVE',
    svg: wrapSvg(`<path d="M36 40 H164 A26 26 0 0 1 190 66 V122 A26 26 0 0 1 164 148 H86 L54 178 L60 148 H36 A26 26 0 0 1 10 122 V66 A26 26 0 0 1 36 40Z" fill="url(#g)" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>` +
      `<rect x="30" y="48" width="140" height="28" rx="14" fill="#fff" opacity=".5"/>` +
      `<text x="100" y="118" text-anchor="middle" font-family="${FONT}" font-size="48" fill="#fff" stroke="#ff4fe6" stroke-width="8" paint-order="stroke" textLength="136" lengthAdjust="spacingAndGlyphs">LOVE</text>`,
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6fd"/><stop offset="1" stop-color="#ff86f6"/></linearGradient>`),
  },
  {
    id: 'smile', name: '笑臉',
    svg: wrapSvg(`<circle cx="100" cy="100" r="84" fill="url(#g)" stroke="#fff" stroke-width="9"/>${gloss(78, 58, 40, 18, -25)}` +
      `<ellipse cx="74" cy="92" rx="10" ry="16" fill="${C.ink}"/><ellipse cx="126" cy="92" rx="10" ry="16" fill="${C.ink}"/>` +
      `<path d="M62 122 Q100 160 138 122" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>` +
      `<circle cx="54" cy="124" r="11" fill="${C.pink}" opacity=".85"/><circle cx="146" cy="124" r="11" fill="${C.pink}" opacity=".85"/>`,
      `${SHINE}<radialGradient id="g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#dcffe0"/><stop offset="1" stop-color="#22d64c"/></radialGradient>`),
  },
  { id: 'halftone-heart', name: '網點愛心', svg: wrapSvg(halftoneHeartDots()) },
  {
    id: 'leaf', name: '葉子',
    svg: wrapSvg(`<path d="M30 170 C20 90 80 24 176 22 C178 112 118 176 30 170Z" fill="url(#g)" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>` +
      `<path d="M38 162 C80 120 120 80 160 38" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>` +
      `<path d="M126 96 C128 96 112 116 112 124 A14 14 0 0 0 140 124 C140 116 126 96 126 96Z" fill="#dffeff" stroke="#fff" stroke-width="4" opacity=".95"/>${gloss(80, 80, 30, 10, -40)}`,
      `${SHINE}<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b5ff9f"/><stop offset="1" stop-color="#12c94a"/></linearGradient>`),
  },
  {
    id: 'wow', name: 'WOW',
    svg: wrapSvg(`<path d="${starPath(100, 100, 96, 70, 14)}" fill="url(#g)" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>` +
      `<text x="100" y="120" text-anchor="middle" font-family="${FONT}" font-size="50" fill="#fff" stroke="#ff4fe6" stroke-width="9" paint-order="stroke" textLength="124" lengthAdjust="spacingAndGlyphs">WOW</text>`,
      `<radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.cyan}"/></radialGradient>`),
  },
  {
    id: 'orb', name: '亮亮球',
    svg: wrapSvg(`<circle cx="100" cy="100" r="86" fill="url(#g)" stroke="#fff" stroke-width="7"/><ellipse cx="100" cy="58" rx="58" ry="34" fill="url(#shine)" opacity=".95"/>` +
      `<ellipse cx="100" cy="166" rx="40" ry="10" fill="#fff" opacity=".35"/>`,
      `${SHINE}<radialGradient id="g" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#c9ffd0"/><stop offset="1" stop-color="#0fb43e"/></radialGradient>`),
  },
];
