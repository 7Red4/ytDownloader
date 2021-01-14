<template>
  <v-card>
    <v-card-text>
      <v-text-field
        v-model="ytUrl"
        @focus="handleFocus"
        label="youtube 網址"
        class="mb-4"
      >
        <template #append-outer>
          <v-btn
            color="primary"
            @click="capture"
            :disabled="hasSource"
            :loading="loading"
          >
            {{ hasSource ? '已獲取歌曲資訊' : '獲取歌曲資訊' }}
          </v-btn>
        </template>
      </v-text-field>

      <VideoInfoCard
        v-if="PlaySource.videoDetails"
        :videoDetails="PlaySource.videoDetails"
      />

      <v-row justify="space-between" align="center" class="mb-4">
        <v-col cols="auto">
          <v-text-field
            label="開始時間"
            placeholder="秒數 或 時:分:秒"
            hint="ex: 207 或 00:03:27"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            label="結束時間"
            placeholder="秒數 或 時:分:秒"
            hint="ex: 526 或 00:08:46"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field label="標題"></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn fab small depressed color="primary">
                <v-icon v-on="on">
                  mdi-plus
                </v-icon>
              </v-btn>
            </template>
            <span>新增歌曲片段</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import PlaySource from '@/classes/PlaySource';

import VideoInfoCard from '@/components/VideoInfoCard';
export default {
  components: { VideoInfoCard },
  data() {
    return {
      ytUrl: 'https://www.youtube.com/watch?v=3cqV5BKJHyk',
      loading: false,

      PlaySource
    };
  },

  computed: {
    ...mapGetters(['getSourceByYtUrl']),
    hasSource() {
      return !!this.getSourceByYtUrl(this.ytUrl);
    }
  },

  methods: {
    ...mapActions(['SET_PLAY_SOURCE']),
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
        e && e.target.blur();
      }
    },
    capture() {
      if (this.PlaySource) {
        if (this.PlaySource.url === this.ytUrl) return;
      }
      this.loading = true;

      const source = this.getSourceByYtUrl(this.ytUrl);

      if (source) {
        this.PlaySource = source;
        this.loading = false;
      } else {
        this.PlaySource = new PlaySource({ url: this.ytUrl });
        this.PlaySource.onBlobReady(() => {
          this.PlaySource.setSrc(URL.createObjectURL(this.PlaySource.audio));
          this.SET_PLAY_SOURCE(this.PlaySource);
          this.loading = false;
        });
      }
    }
  }
};
</script>

<style></style>
