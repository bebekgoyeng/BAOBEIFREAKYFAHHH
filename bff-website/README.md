# BFF ✦ BAOBEIFREAKYFAHHH

114AC2008 賴香敏 ✦ 114AC2028 王慧晴

## 怎麼打開

- **最簡單**：直接雙擊 `index.html`。
- **比較推薦**：用 VS Code 的 **Live Server** 開（右鍵 `index.html` → Open with Live Server），相機權限比較穩定。
- 要放上網路：整個資料夾丟到 GitHub Pages / Netlify 就可以。

## 頁面（網址用 `#`）

| 頁面 | 網址 |
|---|---|
| Home（開始） | `index.html` |
| 個人資料 | `#/userinfo` |
| 首頁貼文 | `#/home` → 點貼文進 `#/home-2?id=…` |
| 音樂 | `#/music` |
| 拍貼 1／2／3 | `#/photobooth`、`#/photobooth-2`、`#/photobooth-3` |
| 發文 | `#/post` |

整個網站其實是同一頁，用 `#` 換內容，所以**換頁時音樂不會中斷**。

## 資料夾

```
index.html        所有頁面的版面（下面的 <template> 就是每一頁）
css/style.css     全部樣式（顏色在最上面 :root）
js/data.js        歌曲清單、預設貼文      ← 換歌改這裡
js/store.js       存資料、共用小工具
js/player.js      左邊的音樂播放器
js/stickers.js    拍貼的 4 個相框 + 21 張貼紙
js/photobooth.js  拍照 / 上傳 / 選相框 / 貼貼紙 / 存圖
js/pages.js       userinfo、home、music、post 的功能
js/app.js         換頁
img/              logo、背景、署名、封面、裝飾圖
audio/            6 首原創配樂（可以自由使用）
fonts/            自己的字型檔放這裡（看裡面的 README.txt）
figma-elements/   貼紙、相框、裝飾的 SVG，可以直接拖進 Figma
```

## 常見修改

- **換歌**：mp3 放進 `audio/`，封面放進 `img/covers/`，改 `js/data.js` 的 `TRACKS`。
- **加貼紙**：在 `js/stickers.js` 的 `STICKERS` 加一筆。
- **改文字**：直接改 `index.html` 裡的 `<template>`。

## 注意

- 貼文和個人資料存在**瀏覽器的 localStorage**，只有自己這台電腦看得到。要讓大家互相看到貼文，需要接後端（例如 Firebase）。
- 拍照需要允許相機權限；不允許的話可以用「上傳照片」。
