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
        <VideoInfoCard :videoDetails="videoInfo.videoDetails" thumbnail />

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
          時間經過 : {{ $s2hms(seconds) }}
        </v-card-text>
        <v-card-actions v-if="isLive">
          <v-btn color="error" @click="stop" text>中止錄影</v-btn>
        </v-card-actions>
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
import { ipcRenderer } from 'electron';
import filenamify from 'filenamify';

import VideoInfoCard from '@/components/VideoInfoCard';

export default {
  components: {
    VideoInfoCard
  },

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