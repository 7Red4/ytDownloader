<template>
  <v-card>
    <v-card-title v-if="!getCurrentPlaying">
      目前沒有正在播放的歌曲
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-card v-if="getCurrentPlaying">
        <v-card-title>
          <p>正在播放</p>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list>
            <v-list-item @click="showShongDetail(getCurrentPlaying)">
              <v-list-item-avatar>
                <v-icon color="primary">
                  mdi-music
                </v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title class="text-truncate">
                  {{ getCurrentPlaying.tag }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-truncate">
                  {{ getCurrentPlaying.title }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="text-truncate">
                  {{ getCurrentPlaying.author }}
                </v-list-item-subtitle>
              </v-list-item-content>
              {{ $s2hms(getCurrentPlaying.length) }}
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
      <div class="py-2"></div>
      <v-card v-if="getPlayingListIds.length">
        <v-card-title>
          <p>播放佇列</p>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list>
            <template v-for="(song, i) in playingList">
              <v-list-item
                :key="`playing:${song.id}`"
                @click="showShongDetail(song)"
              >
                <v-list-item-avatar>
                  <v-icon v-if="i === getCurrentPlayingIdx" color="primary">
                    mdi-music
                  </v-icon>
                </v-list-item-avatar>
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
                <v-icon class="ml-5" @click.stop="SET_CURRENT_PLAY_SONG(song)">
                  mdi-play-circle
                </v-icon>
              </v-list-item>
              <v-divider :key="`playing:${song.id}-divider`"></v-divider>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-card-text>

    <v-dialog v-model="isShowSongDetail">
      <v-card v-if="showingSong.id">
        <v-card-title>歌曲詳細</v-card-title>
        <v-card-text>
          <v-card>
            <v-card-text>
              <v-row align="center">
                <v-col cols="2">歌曲名稱 :</v-col>
                <v-col class="text-h5">{{ showingSong.tag }}</v-col>
              </v-row>
              <v-row align="center">
                <v-col cols="2">曲源標題 :</v-col>
                <v-col class="text-subtitle-1">
                  {{ showingSong.title }}
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col cols="2">曲源作者 :</v-col>
                <v-col class="text-subtitle-2">
                  {{ showingSong.author }}
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-text>
          <v-card>
            <v-card-title>曲源資訊</v-card-title>
            <VideoInfoCard
              :videoDetails="getSourceById(showingSong.ytId).videoDetails"
            />
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import Song from '@/classes/Song';

import VideoInfoCard from '@/components/VideoInfoCard';

export default {
  components: { VideoInfoCard },

  data() {
    return {
      isShowSongDetail: false,
      showingSong: Song
    };
  },

  computed: {
    ...mapGetters([
      'getCurrentPlaying',
      'getPlayingListIds',
      'getCurrentPlayingIdx',
      'getSongById',
      'getSourceById'
    ]),
    playingList() {
      return this.getPlayingListIds.map(id => this.getSongById(id));
    }
  },

  methods: {
    ...mapActions(['SET_CURRENT_PLAY_SONG']),
    showShongDetail(song) {
      this.showingSong = song;
      this.isShowSongDetail = true;
    }
  }
};
</script>
