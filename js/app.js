/* ============================================================
   app.js — 換頁（router）與網站啟動
   網址用 # 來換頁：index.html#/home、#/music …
   這樣整個網站是同一頁，音樂才不會因為換頁而中斷。
   ============================================================ */

const ROUTES = {
  '/':             { view: 'start', title: 'BFF ✦ BAOBEIFREAKYFAHHH' },
  '/userinfo':     { view: 'userinfo', title: '個人資料' },
  '/home':         { nav: 'home', tpl: 'tpl-home', title: 'Home', render: root => Pages.home(root) },
  '/home-2':       { nav: 'home', tpl: 'tpl-post-detail', title: '貼文', render: (root, q) => Pages.postDetail(root, q) },
  '/music':        { nav: 'music', tpl: 'tpl-music', title: 'Music', render: root => Pages.music(root) },
  '/photobooth':   { nav: 'photobooth', tpl: 'tpl-booth-1', title: 'Photobooth', render: root => Booth.step1(root) },
  '/photobooth-2': { nav: 'photobooth', tpl: 'tpl-booth-2', title: 'Photobooth・選相框', render: root => Booth.step2(root) },
  '/photobooth-3': { nav: 'photobooth', tpl: 'tpl-booth-3', title: 'Photobooth・貼貼紙', render: root => Booth.step3(root) },
  '/post':         { nav: 'post', tpl: 'tpl-post', title: 'Post', render: root => Pages.post(root) },
};

let leavePage = null; // 上一頁留下的收尾工作（例如關相機）

function route() {
  leavePage?.();
  leavePage = null;

  const [path, query] = (location.hash.slice(1) || '/').split('?');
  const page = ROUTES[path] || ROUTES['/'];
  const user = Store.user();

  if (page.tpl && !user) {
    toast('先建立你的 BFF 檔案吧！');
    location.replace('#/userinfo');
    return;
  }

  $('#view-start').hidden = page.view !== 'start';
  $('#view-userinfo').hidden = page.view !== 'userinfo';
  $('#app-shell').hidden = !page.tpl;
  document.body.classList.toggle('in-app', !!page.tpl);
  document.body.dataset.page = page.view || page.nav;
  document.title = page.view === 'start' ? page.title : `${page.title} ・ BFF`;

  if (page.view === 'userinfo') Pages.userinfo();
  if (!page.tpl) return;

  $$('.mainnav [data-nav]').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === page.nav);
    if (a.dataset.nav === page.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $('#avatar-letter').textContent = firstLetter(user.name);

  const content = $('#content');
  content.replaceChildren(cloneTemplate(page.tpl));
  content.classList.remove('enter');
  void content.offsetWidth;
  content.classList.add('enter');
  leavePage = page.render(content, new URLSearchParams(query)) || null;
}

/* 背景漂浮泡泡 */
function makeBubbles() {
  const box = $('#bubbles');
  for (let i = 0; i < 16; i++) {
    const b = new Image();
    b.src = i % 4 ? 'img/elements/bubble.svg' : 'img/elements/bubble-pink.svg';
    b.alt = '';
    const size = 18 + Math.random() * 70;
    b.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `animation-duration:${16 + Math.random() * 22}s,${4 + Math.random() * 4}s;animation-delay:${-Math.random() * 30}s,${-Math.random() * 4}s;`;
    box.append(b);
  }
}

Pages.initUserinfo();
Player.init();
makeBubbles();
window.addEventListener('hashchange', route);
route();
