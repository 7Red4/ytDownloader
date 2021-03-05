<template>
  <v-card class="fill-height">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>
          從檔案匯入歌曲 / 歌單
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-file-input
            v-model="uploadSouceFile"
            label="從檔案匯入歌曲"
            @change="handleSourceFile"
            :error-messages="isSourceFileError ? '檔案有誤' : null"
          ></v-file-input>
          <v-file-input
            v-model="uploadPlayListFile"
            label="從檔案匯入歌單"
            @change="handlePlayListFile"
            :error-messages="isPlayListFileError ? '檔案有誤' : null"
          ></v-file-input>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
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
        v-if="(PlaySource.videoDetails || hasSource) && ytId === PlaySource.id"
        :loading="!PlaySource.src"
        :videoDetails="
          hasSource ? getSourceById(ytId).videoDetails : PlaySource.videoDetails
        "
      />

      <v-form v-if="PlaySource.src && ytId === PlaySource.id" ref="tagCheck">
        <v-row justify="space-between" align="center" class="mb-4">
          <v-col>
            <v-text-field
              v-model="start"
              label="開始時間"
              placeholder="秒數 或 時:分:秒"
              hint="ex: 207 或 00:03:27"
              :error-messages="startError"
              @focus="
                startError = null;
                endError = null;
              "
            >
              <template #append>
                <v-btn text x-small @click="start = $s2hms(0)">開頭</v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="end"
              label="結束時間"
              placeholder="秒數 或 時:分:秒"
              hint="ex: 526 或 00:08:46"
              :error-messages="endError"
              @focus="
                startError = null;
                endError = null;
              "
            >
              <template #append>
                <v-btn
                  text
                  x-small
                  @click="end = $s2hms(+PlaySource.lengthSeconds)"
                >
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
              @focus="e => e.target.select()"
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
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
              <span>新增歌曲</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-form>

      <div class="d-flex mb-3">
        <h2>此曲源已新增的歌曲</h2>
      </div>
      <v-card max-height="400" class="overflow-auto">
        <v-card-text>
          <p v-if="!addedSongs">尚無歌曲</p>
          <v-list>
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
                <v-icon
                  class="ml-5"
                  @click="
                    SET_PLAYING_LIST_IDS([]);
                    SET_CURRENT_PLAY_SONG(song);
                  "
                >
                  mdi-play-circle
                </v-icon>
                <v-menu left>
                  <template #activator="{ on }">
                    <v-icon v-on="on">mdi-dots-vertical-circle</v-icon>
                  </template>
                  <v-list dense>
                    <v-list-item @click="DELETE_SONG(song)">
                      <v-list-item-icon>
                        <v-icon color="error">mdi-delete</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>刪除</v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="openAddToListFrame(song)">
                      <v-list-item-icon>
                        <v-icon color="error">mdi-plus</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>新增至清單</v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list-item>
              <v-divider :key="`${ytId}-${song.id}-divider`"></v-divider>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-card-text>

    <v-dialog v-model="isAddToListDialogShow" max-width="400" scrollable>
      <v-card>
        <v-card-title>要加入的播放清單</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list dense>
            <template v-for="list in getPlayLists">
              <v-list-item
                :key="`add-list:${list.id}`"
                @click="addToList(list)"
              >
                {{ list.title }}
                <v-spacer></v-spacer>
                {{ list.songs.length }} 首歌
              </v-list-item>
              <v-divider :key="`add-list:${list.id}-divider`"></v-divider>
            </template>
            <v-list-item>
              <v-text-field v-model="newListName" label="新增清單" hide-details>
                <template #append v-if="!!newListName">
                  <v-btn text @click="addToList()">新增</v-btn>
                </template>
              </v-text-field>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
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
      ytUrl: '',
      loading: false,

      PlaySource,

      start: 0,
      end: '',
      tag: '',

      isAddToListDialogShow: false,
      newListName: '',
      addingSong: Song,

      startError: null,
      endError: null,

      isSourceFileError: false,
      isPlayListFileError: false,
      uploadSouceFile: null,
      uploadPlayListFile: null
    };
  },

  computed: {
    ...mapGetters(['getSourceById', 'getSongsBySourceId', 'getPlayLists']),
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
        this.end = this.$s2hms(this.PlaySource.lengthSeconds);
        this.tag = this.PlaySource.title;
      }
    }
  },

  methods: {
    ...mapActions([
      'SET_PLAY_SOURCE',
      'SET_SONG',
      'DELETE_SONG',
      'SET_CURRENT_PLAY_SONG',
      'SET_PLAYING_LIST_IDS',
      'SET_PLAY_LIST',
      'ADD_SONG_TO_LIST'
    ]),
    handleSourceFile(file) {
      this.isSourceFileError = false;
      if (!file) return;
      this.isLoadingFile = true;

      const fr = new FileReader();

      const data = fr.readAsText(file);
      fr.onload = () => {
        try {
          const sources = JSON.parse(fr.result);
          this.importSource(sources);
          this.$emit('to-captured');
        } catch (error) {
          this.isSourceFileError = true;
          console.error(error);
        } finally {
          this.isLoadingFile = false;
          this.uploadSouceFile = null;
        }
      };
    },
    handlePlayListFile(file) {
      this.isPlayListFileError = false;
      if (!file) return;
      this.isLoadingFile = true;

      const fr = new FileReader();

      const data = fr.readAsText(file);
      fr.onload = () => {
        try {
          const playlist = JSON.parse(fr.result);
          this.importPlayList(playlist);
          this.$emit('to-captured');
        } catch (error) {
          this.isPlayListFileError = true;
          console.error(error);
        } finally {
          this.isLoadingFile = false;
          this.uploadPlayListFile = null;
        }
      };
    },
    async importSource(sources, playlistId) {
      const wait = () => {
        return new Promise(resolve => setTimeout(resolve, 2));
      };

      for (const { ytUrl, songs } of sources) {
        const ytId = this.$pyt(ytUrl);
        const existedSource = this.getSourceById(ytId);
        if (!ytId) throw new Error('invalid url');

        const Source = existedSource || new PlaySource({ url: ytUrl });
        if (!existedSource) this.SET_PLAY_SOURCE(Source);
        Source.onBlobReady(async () => {
          if (!Source.src) Source.setSrc(URL.createObjectURL(Source.audio));
          for (const song of songs) {
            let flag = true;
            const start = this.$hms2s(song.start);
            const end = this.$hms2s(song.end);
            if (start >= end) {
              flag = false;
            }

            if (end > +Source.lengthSeconds) {
              flag = false;
            }

            if (flag) {
              const newSong = new Song({
                src: Source.src,
                ytId: Source.id,
                title: Source.title,
                author: Source.author,
                start,
                end,
                length: end - start,
                tag: song.tag || '未命名'
              });
              this.SET_SONG(newSong);
              if (playlistId) {
                this.ADD_SONG_TO_LIST({
                  listId: playlistId,
                  songId: newSong.id
                });
              }
            }
            await wait();
          }
        });
      }
    },
    async importPlayList(playList) {
      const playlistId = Date.now();

      const { title, songs } = playList;

      this.SET_PLAY_LIST({
        id: playlistId,
        title,
        songs: []
      });

      // parse to source list
      const sourceList = [];
      const groupByYtId = {};

      songs.forEach(song => {
        !groupByYtId[song.ytId] && (groupByYtId[song.ytId] = []);
        groupByYtId[song.ytId].push(song);
      });

      for (const ytId in groupByYtId) {
        const ytUrl = `https://youtube.com/watch?v=${ytId}`;
        sourceList.push({ ytUrl, songs: groupByYtId[ytId] });
      }

      await this.importSource(sourceList, playlistId);
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
    capture() {
      if (this.PlaySource) {
        if (this.PlaySource.url === this.ytUrl) return;
      }
      if (!this.ytUrl || !this.ytId) return;

      this.loading = true;

      const source = this.getSourceById(this.ytUrl);

      if (source) {
        this.PlaySource = source;
        this.loading = false;
      } else {
        this.PlaySource = new PlaySource({ url: this.ytUrl });
        this.PlaySource.onBlobReady(() => {
          this.PlaySource.setSrc(URL.createObjectURL(this.PlaySource.audio));
          this.end = this.$s2hms(this.PlaySource.lengthSeconds);
          this.tag = this.PlaySource.title;
          this.SET_PLAY_SOURCE(this.PlaySource);

          this.loading = false;
        });
      }
    },
    setSong() {
      let flag = true;
      const start = this.$hms2s(this.start);
      const end = this.$hms2s(this.end);
      if (start >= end) {
        this.startError = '開頭時間需比結束時間少';
        flag = false;
      }

      if (end > +this.PlaySource.lengthSeconds) {
        this.endError = '結束時間超過歌曲長度';
        flag = false;
      }
      if (!this.$refs.tagCheck.validate() || !flag) return;

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
    },
    openAddToListFrame(song) {
      this.addingSong = song;
      this.isAddToListDialogShow = true;
    },
    addToList(list) {
      if (list) {
        this.ADD_SONG_TO_LIST({ listId: list.id, songId: this.addingSong.id });
      } else {
        this.SET_PLAY_LIST({
          id: Date.now(),
          title: this.newListName,
          songs: [this.addingSong.id]
        });
      }
      this.isAddToListDialogShow = false;
      this.newListName = '';
    }
  }
};
</script>
