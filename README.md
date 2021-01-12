# YT 下載器

可以下載 youtube 影片的跨平台桌面應用程式

ver 1.3.0

[windows download 載點](/release/1.3.0/win/yt-downloader%20Setup%201.3.0.exe?raw=true)

[mac download 載點](/release/1.3.0/mac/)

## 使用方法

![](https://i.imgur.com/e35m6KU.png)

- 輸入 youtub 連結 (如果你的剪貼簿有連結則會在進入輸入欄時自動帶入)
- 更改標題作為檔名 (預設為原片標題)
- 選儲存路徑
- 按下載!
- 等他好

## 功能

### Downloader
- [x] 下載 youtube 影片
- [x] 選擇畫質與音質
- [x] 開/關燈模式
- [x] 直播中也可下載
- [x] 下載首圖

- [ ] 只下載 音/視訊
- [ ] 大量下載

### Player
- [ ] 透過時間標籤製作歌單
- [ ] 儲存歌單
- [ ] 分享歌單

---

for English

# YT downloader

A cross-platform desktop app for downloading youtube videos

## USAGE

![](https://i.imgur.com/e35m6KU.png)

- Enter a youtube url. (It will auto fill the field if your clipboad has a youtube url)
- Change the file name of the clip to save. (default to the origin title)
- Pick a path to save.
- Click download!
- Take a seat and have some coffee till it's done.

## FEATURE

### Downloader

- [x] Download youtube video
- [x] Pick resolution
- [x] Light / dark mode
- [x] Download while it's even in streaming
- [x] Download thumbnail

- [ ] Download video/audio only
- [ ] Multiple download

### Player
- [ ] create playlist by timestamps
- [ ] save playlist
- [ ] share playlist

---

---

---

# For Dev 給開發

This project is using [`electron js`](https://www.electronjs.org/) with [`vue js`](https://vuejs.org/) built by [`vue-cli-plugin-electron-builder`](https://nklayman.github.io/vue-cli-plugin-electron-builder/) and [`Vuetify`](https://vuetifyjs.com/en/) as UI components

## 環境需求 enviorment require

```
node js
```

## 套件安裝 install dependecies

```
npm install
```

## 啟動 run dev

```
npm run dev
```

## 打包 build

```
npm run build
```
