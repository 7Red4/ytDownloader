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
            :rules="[(v) => !!v || '標題不為空']"
            outlined
          ></v-text-field>

          <v-text-field
            label="儲存路徑"
            append-icon="mdi-dots-horizontal"
            v-model="path"
            @click:append="pickFilePath"
            :rules="[(v) => !!v || '請選擇路徑']"
            outlined
          ></v-text-field>

          <p class="grey--text text-body-2 my-1">直播中的影片無法選擇音質</p>

          <div v-if="!isLive" class="d-flex flex-wrap mb-3">
            <v-checkbox
              label="下載視訊"
              :value="!sourceReq.noVideo"
              :input-value="!sourceReq.noVideo"
              :disabled="!sourceReq.noVideo && sourceReq.noAudio"
              @change="(v) => (sourceReq.noVideo = !v)"
            ></v-checkbox>
            <div class="px-3"></div>
            <v-checkbox
              label="下載音訊"
              :value="!sourceReq.noAudio"
              :input-value="!sourceReq.noAudio"
              :disabled="!sourceReq.noAudio && sourceReq.noVideo"
              @change="(v) => (sourceReq.noAudio = !v)"
            ></v-checkbox>
          </div>

          <v-row>
            <v-col cols="auto">
              <v-select
                v-show="!isLive"
                :items="[
                  {
                    text: 'youtube-dl',
                    value: 'youtube-dl'
                  },
                  { text: 'ytdl 重製中', value: 'ytdl', disabled: true }
                ]"
                v-model="dlMethod"
                label="下載方式"
                mandatory
                outlined
              ></v-select>
            </v-col>
          </v-row>

          <Async :loading="fetchingFormats">
            <v-menu max-height="400">
              <template #activator="{ on }">
                <v-text-field
                  v-on="on"
                  :value="vQuality.label"
                  label="選擇畫質"
                  readonly
                  outlined
                ></v-text-field>
              </template>
              <v-list>
                <v-list-item-group v-model="vQuality" label="選擇畫質">
                  <v-list-item
                    v-for="(format, i) in vQualities"
                    :key="i"
                    :value="format"
                    :disabled="format.itag === vQuality.itag"
                    two-line
                  >
                    <v-list-item-content>
                      {{ format.label }}
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-menu>

            <v-menu max-height="400" v-if="!isLive">
              <template #activator="{ on }">
                <v-text-field
                  v-on="on"
                  :value="aQuality.label"
                  label="選擇音質"
                  readonly
                  outlined
                ></v-text-field>
              </template>
              <v-list>
                <v-list-item-group v-model="aQuality" label="選擇音質">
                  <v-list-item
                    v-for="(format, i) in aQualities"
                    :key="i"
                    :value="format"
                    :disabled="format.itag === aQuality.itag"
                    two-line
                  >
                    <v-list-item-content>
                      {{ format.label }}
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-menu>
          </Async>
        </v-form>
        <v-switch v-model="useCookie" label="使用 cookie"></v-switch>
        <p class="body-2">
          提醒:使用 cookie 會影響 yt 的演算法 (會等同你看過)
          若要下載的影片為公開影片 建議不勾選
        </p>

        <v-card-actions v-if="!fetchingFormats">
          <template v-if="videoInfo.videoDetails.isUpcoming">
            <v-btn color="grey" @click="reserve">
              <v-icon>mdi-clock-outline</v-icon>
              預約
            </v-btn>
          </template>
          <template v-else>
            <v-btn color="primary" @click="addQue(true)">加到佇列並開始</v-btn>
            <v-btn color="secondary" @click="addQue(false)">加到佇列</v-btn>
          </template>
        </v-card-actions>
      </template>
    </v-container>

    <v-snackbar v-model="snack" dark @input="(v) => !v && (snackMsg = '')">
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

import { mapActions, mapGetters } from 'vuex';

import VideoInfoCard from '@/components/VideoInfoCard';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  components: {
    VideoInfoCard
  },

  data() {
    return {
      ytUrl: 'https://www.youtube.com/watch?v=GZ5-N_0pjKs',
      path: this.$db.get('dl_path').value() || '',
      tumbnailPath: '',
      thumbnailURL: '',
      dlMethod: 'youtube-dl',
      title: '',
      loading: false,
      snack: false,
      isMulti: false,
      snackMsg: '',
      videoInfo: null,
      formats: [],
      fetchingFormats: false,
      vQuality: { itag: 0, label: '' },
      aQuality: { itag: 0, label: '' },
      sourceReq: {
        noVideo: false,
        noAudio: false
      },
      useCookie: !!this.$db.get('use_cookie').value()
    };
  },

  computed: {
    ...mapGetters(['getQueList', 'getQueById']),
    vQualities() {
      return this.formats
        .filter(({ label }) => /video only/.test(label))
        .sort((a, b) => {
          const aQ = a.label.match(/[0-9]{1,4}p/)
            ? a.label.match(/[0-9]{1,4}p/)[0]
            : '';
          const bQ = b.label.match(/[0-9]{1,4}p/)
            ? b.label.match(/[0-9]{1,4}p/)[0]
            : '';
          Number(aQ.replace('p', '')) < Number(bQ.replace('p', '')) ? -1 : 1;
        })
        .sort((a) => (/mp4/g.test(a.label) ? -1 : 1));
    },
    aQualities() {
      return this.formats
        .filter(({ label }) => /audio only/.test(label))
        .sort((a) => (/webm/g.test(a.label) ? 1 : -1));
    },

    isLive() {
      return (
        this.videoInfo &&
        this.videoInfo.videoDetails.liveBroadcastDetails &&
        this.videoInfo.videoDetails.liveBroadcastDetails.isLiveNow
      );
    }
  },

  watch: {
    videoInfo(v) {
      v && (this.title = filenamify(v.videoDetails.title));
    },
    fetchingFormats(v) {
      v && (this.formats = []);
    },
    formats() {
      this.$nextTick(() => {
        if (this.vQualities.length) {
          this.vQuality = this.vQualities[0];
        }
        if (this.aQualities.length) {
          this.aQuality = this.aQualities[0];
        }
      });
    },
    path(v) {
      this.$db.set('dl_path', v).write();
    },
    useCookie(v) {
      this.$db.set('use_cookie', v).write();
    }
  },

  created() {
    ipcRenderer.on('get-yt-info-reply', (event, { result, error }) => {
      if (error) {
        console.error(error);
        this.SET_ERROR(error);
      } else {
        this.videoInfo = result;
      }
      this.loading = false;
    });

    ipcRenderer.on('get-yt-format-reply', (event, formats) => {
      this.formats = formats
        .filter((f) => !!f)
        .map((f) => {
          const parsed = f.replace(/\s\s+/g, ' ');
          const itag = parsed.split(' ')[0];
          const label = parsed.replace(itag, '');
          return {
            itag,
            label
          };
        });
      this.fetchingFormats = false;
    });

    ipcRenderer.on(
      'pick-path-reply',
      (event, path) => (this.path = !path.canceled ? path.filePaths[0] : '')
    );

    ipcRenderer.on('set-que-id-reply', (event, tracker) =>
      this.SET_QUE(tracker)
    );
  },

  mounted() {
    //
  },

  methods: {
    ...mapActions(['SET_QUE', 'DELETE_QUE', 'SET_SHOW_QUE', 'SET_ERROR']),
    async addQueByList(queList, andStart = false) {
      const wait = () => {
        return new Promise((resolve) => setTimeout(resolve, 2));
      };

      for (const { title, url } of queList) {
        ipcRenderer.send(andStart ? 'start-que' : 'add-que', {
          title,
          url,
          path: this.path,
          quality: {
            audio: 'highestaudio',
            video: 'highestvideo'
          }
        });

        await wait();
      }
    },
    resetData() {
      const originData = {
        ytUrl: '',
        path: this.$db.get('dl_path').value() || '',
        tumbnailPath: '',
        thumbnailURL: '',
        dlMethod: 'youtube-dl',
        title: '',
        loading: false,
        videoInfo: null,
        formats: [],
        fetchingFormats: false,
        vQuality: { itag: 0, label: '' },
        aQuality: { itag: 0, label: '' },
        sourceReq: {
          noVideo: false,
          noAudio: false
        }
      };

      Object.keys(originData).forEach((key) => {
        this[key] = originData[key];
      });
    },
    handleFocus(e) {
      navigator.clipboard.readText().then((text) => {
        if (this.ytUrl === text) return;
        this.analyzeText(text, e);
      });
    },

    analyzeText(text, e) {
      const urlReg =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
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
      this.fetchingFormats = true;

      ipcRenderer.send('get-yt-info', url);
      ipcRenderer.send('get-yt-format', url);
    },

    pickFilePath() {
      ipcRenderer.send('pick-path');
    },

    getQueFromData(extraProp = {}) {
      const cookie = this.$db.get('cookie').value();
      const length = () => {
        if (!this.videoInfo.videoDetails || this.isLive) return 0;
        return Number(this.videoInfo.videoDetails.lengthSeconds);
      };
      return {
        title: this.title,
        url: this.ytUrl,
        path: this.path,
        dlMethod: this.dlMethod,
        duration: length(),
        quality: {
          audio: this.aQuality && this.aQuality.itag,
          video: this.vQuality && this.vQuality.itag
        },
        sourceReq: this.sourceReq,
        cookie: this.useCookie ? cookie : false,
        ...extraProp
      };
    },

    reserve() {
      ipcRenderer.send(
        'reserve-que',
        this.getQueFromData({
          reserveTime: '' // get it from this.videoInfo.videoDetails.liveBroadcastDetails
        })
      );
    },

    addQue(andStart) {
      if (!this.$refs.form.validate()) return;
      ipcRenderer.send(
        andStart ? 'start-que' : 'add-que',
        this.getQueFromData()
      );
      this.snackMsg = '已新增至佇列';
      this.snack = true;
      this.resetData();
      if (andStart) {
        this.SET_SHOW_QUE(true);
      }
    },

    stop() {
      ipcRenderer.send('stop-que', this.getQueList[0].id);
    }
  }
};
</script>
