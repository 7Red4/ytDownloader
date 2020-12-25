<template>
  <div class="home">
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
        <v-card class="mb-10">
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
                {{ videoInfo.videoDetails.title }}
              </v-card-title>
              <v-card-text>
                {{ videoInfo.videoDetails.description.slice(0, 120) }}...
              </v-card-text>
            </v-col>
          </v-row>
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

          <p>
            都不選擇時 預設皆為最高
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
                  v-for="(format,
                  i) in videoInfo.formats.filter(({ mimeType }) =>
                    /video/.test(mimeType)
                  )"
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

          <v-menu max-height="400">
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
                  v-for="(format,
                  i) in videoInfo.formats.filter(({ mimeType }) =>
                    /audio/.test(mimeType)
                  )"
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

        <v-btn color="success" @click="start">下載</v-btn>
      </template>
    </v-container>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron';
import filenamify from 'filenamify';

export default {
  name: 'Home',

  data() {
    return {
      ytUrl: 'https://www.youtube.com/watch?v=UBSx4qqeikY',
      path: '/Users/red4/Downloads',
      title: '',
      loading: false,
      videoInfo: null,
      vQuality: null,
      aQuality: null
    };
  },

  computed: {
    vQualityText() {
      return this.vQuality
        ? `${this.vQuality.qualityLabel || ''} - ${this.vQuality.mimeType}`
        : '';
    },
    aQualityText() {
      return this.aQuality ? `${this.aQuality.mimeType}` : '';
    }
  },

  watch: {
    videoInfo(v) {
      v && (this.title = filenamify(v.videoDetails.title));
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

    ipcRenderer.on('download-complete', () => console.log('complete'));
    ipcRenderer.on('download-fail', () => console.log('fail'));
  },

  methods: {
    handleFocus() {
      navigator.clipboard.readText().then(text => this.analyzeText(text));
    },

    analyzeText(text) {
      const urlReg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
      const isUrl = urlReg.test(text);
      const hasYoutube = /youtube|youtu.be/.test(text);

      if (isUrl && hasYoutube) {
        this.ytUrl = text;
        this.getVideoInfo(text);
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
      ipcRenderer.send('download', {
        title: this.title,
        url: this.ytUrl,
        path: this.path,
        quality: {
          audio: this.aQuality ? this.aQuality.itag : 'highestaudio',
          video: this.vQuality ? this.vQuality.itag : 'highestvideo'
        }
      });
      //
    }
  }
};
</script>
