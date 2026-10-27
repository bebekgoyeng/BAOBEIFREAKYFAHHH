/* ============================================================
   photobooth.js — 拍貼機三個步驟
   /photobooth    拍照或上傳
   /photobooth-2  選相框
   /photobooth-3  貼貼紙 → 儲存照片 或 發佈
   照片暫存在 sessionStorage（關掉分頁就會清掉）。
   ============================================================ */

const Booth = {
  W: 1250, // 成品尺寸（5:4）
  H: 1000,

  state() {
    return {
      photo: Store.sget('pb.photo', null),
      frame: FRAMES.find(f => f.id === Store.sget('pb.frame', null)),
      stickers: Store.sget('pb.stickers', []),
    };
  },

  setPhoto(dataURL) {
    Store.sset('pb.photo', dataURL);
    Store.sset('pb.stickers', []); // 新照片 = 重新貼
    location.hash = '#/photobooth-2';
  },

  /* 相框 + 照片的預覽（第 2、3 步都會用到） */
  framed(frame, photo) {
    const box = document.createElement('div');
    box.className = 'framed';
    const { x, y, w, h, r } = frame.win;
    const win = document.createElement('div');
    win.className = 'framed-win';
    Object.assign(win.style, {
      left: x / this.W * 100 + '%', top: y / this.H * 100 + '%', width: w / this.W * 100 + '%', height: h / this.H * 100 + '%',
      borderRadius: `${r / w * 100}% / ${r / h * 100}%`,
    });
    const img = new Image();
    img.src = photo;
    img.alt = '你的照片';
    win.append(img);
    const overlay = new Image();
    overlay.src = svgSrc(frame);
    overlay.alt = '';
    overlay.className = 'framed-overlay';
    box.append(win, overlay);
    return box;
  },

  /* ---------------- 第 1 步：拍照或上傳 ---------------- */
  step1(root) {
    const video = $('#booth-video', root);
    const preview = $('#booth-preview', root);
    const camBtn = $('#booth-camera', root);
    const upBtn = $('#booth-upload', root);
    const cancelBtn = $('#booth-cancel', root);
    const fileInput = $('#booth-file', root);
    const count = $('#booth-count', root);
    let stream = null;
    let timer = null;

    const stopCamera = () => {
      clearInterval(timer);
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      video.hidden = true;
      count.hidden = true;
      preview.classList.remove('live');
      camBtn.textContent = '📷 拍照';
      camBtn.disabled = false;
      upBtn.hidden = false;
      cancelBtn.hidden = true;
    };

    const useFile = async file => {
      if (!file || !file.type.startsWith('image/')) return toast('請選擇圖片檔喔');
      try {
        this.setPhoto(await shrinkImage(await fileToDataURL(file), 1600, 0.9));
      } catch {
        toast('這張圖片打不開，換一張試試看');
      }
    };

    camBtn.addEventListener('click', async () => {
      if (!stream) {
        if (!navigator.mediaDevices?.getUserMedia) return toast('這個瀏覽器不能開相機，請改用上傳照片');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        } catch {
          return toast('無法開啟相機（可能沒有允許權限），請改用上傳照片');
        }
        video.srcObject = stream;
        await video.play().catch(() => {});
        video.hidden = false;
        preview.classList.add('live');
        camBtn.textContent = '📸 拍下！';
        upBtn.hidden = true;
        cancelBtn.hidden = false;
        return;
      }
      // 倒數 3、2、1 再拍
      camBtn.disabled = true;
      let n = 3;
      count.hidden = false;
      count.textContent = n;
      timer = setInterval(() => {
        n -= 1;
        if (n > 0) { count.textContent = n; return; }
        clearInterval(timer);
        count.hidden = true;
        $('#booth-flash', root).classList.remove('go');
        void preview.offsetWidth; // 重新觸發閃光動畫
        $('#booth-flash', root).classList.add('go');
        const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // 跟預覽一樣左右鏡像
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const shot = canvas.toDataURL('image/jpeg', 0.9);
        setTimeout(() => { stopCamera(); this.setPhoto(shot); }, 350);
      }, 800);
    });

    cancelBtn.addEventListener('click', stopCamera);
    upBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => useFile(fileInput.files[0]));
    preview.addEventListener('dragover', e => { e.preventDefault(); preview.classList.add('drag'); });
    preview.addEventListener('dragleave', () => preview.classList.remove('drag'));
    preview.addEventListener('drop', e => {
      e.preventDefault();
      preview.classList.remove('drag');
      useFile(e.dataTransfer.files[0]);
    });

    return stopCamera; // 離開這頁時關相機
  },

  /* ---------------- 第 2 步：選相框 ---------------- */
  step2(root) {
    const { photo, frame } = this.state();
    if (!photo) {
      toast('先拍一張照片吧！');
      location.replace('#/photobooth');
      return;
    }
    const grid = $('#frame-grid', root);
    FRAMES.forEach(f => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'frame-card' + (f === frame ? ' selected' : '');
      card.setAttribute('aria-label', '選擇相框：' + f.name);
      const fit = document.createElement('span');
      fit.className = 'fit-area';
      fit.append(this.framed(f, photo));
      const label = document.createElement('span');
      label.className = 'frame-name';
      label.textContent = f.name;
      card.append(fit, label);
      card.addEventListener('click', () => {
        Store.sset('pb.frame', f.id);
        location.hash = '#/photobooth-3';
      });
      grid.append(card);
    });
  },

  /* ---------------- 第 3 步：貼貼紙 ---------------- */
  step3(root) {
    const { photo, frame } = this.state();
    if (!photo) { location.replace('#/photobooth'); return; }
    if (!frame) { location.replace('#/photobooth-2'); return; }

    let stickers = this.state().stickers;
    let selected = -1;
    const stageBox = $('#deco-stage', root);
    const stage = this.framed(frame, photo);
    const layer = document.createElement('div');
    layer.className = 'sticker-layer';
    stage.append(layer);
    stageBox.append(stage);

    const save = () => Store.sset('pb.stickers', stickers);

    const draw = () => {
      layer.replaceChildren(...stickers.map((s, i) => {
        const def = STICKERS.find(d => d.id === s.sid);
        const el = document.createElement('div');
        el.className = 'stk' + (i === selected ? ' selected' : '');
        el.dataset.i = i;
        el.style.left = s.x * 100 + '%';
        el.style.top = s.y * 100 + '%';
        el.style.width = s.s * 100 + '%';
        el.style.transform = `translate(-50%, -50%) rotate(${s.r}deg)`;
        el.innerHTML = `<img alt="" draggable="false"><button class="stk-del" type="button" aria-label="刪除貼紙">×</button><span class="stk-rot" aria-hidden="true">↻</span>`;
        el.firstChild.src = svgSrc(def);
        return el;
      }));
    };

    // 貼紙選單
    const list = $('#sticker-list', root);
    STICKERS.forEach(def => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sticker-btn';
      b.title = def.name;
      b.setAttribute('aria-label', '加入貼紙：' + def.name);
      const img = new Image();
      img.src = svgSrc(def);
      img.alt = '';
      b.append(img);
      b.addEventListener('click', () => {
        stickers.push({ sid: def.id, x: 0.5 + (Math.random() - 0.5) * 0.3, y: 0.5 + (Math.random() - 0.5) * 0.3, s: 0.18, r: Math.round((Math.random() - 0.5) * 24) });
        selected = stickers.length - 1;
        draw();
        save();
      });
      list.append(b);
    });

    // 拖曳、縮放、旋轉、刪除
    layer.addEventListener('pointerdown', e => {
      const el = e.target.closest('.stk');
      if (!el) { selected = -1; draw(); return; }
      const i = Number(el.dataset.i);
      if (e.target.closest('.stk-del')) {
        stickers.splice(i, 1);
        selected = -1;
        draw();
        save();
        return;
      }
      e.preventDefault();
      selected = i;
      const s = stickers[i];
      const rect = stage.getBoundingClientRect();
      const start = { px: e.clientX, py: e.clientY, x: s.x, y: s.y, r: s.r, s: s.s };
      const rotating = !!e.target.closest('.stk-rot');
      const cx = rect.left + s.x * rect.width;
      const cy = rect.top + s.y * rect.height;
      const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
      const d0 = Math.hypot(e.clientX - cx, e.clientY - cy);
      draw();
      const target = layer.children[i];
      target.setPointerCapture(e.pointerId);

      const move = ev => {
        if (rotating) {
          s.r = start.r + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180 / Math.PI;
          s.s = Math.min(0.8, Math.max(0.05, start.s * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0));
        } else {
          s.x = Math.min(1, Math.max(0, start.x + (ev.clientX - start.px) / rect.width));
          s.y = Math.min(1, Math.max(0, start.y + (ev.clientY - start.py) / rect.height));
        }
        target.style.left = s.x * 100 + '%';
        target.style.top = s.y * 100 + '%';
        target.style.width = s.s * 100 + '%';
        target.style.transform = `translate(-50%, -50%) rotate(${s.r}deg)`;
      };
      const up = () => {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        save();
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    });

    const onKey = e => {
      if (selected < 0 || !['Delete', 'Backspace'].includes(e.key) || e.target.closest('input, textarea')) return;
      stickers.splice(selected, 1);
      selected = -1;
      draw();
      save();
    };
    document.addEventListener('keydown', onKey);

    $('#deco-clear', root).addEventListener('click', () => {
      if (!stickers.length || !confirm('要清除全部貼紙嗎？')) return;
      stickers = [];
      selected = -1;
      draw();
      save();
    });

    $('#deco-save', root).addEventListener('click', async () => {
      try {
        const canvas = await this.compose(1);
        const a = document.createElement('a');
        a.download = 'BFF-photobooth-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast('照片已儲存 ✦');
      } catch {
        toast('存圖失敗：請用本機伺服器（例如 VS Code Live Server）開啟網站');
      }
    });

    $('#deco-post', root).addEventListener('click', async () => {
      try {
        const canvas = await this.compose(0.8);
        Store.sset('draftImage', canvas.toDataURL('image/jpeg', 0.85));
        location.hash = '#/post';
      } catch {
        toast('圖片產生失敗：請用本機伺服器（例如 VS Code Live Server）開啟網站');
      }
    });

    draw();
    return () => document.removeEventListener('keydown', onKey);
  },

  /* 把 照片 + 相框 + 貼紙 畫成一張圖 */
  async compose(scale) {
    const { photo, frame, stickers } = this.state();
    const W = this.W * scale;
    const H = this.H * scale;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // 照片：裁切成相框窗口大小（像 object-fit: cover）
    const img = await loadImage(photo);
    const { x, y, w, h, r } = frame.win;
    const wx = x * scale, wy = y * scale, ww = w * scale, wh = h * scale, rr = r * scale;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wx + rr, wy);
    ctx.arcTo(wx + ww, wy, wx + ww, wy + wh, rr);
    ctx.arcTo(wx + ww, wy + wh, wx, wy + wh, rr);
    ctx.arcTo(wx, wy + wh, wx, wy, rr);
    ctx.arcTo(wx, wy, wx + ww, wy, rr);
    ctx.closePath();
    ctx.clip();
    const k = Math.max(ww / img.naturalWidth, wh / img.naturalHeight);
    ctx.drawImage(img, wx + (ww - img.naturalWidth * k) / 2, wy + (wh - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
    ctx.restore();

    ctx.drawImage(await loadImage(svgSrc(frame)), 0, 0, W, H);

    for (const s of stickers) {
      const size = s.s * W;
      ctx.save();
      ctx.translate(s.x * W, s.y * H);
      ctx.rotate(s.r * Math.PI / 180);
      ctx.drawImage(await loadImage(svgSrc(STICKERS.find(d => d.id === s.sid))), -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    return canvas;
  },
};
