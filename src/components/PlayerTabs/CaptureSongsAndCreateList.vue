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

      <v-form v-if="PlaySource.src && ytId === PlaySource.id" ref="tagCheck">
        <v-row justify="space-between" align="center" class="mb-4">
          <v-col>
            <v-text-field
              v-model="start"
              label="開始時間"
              placeholder="秒數 或 時:分:秒"
              hint="ex: 207 或 00:03:27"
              :rules="[]"
              lazy-validation
            >
              <template #append>
                <v-btn text x-small @click="start = 0">開頭</v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="end"
              label="結束時間"
              placeholder="秒數 或 時:分:秒"
              hint="ex: 526 或 00:08:46"
              :rules="[]"
              lazy-validation
            >
              <template #append>
                <v-btn text x-small @click="end = +PlaySource.lengthSeconds">
                  結尾
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col>
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
      </v-form>

      <div class="d-flex mb-3">
        <h2>
          此曲源已新增的歌曲
        </h2>
        <v-spacer></v-spacer>
        <v-btn
          v-if="addedSongs"
          fab
          small
          depressed
          color="error"
          @click="isEdit = !isEdit"
        >
          <v-icon>{{ isEdit ? 'mdi-pencil-off' : 'mdi-pencil' }}</v-icon>
        </v-btn>
      </div>
      <v-card max-height="400" class="overflow-auto">
        <v-card-text>
          <p v-if="!addedSongs">尚無歌曲</p>
          <v-list three-line>
            <template v-for="song in addedSongs">
              <v-list-item :key="`${ytId}-${song.id}`">
                <v-list-item-content>
                  <span>
                    歌曲:
                    <span class="text-subtitle-1">{{ song.tag }}</span>
                  </span>
                  <br />
                  <span>
                    曲源:
                    <span class="text-subtitle-2">{{ song.title }}</span>
                  </span>
                  <br />
                  <span>
                    曲源作者:
                    <span class="text-body-2">{{ song.author }}</span>
                  </span>
                </v-list-item-content>
                <span>歌曲長度: {{ $s2hms(song.length) }}</span>
                <v-icon class="ml-5" @click="SET_CURRENT_PLAY_SONG(song)">
                  mdi-play-circle
                </v-icon>
                <v-fab-transition>
                  <v-icon
                    v-if="isEdit"
                    class="ml-5"
                    color="error"
                    @click="DELETE_SONG(song)"
                  >
                    mdi-delete
                  </v-icon>
                </v-fab-transition>
              </v-list-item>
              <v-divider :key="`${ytId}-${song.id}-divider`"></v-divider>
            </template>
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

const isDev = process.env.NODE_ENV !== 'production';
import testData from '@/test/test_playSource';

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
      ytUrl: '',
      loading: false,

      PlaySource,
      isEdit: false,

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

  async mounted() {
    if (isDev) {
      this.ytUrl = testData.ytUrl;
      this.capture();
    }
  },

  methods: {
    ...mapActions([
      'SET_PLAY_SOURCE',
      'SET_SONG',
      'DELETE_SONG',
      'SET_CURRENT_PLAY_SONG'
    ]),
    /* async */ byImport() {
      //
    },
    async setTestData() {
      const wait = this.$nextTick;
      await wait();

      for (const song of testData.songs) {
        Object.keys(song).forEach(k => (this[k] = song[k]));
        await wait();
        this.setSong();
        await wait();
      }
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
        e && e.target.blur();
      }
    },
    timestampRule(v) {
      if (typeof v === 'number') {
        return true;
      } else {
        return !!v || '填個時間吧';
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
          if (isDev) this.setTestData();
        });
      }
    },
    setSong() {
      if (!this.$refs.tagCheck.validate()) return;
      const start = this.$hms2s(this.start);
      const end = this.$hms2s(this.end);

      const song = new Song({
        src: this.PlaySource.src,
        ytId: this.PlaySource.id,
        title: this.PlaySource.title,
        author: this.PlaySource.author,
        start,
        end,
        length: end - start,
        tag: this.tag
      });

      this.SET_SONG(song);

      this.$refs.tagCheck.reset();
    }
  }
};
</script>

<style lang="scss" scoped></style>
