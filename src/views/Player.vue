<template>
  <v-card class="py-4 fill-height">
    <v-navigation-drawer v-model="drawer" absolute>
      <v-list>
        <v-list-item>
          我的歌單
        </v-list-item>
        <v-list-item>
          我的歌單
        </v-list-item>
        <v-list-item>
          我的歌單
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-container>
      <v-btn icon @click="drawer = true" class="mb-4">
        <v-icon>
          mdi-menu
        </v-icon>
      </v-btn>

      <v-card width="100%" flat>
        <v-text-field
          v-model="ytUrl"
          label="youtube 網址"
          outlined
        ></v-text-field>

        <v-row>
          <v-col>
            <v-text-field label="開始時間" outlined></v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="結束時間" outlined></v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="標題" outlined></v-text-field>
          </v-col>
        </v-row>

        <v-btn color="primary" @click="capture" :loading="loading">
          獲取歌曲資訊
        </v-btn>
      </v-card>
    </v-container>

    <template v-if="!loading && Player">
      <v-slide-y-reverse-transition>
        <PlayerTile :Player="Player" :src="playurl" />
      </v-slide-y-reverse-transition>
    </template>
  </v-card>
</template>

<script>
import Player from '@/controller/player';

import PlayerTile from '@/components/PlayerTile';

export default {
  components: {
    PlayerTile
  },
  data() {
    return {
      drawer: false,
      ytUrl: 'https://www.youtube.com/watch?v=D2zTXGG00BI',
      loading: false,

      Player: null,
      playurl: ''
    };
  },

  methods: {
    capture() {
      if (this.Player) {
        if (this.Player.url === this.ytUrl) return;
      }
      this.loading = true;

      this.Player = new Player({ url: this.ytUrl });
      this.Player.onBlobReady(() => {
        this.playurl = URL.createObjectURL(this.Player.audio);
        this.loading = false;
      });
    }
  }
};
</script>
