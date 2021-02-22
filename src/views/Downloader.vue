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
            直播中的影片無法選擇音質
          </p>

          <v-menu max-height="400">
            <template #activator="{ on }">
              <v-text-field
                v-on="on"
                :value="vQualityText"
                label="選擇畫質"
                readonly
                outlined
              ></v-text-field>
            </template>
            <v-list>
              <v-list-item-group v-model="vQuality" label="選擇畫質">
                <v-list-item value="highestvideo">
                  最高畫質
                </v-list-item>
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
                label="選擇音質"
                readonly
                outlined
              ></v-text-field>
            </template>
            <v-list>
              <v-list-item-group v-model="aQuality" label="選擇音質">
                <v-list-item value="highestaudio">
                  最高音質
                </v-list-item>
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

        <v-card-actions>
          <v-btn color="primary" @click="addQue(true)">
            加到佇列並開始
          </v-btn>
          <v-btn color="secondary" @click="addQue(false)">
            加到佇列
          </v-btn>
        </v-card-actions>
      </template>
    </v-container>

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

import { mapActions, mapGetters } from 'vuex';

import VideoInfoCard from '@/components/VideoInfoCard';
import Tracker from '@/classes/Tracker';

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
      vQuality: { qualityLabel: '最高畫質', mimeType: 'mp4' },
      aQuality: { mimeType: '最高音質' }
    };
  },

  computed: {
    ...mapGetters(['getQueList', 'getQueById']),
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

    ipcRenderer.on('set-que-id-reply', (event, tracker) =>
      this.SET_QUE(tracker)
    );
  },

  methods: {
    ...mapActions(['SET_QUE', 'DELETE_QUE', 'SET_SHOW_QUE']),
    resetData() {
      const originData = {
        ytUrl: '',
        path: this.$db.get('dl_path').value() || '',
        tumbnailPath: '',
        thumbnailURL: '',
        title: '',
        loading: false,
        videoInfo: null,
        vQuality: { qualityLabel: '最高畫質', mimeType: 'mp4' },
        aQuality: { mimeType: '最高音質' }
      };

      Object.keys(originData).forEach(key => {
        this[key] = originData[key];
      });
    },
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

    addQue(andStart) {
      if (!this.$refs.form.validate()) return;
      ipcRenderer.send(andStart ? 'start-que' : 'add-que', {
        title: this.title,
        url: this.ytUrl,
        path: this.path,
        quality: {
          audio: this.aQuality ? this.aQuality.itag : 'highestaudio',
          video: this.vQuality ? this.vQuality.itag : 'highestvideo'
        }
      });
      this.snackMsg = '已新增至佇列';
      this.snack = true;
      this.resetData();
    },

    stop() {
      ipcRenderer.send('stop-que', this.getQueList[0].id);
    }
  }
};
</script>
