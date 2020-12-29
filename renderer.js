// data file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in data process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { ipcRenderer, webFrame } = require("electron");

webFrame.insertCSS("./style/main.css");

/*------------------------------------*\
    $RENDER FUNCTION & BINDING FUNCTION SETTING
\*------------------------------------*/

const ref = (val, cb) => {
  return {
    _v: val,
    set set(v) {
      this._v = v;
      if (cb && typeof cb === "function") {
        cb(v);
      }
    },
    get val() {
      return this._v;
    },
  };
};

const h = (tag, attrs, val = []) => {
  const elem = document.createElement(tag);
  attrs = attrs || {};

  Object.keys(attrs).forEach((prop) => {
    if (prop === "class") {
      attrs[prop].forEach((className) => elem.classList.add(className));
    } else {
      elem.setAttribute(prop, attrs[prop]);
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

const $ = (el) => document.querySelector(el);

/*------------------------------------*\
    $DATA BINDING
\*------------------------------------*/

const data = {
  // inputs
  ytUrl: "",
  path: "",
  title: "",

  // layout hints
  loading: ref(false, (v) =>
    v
      ? $("#loading").classList.remove("hide")
      : $("#loading").classList.add("hide")
  ),
  isProcessing: ref(false, (v) =>
    v
      ? $("#dialog").classList.remove("hide")
      : $("#dialog").classList.add("hide")
  ),

  // info
  videoInfo: null,
  vQuality: null,
  aQuality: null,
  tracker: {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: "0x", fps: 0 },
  },
};

const binding = () => {
  console.log("binding");
  console.log(data);
  $("#ytUrl").value = data.ytUrl;
  $("#title").value = data.title;
  $("#path").value = data.path;
};

binding();

/*------------------------------------*\
    $ipcRenderer LISTENERS
\*------------------------------------*/

ipcRenderer.on("get-yt-info-reply", (event, info) => {
  data.videoInfo = info;
  data.title = info.videoDetails.title;
  data.loading.set = false;
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
  updateTracker(tracker);
});

ipcRenderer.on("download-complete", () => {
  data.isProcessing.set = false;
  $(".audio-progress").style.width = `100%`;
  $(".video-progress").style.width = `100%`;
  alert("完成");
});

ipcRenderer.on("download-fail", () => {
  data.isProcessing.set = false;
  alert("完成");
});

/*------------------------------------*\
    $EVENT LISTENERS
\*------------------------------------*/

$("#ytUrl").addEventListener("focus", (e) => {
  e.target.classList.remove("require");
  handleFocus();
});
$("#path").addEventListener("focus", (e) =>
  e.target.classList.remove("require")
);
$("#confirm").addEventListener("click", () => analyzeText($("#ytUrl").value));
$("#path-append").addEventListener("click", () => {
  $("#path").classList.remove("require");
  pickFilePath();
});
$("#start").addEventListener("click", () => start());

$("#title").addEventListener("change", (e) => {
  data.title = e.target.value;
});

$("#ytUrl").addEventListener("blur", (e) => checkEmpty(e.target));
$("#title").addEventListener("blur", (e) => checkEmpty(e.target));
$("#path").addEventListener("blur", (e) => checkEmpty(e.target));

/*------------------------------------*\
    $METHODS
\*------------------------------------*/

const handleFocus = () => {
  console.log("ytUrl focusing");

  navigator.clipboard
    .readText()
    .then((text) => text !== $("#ytUrl").value && analyzeText(text));
};

const checkEmpty = (el, isAll) => {
  if (isAll) {
    let flag = true;
    if (!$("#ytUrl").value) {
      $("#ytUrl").classList.add("require");
      flag = false;
    }

    if (!$("#title").value) {
      $("#title").classList.add("require");
      flag = false;
    }

    if (!$("#path").value) {
      $("#path").classList.add("require");
      flag = false;
    }

    return flag;
  } else {
    if (!el.value) {
      el.classList.add("require");
    }
  }
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
  data.loading.set = true;
  ipcRenderer.send("get-yt-info", url);
};

const pickFilePath = () => {
  ipcRenderer.send("pick-path");
};

const start = () => {
  if (!checkEmpty(null, true)) return;
  data.isProcessing.set = true;
  ipcRenderer.send("download", {
    title: data.title,
    url: data.ytUrl,
    path: data.path,
    quality: {
      audio: data.aQuality ? data.aQuality.itag : "highestaudio",
      video: data.vQuality ? data.vQuality.itag : "highestvideo",
    },
  });
  renderTracker(tracker);
  //
};

/*------------------------------------*\
    $COMPONENT
\*------------------------------------*/

const renderVideoInfo = (videoInfo) => {
  $("#videoInfo").innerHTML = "";

  const thumbnails = videoInfo.videoDetails.thumbnails;
  const imgSrc = thumbnails[thumbnails.length - 1].url;

  let title = videoInfo.videoDetails.title;
  title = title.length > 40 ? title.slice(0, 40) + "..." : title;

  let description = videoInfo.videoDetails.description.replace(
    /\n\s*\n/g,
    "\n"
  );
  description =
    description.length > 40 ? description.slice(0, 40) + "..." : description;

  const render = h("div", { class: ["v-card"] }, [
    h("div", { class: ["v-row"] }, [
      h("div", { class: ["v-col", "cols-4", "flex-center"] }, [
        h("img", { src: imgSrc }),
      ]),
      h("div", { class: ["v-col", "cols-8"] }, [
        h("p", { class: ["v-card-title"] }, title),
        h("p", { class: ["v-card-text"] }, description),
      ]),
    ]),
  ]);

  $("#videoInfo").appendChild(render);
};

const renderTracker = () => {
  $("#tracker").innerHTML = "";

  const render = h("div", { class: ["v-card"] }, [
    h("h4", null, `開始時間 : ${new Date()}`),
    h("p", null, "音訊 :"),
    h("div", { class: ["audio-progress-wrapper", "progress-wrapper"] }, [
      h("div", { class: ["progress", "audio-progress"] }),
    ]),
    h("p", null, "視訊 :"),
    h("div", { class: ["video-progress-wrapper", "progress-wrapper"] }, [
      h("div", { class: ["progress", "video-progress"] }),
    ]),
    h("p", { id: "merged" }, `已合併 : 影格 0 速度 0x fps 0`),
  ]);

  $("#tracker").appendChild(render);
};

const layoutUpdate = () => {
  //
};

const updateTracker = (tracker) => {
  const { audio, video, merged } = tracker;

  const audioP = Number((audio.downloaded / audio.total) * 100).toFixed(3);
  const videoP = Number((video.downloaded / video.total) * 100).toFixed(3);
  console.log({ audioP, videoP });
  $(".audio-progress").style.width = `${audioP}%`;
  $(".video-progress").style.width = `${videoP}%`;
  $(
    "#merged"
  ).innerText = `已合併 : 影格 ${merged.frame} 速度 ${merged.speed} fps ${merged.fps}`;
};
