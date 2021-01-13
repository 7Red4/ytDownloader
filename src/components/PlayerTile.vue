<template>
  <v-card tile class="player_sheet">
    <audio ref="PlayerEl" hidden :src="src"></audio>
    <v-slider
      v-model="t"
      class="progress_bar"
      :max="lengthSeconds"
      @change="setTime"
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

        <v-list-item-icon :class="{ 'mx-5': $vuetify.breakpoint.mdAndUp }">
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
  </v-card>
</template>

<script>
export default {
  props: {
    Player: {
      required: true
    },
    src: {
      required: true
    }
  },

  data() {
    return {
      lengthSeconds: 0,
      t: 0,
      isPause: true,
      isSliderHolding: false
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
      return {
        title: this.Player.title,
        author: this.Player.author
      };
    }
  },

  created() {
    this.setInfo();
  },

  mounted() {
    this.$refs.PlayerEl.addEventListener('timeupdate', this.timeupdate);
  },

  beforeDestroy() {
    this.$refs.PlayerEl.removeEventListener('timeupdate', this.timeupdate);
  },

  methods: {
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
    timeupdate(e) {
      !this.isSliderHolding && (this.t = Math.floor(e.target.currentTime));
    },
    sliderMousedown() {
      this.isSliderHolding = true;
    },
    sliderMouseup() {
      this.isSliderHolding = false;
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
