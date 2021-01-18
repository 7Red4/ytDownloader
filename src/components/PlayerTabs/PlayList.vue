<template>
  <v-card>
    <v-card-title v-if="!getPlayLists">
      目前沒有歌單
    </v-card-title>
    <v-card-text>
      <v-btn color="primary" @click="newCreate">建立</v-btn>
    </v-card-text>
    <v-card v-if="getPlayLists" class="my-2">
      <v-card-title>
        已建立的播放清單
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-list>
          <template v-for="playList of getPlayLists">
            <v-list-item :key="playList.id" @click="edit(playList)">
              <v-list-item-content>
                {{ playList.title }}
                <v-spacer></v-spacer>
                {{ playList.songs.length }} 首歌
              </v-list-item-content>

              <v-icon @click.stop="play(playList.songs)">
                mdi-play-circle
              </v-icon>
              <v-menu left>
                <template #activator="{ on }">
                  <v-icon v-on="on">mdi-dots-vertical-circle</v-icon>
                </template>
                <v-list dense>
                  <v-list-item @click="DELETE_PLAY_LIST(playList)">
                    <v-list-item-icon>
                      <v-icon color="error">
                        mdi-delete
                      </v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      刪除
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item>
            <v-divider :key="`playList:${playList.id}`"></v-divider>
          </template>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="listDialog" persistent scrollable>
      <v-card max-height="620">
        <v-card-title class="pt-6">
          <v-row>
            <v-col cols="12" class="py-0">
              <v-form ref="listNameForm">
                <v-text-field
                  ref="playListTitleEl"
                  v-model="playListTitle"
                  label="清單名稱"
                  :rules="[v => !!v || '填個名字吧']"
                ></v-text-field>
              </v-form>
            </v-col>
            <v-col cols="12" class="d-flex py-0">
              <v-spacer></v-spacer>
              <span class="text-caption">
                已選取 {{ pickedSongIds.length }} 首歌
              </span>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item @click="pickAll">
              <v-list-item-icon>
                <v-checkbox
                  hide-details
                  :input-value="pickedSongIds.length === pickingList.length"
                  :indeterminate="
                    !!(
                      pickedSongIds.length &&
                      pickedSongIds.length < pickingList.length
                    )
                  "
                  class="ma-0"
                  readonly
                ></v-checkbox>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  全選
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item-group v-model="pickedSongIds" multiple>
              <template v-for="song in pickingList">
                <v-list-item
                  :key="`${song.id}-tile`"
                  :value="song.id"
                  #default="{ active }"
                >
                  <v-list-item-icon>
                    <v-checkbox hide-details :input-value="active"></v-checkbox>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title class="text-truncate">
                      {{ song.tag }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-truncate">
                      {{ song.title }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="text-truncate">
                      {{ song.author }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  {{ $s2hms(song.length) }}
                </v-list-item>
                <v-divider :key="`${song.id}-divider`"></v-divider>
              </template>
            </v-list-item-group>
          </v-list>
        </v-card-text>
        <v-card-actions class="d-flex pb-6">
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="reset">取消</v-btn>
          <v-btn color="primary" @click="save">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  data() {
    return {
      listId: null,
      listDialog: false,
      playListTitle: '',
      pickingList: [],
      pickedSongIds: []
    };
  },

  computed: {
    ...mapGetters([
      'getSongs',
      'getSongById',
      'getPlayLists',
      'getPlayListById'
    ])
  },

  watch: {
    listDialog(v) {
      if (v) {
        setTimeout(() => {
          this.$refs.playListTitleEl.focus();
        });
      } else {
        this.filter = 'all';
        this.$refs.playListTitleEl.blur();
      }
    }
  },

  methods: {
    ...mapActions([
      'SET_PLAY_LIST',
      'SET_PLAYING_LIST_IDS',
      'SET_CURRENT_PLAY_SONG',
      'DELETE_PLAY_LIST'
    ]),
    pickAll(e) {
      const isAll = this.pickedSongIds.length === this.pickingList.length;
      const isIndeterminate =
        this.pickedSongIds.length &&
        this.pickedSongIds.length < this.pickingList.length;
      if (isAll || isIndeterminate) {
        this.pickedSongIds = [];
      } else {
        this.pickedSongIds = this.pickingList.map(({ id }) => id);
      }
    },
    newCreate() {
      this.pickingList = Object.values(this.getSongs);
      this.listDialog = true;
    },
    play(songs) {
      this.SET_PLAYING_LIST_IDS(songs);
      this.SET_CURRENT_PLAY_SONG(this.getSongById(songs[0]));
    },

    edit(list) {
      this.listId = list.id;
      this.playListTitle = list.title;
      this.pickingList = Object.values(this.getSongs).sort(song =>
        list.songs.includes(song.id) ? -1 : 1
      );
      this.pickedSongIds = list.songs;
      this.listDialog = true;
    },

    reset() {
      this.listDialog = false;
      this.listId = null;
      this.$refs.listNameForm.reset();
      this.pickedSongIds = [];
      this.pickingList = [];
    },
    save() {
      if (!this.$refs.listNameForm.validate()) return;
      this.SET_PLAY_LIST({
        id: this.listId || Date.now(),
        title: this.playListTitle,
        songs: this.pickedSongIds
      });

      this.reset();
    }
  }
};
</script>
