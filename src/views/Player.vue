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

        <v-btn color="primary" @click="capture">獲取歌曲資訊</v-btn>
      </v-card>
    </v-container>

    <v-card tile class="player_sheet">
      <template v-if="loading">
        <div class="d-flex justify-center ma-7">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>
      </template>
      <template v-else>
        <template v-if="Player">
          <audio ref="PlayerEl" hidden :src="playurl"></audio>
          <v-slider
            v-model="t"
            class="progress_bar"
            :max="lengthSeconds"
            @input="setTime"
            @mousedown="sliderMousedown"
            @mouseup="sliderMouseup"
            hide-details
          ></v-slider>
          <div class="d-flex justify-center grey--text mt-3">
            {{ `${t2time} / ${lengthSeconds2time}` }}
          </div>
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  {{ currentPlaying.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ currentPlaying.author }}
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-spacer></v-spacer>

              <v-list-item-icon>
                <v-btn icon>
                  <v-icon>mdi-skip-previous</v-icon>
                </v-btn>
              </v-list-item-icon>

              <v-list-item-icon
                :class="{ 'mx-5': $vuetify.breakpoint.mdAndUp }"
              >
                <v-btn icon @click="playPause">
                  <v-icon>mdi-{{ isPause ? 'play' : 'pause' }}</v-icon>
                </v-btn>
              </v-list-item-icon>

              <v-list-item-icon
                class="ml-0"
                :class="{ 'mr-3': $vuetify.breakpoint.mdAndUp }"
              >
                <v-btn icon>
                  <v-icon>mdi-skip-next</v-icon>
                </v-btn>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </template>
      </template>
    </v-card>
  </v-card>
</template>

<script>
import Player from '@/controller/player';

export default {
  data() {
    return {
      drawer: false,
      ytUrl: 'https://www.youtube.com/watch?v=D2zTXGG00BI',
      lengthSeconds: 0,
      t: 0,
      isPause: true,
      loading: false,
      isSliderHolding: false,

      Player: null,
      playurl: ''
    };
  },

  computed: {
    lengthSeconds2time() {
      return new Date((this.Player ? this.Player.lengthSeconds : 0) * 1000)
        .toISOString()
        .substr(11, 8);
    },
    t2time() {
      return new Date(this.t * 1000).toISOString().substr(11, 8);
    },
    currentPlaying() {
      if (!this.Player) return {};
      return {
        title: this.Player.title,
        author: this.Player.author
      };
    }
  },

  methods: {
    capture() {
      if (this.Player) {
        if (this.Player.url === this.ytUrl) return;
      }
      this.Player = new Player({ url: this.ytUrl });
      this.loading = true;
      this.Player.onBlobReady(() => {
        this.setInfo();
        this.playurl = URL.createObjectURL(this.Player.audio);
        this.loading = false;
        this.$nextTick(() => {
          this.settingPlayerEl();
        });
      });
    },
    playPause() {
      if (this.$refs.PlayerEl.paused) {
        this.$refs.PlayerEl.play();
        this.isPause = false;
      } else {
        this.$refs.PlayerEl.pause();
        this.isPause = true;
      }
    },
    setInfo() {
      this.lengthSeconds = this.Player.lengthSeconds;
    },
    setTime(v) {
      this.$refs.PlayerEl && (this.$refs.PlayerEl.currentTime = v);
    },
    sliderMousedown() {
      this.isSliderHolding = true;
    },
    sliderMouseup() {
      this.isSliderHolding = false;
    },
    settingPlayerEl() {
      this.$refs.PlayerEl.volume = 1;
      this.$refs.PlayerEl.addEventListener('timeupdate', e => {
        !this.isSliderHolding && (this.t = Math.floor(e.target.currentTime));
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.player_sheet {
  position: fixed;
  bottom: 0;
  width: 100%;
}

.progress_bar {
  position: absolute;
  transform: translateY(-50%);
  top: 0;
  width: 100%;
}
</style>
