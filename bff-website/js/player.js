/* ============================================================
   player.js — 左邊的音樂播放器
   播放器在每一頁都是同一個，所以換頁音樂不會停。
   ============================================================ */

const Player = {
  index: 0,
  listeners: [],
  seeking: false,
  lastSave: 0,

  init() {
    this.audio = $('#audio');
    this.el = {
      panel: $('#player'), cover: $('#pl-cover'), cdLabel: $('#pl-cd-label'), title: $('#pl-title'), sub: $('#pl-sub'),
      play: $('#pl-play'), seek: $('#pl-seek'), cur: $('#pl-cur'), dur: $('#pl-dur'),
    };

    const saved = Store.get('player', { index: 0, time: 0 });
    this.load(Math.min(saved.index, TRACKS.length - 1), false, saved.time);

    this.el.play.addEventListener('click', () => this.toggle());
    $('#pl-skip').addEventListener('click', () => this.next());
    $('#pl-replay').addEventListener('click', () => this.replay());

    this.el.seek.addEventListener('input', () => {
      this.seeking = true;
      this.el.cur.textContent = formatTime(this.el.seek.value / 1000 * this.duration());
      this.paintSeek();
    });
    this.el.seek.addEventListener('change', () => {
      this.audio.currentTime = this.el.seek.value / 1000 * this.duration();
      this.seeking = false;
    });

    this.audio.addEventListener('play', () => this.setPlaying(true));
    this.audio.addEventListener('pause', () => this.setPlaying(false));
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('loadedmetadata', () => { this.el.dur.textContent = formatTime(this.audio.duration); });
    this.audio.addEventListener('timeupdate', () => {
      if (!this.seeking) {
        this.el.seek.value = this.audio.currentTime / this.duration() * 1000 || 0;
        this.el.cur.textContent = formatTime(this.audio.currentTime);
        this.paintSeek();
      }
      if (Date.now() - this.lastSave > 2000) this.save();
    });
    this.audio.addEventListener('error', () => toast('找不到這首歌的音樂檔 🥲'));
    window.addEventListener('pagehide', () => this.save());

    // 空白鍵 = 播放 / 暫停（打字的時候不算）
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || e.target.closest('input, textarea, button, a, [contenteditable]')) return;
      if ($('#app-shell').hidden) return;
      e.preventDefault();
      this.toggle();
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.audio.play());
      navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.replay());
    }
  },

  duration() {
    return isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : TRACKS[this.index].duration;
  },

  load(i, autoplay, startAt = 0) {
    this.index = (i + TRACKS.length) % TRACKS.length;
    const t = TRACKS[this.index];
    this.audio.src = t.src;
    if (startAt) this.audio.addEventListener('loadedmetadata', () => { this.audio.currentTime = startAt; }, { once: true });
    this.el.cover.src = t.cover;
    this.el.cover.alt = t.title + ' 封面';
    this.el.cdLabel.style.backgroundImage = `url("${t.cover}")`;
    this.el.title.textContent = t.title;
    this.el.sub.textContent = t.mood;
    this.el.dur.textContent = formatTime(t.duration);
    this.el.cur.textContent = formatTime(startAt);
    this.el.seek.value = startAt / t.duration * 1000;
    this.paintSeek();
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'BFF' });
    if (autoplay) this.audio.play().catch(() => toast('瀏覽器擋住自動播放，請按一下播放鍵 ▶'));
    this.listeners.forEach(fn => fn(this.index));
    this.save();
  },

  play(i) {
    if (i === undefined || i === this.index) this.audio.play().catch(() => toast('無法播放這首歌 🥲'));
    else this.load(i, true);
  },

  toggle() {
    if (this.audio.paused) this.play();
    else this.audio.pause();
  },

  next() {
    this.load(this.index + 1, true);
  },

  /* 播超過 3 秒：從頭重播；剛開始播：回上一首 */
  replay() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      if (this.audio.paused) this.play();
    } else {
      this.load(this.index - 1, true);
    }
  },

  setPlaying(on) {
    this.el.panel.classList.toggle('is-playing', on);
    document.body.classList.toggle('music-on', on);
    this.el.play.setAttribute('aria-label', on ? '暫停' : '播放');
    this.listeners.forEach(fn => fn(this.index));
  },

  paintSeek() {
    this.el.seek.style.setProperty('--fill', (this.el.seek.value / 10) + '%');
  },

  save() {
    this.lastSave = Date.now();
    Store.set('player', { index: this.index, time: this.audio.currentTime || 0 });
  },

  onChange(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  },
};
