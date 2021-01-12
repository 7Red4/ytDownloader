<template>
  <div class="py-4">
    <v-container>
      <v-text-field
        v-model="ytUrl"
        label="youtube 網址"
        @focus="handleFocus"
        outlined
      >
        <template #append-outer>
          <v-btn color="primary" @click="analyzeText(ytUrl)">確認</v-btn>
        </template>
      </v-text-field>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
      ></v-progress-circular>

      <template v-if="!!videoInfo && !loading">
        <p v-if="isLive">
          <v-icon size="16" color="red">mdi-circle</v-icon>
          直播中
        </p>
        <v-card class="video_info_card mb-10">
          <v-row align="center" class="px-3">
            <v-col cols="4">
              <v-img
                :src="
                  videoInfo.videoDetails.thumbnails.length
                    ? videoInfo.videoDetails.thumbnails[
                        videoInfo.videoDetails.thumbnails.length - 1
                      ].url
                    : ''
                "
              ></v-img>
            </v-col>

            <v-col cols="8">
              <v-card-title>
                {{ videoInfo.videoDetails.title.slice(0, 40) }}
                {{ videoInfo.videoDetails.title.length > 40 ? '...' : '' }}
              </v-card-title>
              <v-card-text>
                {{ videoInfo.videoDetails.description.slice(0, 120) }}
                {{
                  videoInfo.videoDetails.description.length > 120 ? '...' : ''
                }}
              </v-card-text>
            </v-col>
          </v-row>

          <v-menu min-width="200" :nudge-top="16" offset-y left>
            <template #activator="{ on }">
              <v-btn v-on="on" class="video_info_card-more" icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item @click="isThumbnailDownloadDialogOpen = true">
                下載首圖
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card>

        <v-form ref="form">
          <v-text-field
            label="標題"
            v-model="title"
            :rules="[v => !!v || '標題不為空']"
            outlined
          ></v-text-field>

          <v-text-field
            label="儲存路徑"
            append-icon="mdi-dots-horizontal"
            v-model="path"
            @click:append="pickFilePath"
            :rules="[v => !!v || '請選擇路徑']"
            outlined
          ></v-text-field>

          <p class="grey--text text-body-2">
            都不選擇時 預設皆為最高 直播中無法選擇音質
          </p>

          <v-menu max-height="400">
            <template #activator="{ on }">
              <v-text-field
                v-on="on"
                :value="vQualityText"
                @click:clear="vQuality = null"
                label="選擇畫質"
                readonly
                clearable
                outlined
              ></v-text-field>
            </template>
            <v-list>
              <v-list-item-group v-model="vQuality" label="選擇畫質">
                <v-list-item
                  v-for="(format, i) in vQualities"
                  :key="i"
                  :value="format"
                  two-line
                >
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="format.qualityLabel"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-text="format.quality"
                    ></v-list-item-subtitle>
                    <v-list-item-subtitle
                      v-text="format.mimeType"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-menu>

          <v-menu max-height="400" v-if="!isLive">
            <template #activator="{ on }">
              <v-text-field
                v-on="on"
                :value="aQualityText"
                @click:clear="aQuality = null"
                label="選擇音質"
                readonly
                clearable
                outlined
              ></v-text-field>
            </template>
            <v-list>
              <v-list-item-group v-model="aQuality" label="選擇音質">
                <v-list-item
                  v-for="(format, i) in aQualities"
                  :key="i"
                  :value="format"
                  two-line
                >
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="format.quality"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-text="format.mimeType"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-menu>
        </v-form>

        <v-btn color="success" @click="start">
          {{ isLive ? '錄影' : '下載' }}
        </v-btn>
      </template>
    </v-container>

    <v-dialog v-model="isProcessing" persistent max-width="800">
      <v-card v-if="tracker">
        <v-card-title>{{ isLive ? '錄製' : '下載' }}中</v-card-title>
        <v-card-text>
          開始時間: {{ tracker.start }}
          <br />
          <br />
          <template v-if="!isLive">
            音訊:
            <br />
            <v-progress-linear
              color="cyan"
              height="25"
              :value="(tracker.audio.downloaded / tracker.audio.total) * 100"
            ></v-progress-linear>
            <br />
            視訊:
            <br />
            <v-progress-linear
              color="success"
              height="25"
              :value="(tracker.video.downloaded / tracker.video.total) * 100"
            ></v-progress-linear>
          </template>
          <br />
          <p>
            已合併:影格 {{ tracker.merged.frame }}, 速度
            {{ tracker.merged.speed }}, fps {{ tracker.merged.fps }}
          </p>
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <br />
          時間經過 : {{ HHMMSS }}
        </v-card-text>
        <v-card-actions v-if="isLive">
          <v-btn color="error" @click="stop" text>中止錄影</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="isThumbnailDownloadDialogOpen"
      max-width="500px"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title>
          選擇解析度 (寬 x 高)
        </v-card-title>
        <v-list v-if="videoInfo && videoInfo.videoDetails.thumbnails.length">
          <v-list-item
            v-for="resolution in videoInfo.videoDetails.thumbnails"
            :key="resolution.url"
            @click="pickThumbnailPath(resolution.url)"
          >
            {{ resolution.width }} x {{ resolution.height }}
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" dark @input="v => !v && (snackMsg = '')">
      <div class="d-flex align-center">
        {{ snackMsg }}
        <v-spacer></v-spacer>
        <v-btn text icon color="error" @click.native="snack = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-snackbar>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron';
import filenamify from 'filenamify';

export default {
  name: 'Home',

  data() {
    return {
      ytUrl: '',
      path: this.$db.get('dl_path').value() || '',
      tumbnailPath: '',
      thumbnailURL: '',
      title: '',
      loading: false,
      snack: false,
      snackMsg: '',
      videoInfo: null,
      vQuality: null,
      aQuality: null,
      isProcessing: false,
      isThumbnailDownloadDialogOpen: false,
      timer: null,
      tracker: {
        start: new Date(),
        audio: { downloaded: 0, total: Infinity },
        video: { downloaded: 0, total: Infinity },
        merged: { frame: 0, speed: '0x', fps: 0 }
      },
      seconds: 0
    };
  },

  computed: {
    vQualities() {
      return this.videoInfo
        ? this.videoInfo.formats.filter(({ mimeType }) =>
            /video/.test(mimeType)
          )
        : [];
    },
    aQualities() {
      return this.videoInfo
        ? this.videoInfo.formats.filter(({ mimeType }) =>
            /audio/.test(mimeType)
          )
        : [];
    },
    vQualityText() {
      return this.vQuality
        ? `${this.vQuality.qualityLabel || ''} - ${this.vQuality.mimeType}`
        : '';
    },
    aQualityText() {
      return this.aQuality ? `${this.aQuality.mimeType}` : '';
    },

    isLive() {
      return this.videoInfo && this.videoInfo.videoDetails.isLive;
    },
    HHMMSS() {
      return new Date(this.seconds * 1000).toISOString().substr(11, 8);
    }
  },

  watch: {
    videoInfo(v) {
      v && (this.title = filenamify(v.videoDetails.title));
    },
    isProcessing(v) {
      if (v) {
        this.seconds = 0;
        this.timer = setInterval(() => {
          this.seconds++;
        }, 1000);
      } else {
        clearInterval(this.timer);
      }
    },
    path(v) {
      this.$db.set('dl_path', v).write();
    }
  },

  created() {
    ipcRenderer.on('get-yt-info-reply', (event, info) => {
      this.videoInfo = info;
      this.loading = false;
    });

    ipcRenderer.on(
      'pick-path-reply',
      (event, path) => (this.path = !path.canceled ? path.filePaths[0] : '')
    );

    ipcRenderer.on('pick-thumbnail-path-reply', (event, path) => {
      console.log(path);
      this.tumbnailPath = path || '';
      this.downloadTumbnail();
    });

    ipcRenderer.on('download-thumbnail-complete', (event, res) => {
      this.snackMsg = '下載完成';
      this.snack = true;
    });

    ipcRenderer.on('download-thumbnail-fail', (event, res) => {
      this.snackMsg = '下載失敗';
      this.snack = true;
    });

    ipcRenderer.on('download-processing', (event, tracker) => {
      this.tracker.audio = tracker.audio;
      this.tracker.video = tracker.video;
      this.tracker.merged = tracker.merged;
    });
    ipcRenderer.on('download-complete', () => {
      this.isProcessing = false;
    });
    ipcRenderer.on('download-fail', (event, error) => {
      this.snackMsg = error;
      this.snack = true;
      this.isProcessing = false;
    });
  },

  methods: {
    handleFocus(e) {
      navigator.clipboard.readText().then(text => {
        if (this.ytUrl === text) return;
        this.analyzeText(text, e);
      });
    },

    analyzeText(text, e) {
      const urlReg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
      const isUrl = urlReg.test(text);
      const hasYoutube = /youtube|youtu.be/.test(text);

      if (isUrl && hasYoutube) {
        this.ytUrl = text;
        this.getVideoInfo(text);
        e && e.target.blur();
      }
    },
    getVideoInfo(url) {
      if (!url) return;
      this.loading = true;
      ipcRenderer.send('get-yt-info', url);
    },
    pickThumbnailPath(url) {
      this.thumbnailURL = url;
      ipcRenderer.send('pick-thumbnail-path', this.title);
    },
    downloadTumbnail() {
      if (!this.tumbnailPath) {
        this.snackMsg = '請選擇路徑';
        this.snack = true;
        return;
      }
      ipcRenderer.send('download-thumbnail', {
        url: this.thumbnailURL,
        path: this.tumbnailPath
      });
    },
    pickFilePath() {
      ipcRenderer.send('pick-path');
    },

    start() {
      if (!this.$refs.form.validate()) return;
      this.isProcessing = true;
      ipcRenderer.send('download', {
        title: this.title,
        url: this.ytUrl,
        path: this.path,
        quality: {
          audio: this.aQuality ? this.aQuality.itag : 'highestaudio',
          video: this.vQuality ? this.vQuality.itag : 'highestvideo'
        }
      });

      this.tracker = {
        start: new Date(),
        audio: { downloaded: 0, total: Infinity },
        video: { downloaded: 0, total: Infinity },
        merged: { frame: 0, speed: '0x', fps: 0 }
      };
    },

    stop() {
      ipcRenderer.send('exit');
    }
  }
};
</script>

<style lang="scss" scoped>
.video_info_card {
  position: relative;
  .video_info_card-more {
    position: absolute;
    top: 4px;
    right: 6px;
  }
}
</style>
