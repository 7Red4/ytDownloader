<template>
  <v-card class="fill-height">
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
            {{ hasSource ? '已獲取曲源資訊' : '獲取曲源資訊' }}
          </v-btn>
        </template>
      </v-text-field>

      <VideoInfoCard
        v-if="PlaySource.videoDetails && ytId === PlaySource.id"
        :videoDetails="PlaySource.videoDetails"
      />

      <v-row
        v-if="PlaySource.src"
        justify="space-between"
        align="center"
        class="mb-4"
      >
        <v-col cols="auto">
          <v-text-field
            v-model="start"
            label="開始時間"
            placeholder="秒數 或 時:分:秒"
            hint="ex: 207 或 00:03:27"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="end"
            label="結束時間"
            placeholder="秒數 或 時:分:秒"
            hint="ex: 526 或 00:08:46"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="tag"
            label="標題"
            :rules="[v => !!v || '填點什麼吧']"
            lazy-validation
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                @click="setSong"
                fab
                small
                depressed
                color="primary"
              >
                <v-icon>
                  mdi-plus
                </v-icon>
              </v-btn>
            </template>
            <span>新增歌曲</span>
          </v-tooltip>
        </v-col>
      </v-row>

      <v-card max-height="400">
        <v-card-title>此曲源已新增的歌曲</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="song in addedSongs"
              :key="`${ytId}-${song.id}`"
              link
            >
              {{ song.tag }}
              <v-spacer></v-spacer>
              {{ song.length }}
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import PlaySource from '@/classes/PlaySource';
import Song from '@/classes/Song';

import VideoInfoCard from '@/components/VideoInfoCard';

export default {
  components: { VideoInfoCard },

  props: {
    editingSourceId: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      ytUrl: 'https://www.youtube.com/watch?v=3cqV5BKJHyk',
      loading: false,

      PlaySource,

      start: 0,
      end: '',
      tag: ''
    };
  },

  computed: {
    ...mapGetters(['getSourceById', 'getSongsBySourceId']),
    hasSource() {
      return !!this.getSourceById(this.ytId);
    },
    ytId() {
      return this.$pyt(this.ytUrl);
    },
    addedSongs() {
      return this.getSongsBySourceId(this.ytId);
    }
  },

  watch: {
    editingSourceId(v) {
      if (v) {
        this.ytUrl = `https://www.youtube.com/watch?v=${v}`;
        this.PlaySource = this.getSourceById(v) || PlaySource;
      }
    }
  },

  methods: {
    ...mapActions(['SET_PLAY_SOURCE', 'SET_SONG']),
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

      const source = this.getSourceById(this.ytUrl);

      if (source) {
        this.PlaySource = source;
        this.loading = false;
      } else {
        this.PlaySource = new PlaySource({ url: this.ytUrl });
        this.PlaySource.onBlobReady(() => {
          this.PlaySource.setSrc(URL.createObjectURL(this.PlaySource.audio));
          this.end = Number(this.PlaySource.lengthSeconds);
          this.SET_PLAY_SOURCE(this.PlaySource);

          this.loading = false;
        });
      }
    },
    setSong() {
      const start = this.$hms2s(this.start);
      const end = this.$hms2s(this.end);

      const song = new Song({
        src: this.PlaySource.src,
        ytId: this.PlaySource.id,
        start,
        end,
        length: end - start,
        tag: this.tag
      });

      this.SET_SONG(song);

      this.start = '';
      this.end = '';
      this.tag = '';
    }
  }
};
</script>

<style></style>
