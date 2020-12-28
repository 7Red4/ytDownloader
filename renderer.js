// data file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in data process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer, webFrame } = require("electron");

webFrame.insertCSS("./style/main.css");

const h = (tag, attrs, val = []) => {
  const elem = document.createElement(tag);
  Object.keys(attrs).forEach((prop) => {
    if (prop === "class") {
      attrs[prop].forEach((className) => elem.classList.add(className));
    } else {
      elem[prop] = attrs[prop];
    }
  });

  if (typeof val === "string") {
    elem.innerText = val;
  } else if (val && val.length) {
    val.forEach((child) => {
      elem.appendChild(child);
    });
  }
  return elem;
};

const data = {
  ytUrl: "",
  path: "",
  title: "",
  loading: false,
  videoInfo: null,
  vQuality: null,
  aQuality: null,
  isProcessing: false,
  tracker: {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: "0x", fps: 0 },
  },
};

const $ = (el) => document.querySelector(el);

const binding = () => {
  console.log("binding");
  console.log(data);
  $("#ytUrl").value = data.ytUrl;
  $("#title").value = data.title;
  $("#path").value = data.path;
};

binding();

// ipcRenderer LISTENERS

ipcRenderer.on("get-yt-info-reply", (event, info) => {
  data.videoInfo = info;
  data.title = info.videoDetails.title;
  data.loading = false;
  binding();
  renderVideoInfo(data.videoInfo);
  $("#ytUrl").blur();
});

ipcRenderer.on("pick-path-reply", (event, path) => {
  data.path = !path.canceled ? path.filePaths[0] : "";
  binding();
  $("#path").blur();
});

ipcRenderer.on("download-processing", (event, tracker) => {
  data.tracker = tracker;
  binding();
});

ipcRenderer.on("download-complete", () => {
  data.isProcessing = false;
});

ipcRenderer.on("download-fail", () => {
  data.isProcessing = false;
});

// EVENT LISTENERS

$("#ytUrl").addEventListener("focus", () => handleFocus());
$("#confirm").addEventListener("click", () => analyzeText($("#ytUrl").value));
$("#path").addEventListener("focus", (e) => !e.target.value && pickFilePath());
$("#path-append").addEventListener("click", () => pickFilePath());
$("#start").addEventListener("click", () => start());

const handleFocus = () => {
  console.log("ytUrl focusing");

  navigator.clipboard.readText().then((text) => text !== $("#ytUrl").value && analyzeText(text));
};

const analyzeText = (text) => {
  const urlReg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
  const isUrl = urlReg.test(text);
  const hasYoutube = /youtube|youtu.be/.test(text);

  if (isUrl && hasYoutube) {
    data.ytUrl = text;
    getVideoInfo(text);
  }
};

const getVideoInfo = (url) => {
  if (!url) return;
  data.loading = true;
  ipcRenderer.send("get-yt-info", url);
};

const pickFilePath = () => {
  ipcRenderer.send("pick-path");
};

const start = () => {
  // if (!data.$refs.form.validate()) return;
  data.isProcessing = true;
  ipcRenderer.send("download", {
    title: data.title,
    url: data.ytUrl,
    path: data.path,
    quality: {
      audio: data.aQuality ? data.aQuality.itag : "highestaudio",
      video: data.vQuality ? data.vQuality.itag : "highestvideo",
    },
  });
  //
};

// TEMPLATE RENDER

const renderVideoInfo = (videoInfo) => {
  $("#videoInfo").innerHTML = "";

  const thumbnails = videoInfo.videoDetails.thumbnails;
  const imgSrc = thumbnails[thumbnails.length - 1].url;

  let title = videoInfo.videoDetails.title;
  title = title.length > 40 ? title.slice(0, 40) + "..." : title;

  let description = videoInfo.videoDetails.description.replace(/\n\s*\n/g, "\n");
  description = description.length > 40 ? description.slice(0, 40) + "..." : description;

  const render = h("div", { class: ["v-card"] }, [
    h("div", { class: ["v-row"] }, [
      h("div", { class: ["v-col", "cols-4", "flex-center"] }, [h("img", { src: imgSrc })]),
      h("div", { class: ["v-col", "cols-8"] }, [
        h("p", { class: ["v-card-title"] }, title),
        h("p", { class: ["v-card-text"] }, description),
      ]),
    ]),
  ]);

  $("#videoInfo").appendChild(render);
};
