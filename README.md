[English version](/README_en.md)

[For Dev 給開發](/README_dev.md)

# YT 下載器

可以下載 youtube 影片的跨平台桌面應用程式
使用 [ytdl-core]('https://github.com/fent/node-ytdl-core') 作為核心 [youtube-dl]('https://github.com/ytdl-org/youtube-dl') 作為副核心 [ffmpeg]('https://www.ffmpeg.org/') 做影像處理

ver 2.4.0

[載點](https://github.com/7Red4/ytDownloader/releases)

## 使用方法

![image](https://user-images.githubusercontent.com/40208491/135762957-3d458ea7-9fbe-4844-a01f-402c1a339b28.png)

- 輸入 youtube 連結 (如果你的剪貼簿有連結則會在進入輸入欄時自動帶入)
- 更改標題作為檔名 (預設為原片標題 ps.若要放進剪輯軟體處理建議迴避奇怪的檔名 like 表情符號)
- 選儲存路徑
- 可以決定要不要使用 cookie 來下載 (通常是 會員限定才需要 需年齡認證的影片也需要)
  必須要先載入 cookie 檔案
- 按 "加到佇列並開始" 或你想要先加入等等在下載也可以按 "加到佇列"
  ![image](https://user-images.githubusercontent.com/40208491/135763292-341124ea-bac8-41cc-bc07-74288dbed72d.png)
- 等他好
  ![image](https://user-images.githubusercontent.com/40208491/135763312-666ca46b-172f-48f5-ac33-b25367959d1f.png)
  ![image](https://user-images.githubusercontent.com/40208491/135763533-25b37179-fa5f-4725-813a-68a3f5109a16.png)

### 如何獲取 cookie 文件

可下載 chrome 插件 [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)

然後進 youtube 的網址後把 cookie 文件載下來並在設定內掛入
![image](https://user-images.githubusercontent.com/40208491/135763245-013e46c4-cbd8-44d8-b834-3180a82e57ac.png)

## 功能

### 通用

- [x] 可以使用設定
- [x] 能夠在背景運行
- [x] 可設定 cookie

### Downloader

- [x] 下載 youtube 影片
- [x] 選擇畫質與音質
- [x] 開/關燈模式
- [x] 直播中錄製
- [x] 下載首圖
- [x] 只下載 音/視訊
- [x] 大量下載
- [x] 只下載 音/視訊
- [x] 可選擇使用 [youtube-dl](https://github.com/ytdl-org/youtube-dl) 的方法下載
- [ ] 可以選定下載片段
- [x] 可以設定時間自動錄製直播中節目
- [ ] 狀態列進度
- [ ] 下載完成通知

### Player

我把 player 拔啦~ 因為好像沒啥人用 又有很多替代方案
