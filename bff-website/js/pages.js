/* ============================================================
   pages.js — 每一頁要做的事
   ============================================================ */

const ZODIAC = [ // [到這天為止（月*100+日）, 星座]
  [119, '摩羯座'], [218, '水瓶座'], [320, '雙魚座'], [419, '牡羊座'], [520, '金牛座'], [620, '雙子座'],
  [722, '巨蟹座'], [822, '獅子座'], [922, '處女座'], [1022, '天秤座'], [1121, '天蠍座'], [1221, '射手座'], [1231, '摩羯座'],
];

const Pages = {
  /* ---------------- /userinfo ---------------- */
  interests: [],

  initUserinfo() {
    const form = $('#userinfo-form');
    const input = $('#ui-interest');
    const birthday = $('#ui-birthday');
    birthday.max = new Date().toISOString().slice(0, 10);

    const addTag = text => {
      const tag = text.trim().replace(/[,，、]/g, '');
      if (tag && !this.interests.includes(tag) && this.interests.length < 8) this.interests.push(tag);
      input.value = '';
      this.drawTags();
    };

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
        e.preventDefault();
        addTag(input.value);
      } else if (e.key === 'Backspace' && !input.value && this.interests.length) {
        this.interests.pop();
        this.drawTags();
      }
    });
    input.addEventListener('blur', () => input.value && addTag(input.value));
    $('#ui-tags').addEventListener('click', e => {
      const x = e.target.closest('[data-remove]');
      if (x) {
        this.interests.splice(Number(x.dataset.remove), 1);
        this.drawTags();
      } else {
        input.focus();
      }
    });
    $('#ui-suggest').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) addTag(b.textContent);
    });
    birthday.addEventListener('input', () => this.showZodiac());

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (input.value) addTag(input.value);
      const name = $('#ui-name').value.trim();
      if (!name) {
        $('#ui-error').textContent = '請輸入使用者名稱 ✦';
        $('#ui-name').focus();
        return;
      }
      Store.set('user', { name, birthday: birthday.value, interests: this.interests });
      $('#ui-error').textContent = '';
      location.hash = '#/home';
    });
  },

  userinfo() {
    const user = Store.user() || { name: '', birthday: '', interests: [] };
    $('#ui-name').value = user.name;
    $('#ui-birthday').value = user.birthday;
    this.interests = [...user.interests];
    this.drawTags();
    this.showZodiac();
    $('#ui-error').textContent = '';
  },

  drawTags() {
    const box = $('#ui-tags');
    $$('.tag', box).forEach(t => t.remove());
    this.interests.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.textContent = tag;
      const x = document.createElement('button');
      x.type = 'button';
      x.dataset.remove = i;
      x.textContent = '×';
      x.setAttribute('aria-label', '移除 ' + tag);
      chip.append(x);
      box.insertBefore(chip, $('#ui-interest'));
    });
    $('#ui-suggest').replaceChildren(...INTEREST_SUGGESTIONS.filter(s => !this.interests.includes(s)).map(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s;
      return b;
    }));
  },

  showZodiac() {
    const v = $('#ui-birthday').value;
    const md = v ? Number(v.slice(5, 7)) * 100 + Number(v.slice(8, 10)) : 0;
    $('#ui-zodiac').textContent = md ? '・' + ZODIAC.find(([end]) => md <= end)[1] : '';
  },

  /* ---------------- /home ---------------- */
  home(root) {
    const feed = $('#feed', root);
    $('.greet-name', root).textContent = Store.user().name;
    Store.posts().forEach(p => {
      const card = cloneTemplate('tpl-post-card');
      card.href = '#/home-2?id=' + encodeURIComponent(p.id);
      this.fillPost(card, p);
      feed.append(card);
    });
    // 從完整貼文回來時，捲回剛剛的位置
    feed.scrollTop = Store.sget('feedScroll', 0);
    return () => Store.sset('feedScroll', feed.scrollTop);
  },

  fillPost(el, p) {
    $('.mini-avatar', el).textContent = firstLetter(p.author);
    $('.post-author', el).textContent = p.author;
    $('.post-title', el).textContent = p.title;
    $('.post-date', el).textContent = formatDate(p.date);
    $('.post-date', el).dateTime = new Date(p.date).toISOString().slice(0, 10);
    // 列表只顯示前兩行，所以把換行合併成空白
    $('.post-text', el).textContent = el.matches('.post-card') ? p.text.replace(/\s*\n+\s*/g, ' ') : p.text;
    const img = $('.post-img', el);
    if (p.image) {
      // 拍貼照（比較方）整張顯示，寬的風景圖就裁切填滿
      img.addEventListener('load', () => img.classList.toggle('whole', img.naturalWidth / img.naturalHeight < 1.8), { once: true });
      img.src = p.image;
      img.alt = p.title;
    } else {
      img.remove();
    }
  },

  /* ---------------- /home-2 ---------------- */
  postDetail(root, query) {
    const post = Store.posts().find(p => p.id === query.get('id'));
    if (!post) {
      toast('找不到這篇貼文');
      location.replace('#/home');
      return;
    }
    this.fillPost(root, post);
    const del = $('[data-delete]', root);
    del.hidden = !post.mine;
    del.addEventListener('click', () => {
      if (!confirm('確定要刪除這篇貼文嗎？')) return;
      Store.deletePost(post.id);
      toast('貼文已刪除');
      location.hash = '#/home';
    });
  },

  /* ---------------- /music ---------------- */
  music(root) {
    const list = $('#track-list', root);
    const rows = TRACKS.map((t, i) => {
      const li = cloneTemplate('tpl-track-row');
      $('.track-cover', li).src = t.cover;
      $('.track-name', li).textContent = t.title;
      $('.track-mood', li).textContent = t.mood;
      $('.track-len', li).textContent = formatTime(t.duration);
      $('.track-row', li).addEventListener('click', () => (i === Player.index ? Player.toggle() : Player.play(i)));
      list.append(li);
      return $('.track-row', li);
    });
    const mark = index => {
      $('[data-current]', root).textContent = TRACKS[index].title;
      rows.forEach((r, i) => {
        r.classList.toggle('current', i === index);
        r.setAttribute('aria-current', i === index ? 'true' : 'false');
        r.setAttribute('aria-label', `${TRACKS[i].title}，${i === index && !Player.audio.paused ? '暫停' : '播放'}`);
      });
    };
    mark(Player.index);
    rows[Player.index].scrollIntoView({ block: 'nearest' });
    return Player.onChange(mark);
  },

  /* ---------------- /post ---------------- */
  post(root) {
    const form = $('#post-form', root);
    const title = $('#post-title', root);
    const text = $('#post-text', root);
    const wrap = $('#post-img-wrap', root);
    const img = $('#post-img', root);
    const file = $('#post-file', root);
    const count = $('#post-count', root);
    let image = Store.sget('draftImage', null);

    $('#post-date', root).textContent = formatDate(Date.now());
    const draft = Store.sget('draftPost', { title: '', text: '' });
    title.value = draft.title;
    text.value = draft.text;

    const showImage = () => {
      wrap.hidden = !image;
      if (image) img.src = image;
      Store.sset('draftImage', image);
    };
    const keepDraft = () => {
      count.textContent = `${text.value.length} / 2000`;
      Store.sset('draftPost', { title: title.value, text: text.value });
    };
    const useFile = async f => {
      if (!f || !f.type.startsWith('image/')) return toast('請選擇圖片檔喔');
      try {
        image = await shrinkImage(await fileToDataURL(f), 1000, 0.82);
        showImage();
      } catch {
        toast('這張圖片打不開，換一張試試看');
      }
    };

    title.addEventListener('input', keepDraft);
    text.addEventListener('input', keepDraft);
    $('#post-upload', root).addEventListener('click', () => file.click());
    file.addEventListener('change', () => useFile(file.files[0]));
    $('#post-img-remove', root).addEventListener('click', () => { image = null; showImage(); });
    const compose = $('#compose', root);
    compose.addEventListener('dragover', e => { e.preventDefault(); compose.classList.add('drag'); });
    compose.addEventListener('dragleave', e => { if (!compose.contains(e.relatedTarget)) compose.classList.remove('drag'); });
    compose.addEventListener('drop', e => {
      e.preventDefault();
      compose.classList.remove('drag');
      useFile(e.dataTransfer.files[0]);
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!title.value.trim()) { toast('幫貼文取個標題吧 ✦'); title.focus(); return; }
      if (!text.value.trim() && !image) { toast('寫點內容或放一張圖片吧'); text.focus(); return; }
      const post = {
        id: 'p' + Date.now(),
        author: Store.user().name,
        title: title.value.trim(),
        text: text.value.trim(),
        image: image || '',
        date: new Date().toISOString(),
        created: Date.now(),
      };
      if (!Store.addPost(post)) {
        toast('儲存空間滿了 🥲 請先刪掉幾篇有圖片的貼文');
        return;
      }
      Store.sset('draftPost', null);
      Store.sset('draftImage', null);
      Store.sset('feedScroll', 0);
      toast('發佈成功 ✦');
      location.hash = '#/home-2?id=' + post.id;
    });

    showImage();
    keepDraft();
    if (!title.value) title.focus({ preventScroll: true });
  },
};
