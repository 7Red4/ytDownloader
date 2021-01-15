<template>
  <v-card>
    <v-card-title v-if="!getPlayLists">
      目前沒有歌單
    </v-card-title>
    <v-card-text>
      <v-btn color="primary" @click="newCreate">建立</v-btn>
    </v-card-text>
    <v-card-text>
      <v-list>
        <template v-for="playList of getPlayLists">
          <v-list-item :key="playList.id" @click="edit(playList)">
            <v-list-item-content>
              {{ playList.title }}
              <v-spacer></v-spacer>
              {{ playList.songs.length }} 首歌
            </v-list-item-content>

            <v-list-item-action @click.stop="play(playList.songs)">
              <v-icon>mdi-play-circle</v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider :key="`playList:${playList.id}`"></v-divider>
        </template>
      </v-list>
    </v-card-text>

    <v-dialog v-model="listDialog" persistent scrollable>
      <v-card>
        <v-card-title class="pt-6">
          <v-row>
            <v-col cols="12" class="py-0">
              <v-text-field
                v-model="playListTitle"
                label="清單名稱"
              ></v-text-field>
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
          <v-list three-line>
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

// TODO: filter the songs by all, added, not added

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

  methods: {
    ...mapActions([
      'SET_PLAY_LIST',
      'SET_PLAYING_LIST',
      'SET_CURRENT_PLAY_SONG'
    ]),
    newCreate() {
      this.pickingList = this.getSongs;
      this.listDialog = true;
    },
    play(songs) {
      this.SET_PLAYING_LIST(songs);
      this.SET_CURRENT_PLAY_SONG(this.getSongById(songs[0]));
    },

    edit(list) {
      this.listId = list.id;
      this.playListTitle = list.title;
      this.pickingList = Object.values(this.getSongs);
      this.pickedSongIds = list.songs;
      this.listDialog = true;
    },

    reset() {
      this.listId = null;
      this.playListTitle = '';
      this.pickedSongIds = [];
      this.pickingList = [];
      this.listDialog = false;
    },
    save() {
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
