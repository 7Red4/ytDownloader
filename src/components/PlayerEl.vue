<template>
  <v-card tile class="player_sheet">
    <audio ref="PlayerEl" hidden :src="Song.src" @load="mediaReady"></audio>
    <v-slider
      v-model="t"
      class="progress_bar"
      :max="length"
      @change="setTime"
      @mousedown="sliderMousedown"
      @mouseup="sliderMouseup"
      hide-details
    ></v-slider>
    <div class="d-flex justify-center grey--text mt-3">
      {{ `${t2time} / ${length2time}` }}
    </div>
    <v-list three-line>
      <v-list-item class="align-center">
        <v-list-item-content>
          <v-list-item-title class="text-truncate">
            {{ currentPlaying.tag }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-truncate">
            {{ currentPlaying.title }}
          </v-list-item-subtitle>
          <v-list-item-subtitle class="text-truncate">
            {{ currentPlaying.author }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-spacer></v-spacer>

        <v-btn fab text x-small>
          <v-icon>{{ shuffleIcon }}</v-icon>
        </v-btn>

        <v-btn fab text small>
          <v-icon>mdi-skip-previous</v-icon>
        </v-btn>

        <v-btn fab text small @click="playPause">
          <v-icon>mdi-{{ isPause ? 'play' : 'pause' }}</v-icon>
        </v-btn>

        <v-btn fab text small>
          <v-icon>mdi-skip-next</v-icon>
        </v-btn>

        <v-btn fab text x-small>
          <v-icon>{{ repeatIcon }}</v-icon>
        </v-btn>

        <v-spacer></v-spacer>

        <v-card flat width="140" class="d-flex align-center">
          <v-btn icon @click="toggleMute">
            <v-icon>{{ volumeIcon }}</v-icon>
          </v-btn>

          <v-slider
            v-model="volume"
            :max="100"
            @change="setVolumeToDb"
            hide-details
          ></v-slider>
        </v-card>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    Song: {
      required: true
    }
  },

  data() {
    return {
      length: 0,
      volumeBeforeMute: this.$db.get('volume').value(),
      volume: this.$db.get('volume').value(),
      t: 0,
      isPause: false,
      isSliderHolding: false
    };
  },

  computed: {
    ...mapGetters(['getPlayingList']),
    length2time() {
      return new Date((this.Song ? this.Song.length : 0) * 1000)
        .toISOString()
        .substr(11, 8);
    },
    t2time() {
      return new Date(this.t * 1000).toISOString().substr(11, 8);
    },
    currentPlaying() {
      return {
        tag: this.Song.tag,
        title: this.Song.title,
        author: this.Song.author
      };
    },
    isMute() {
      return this.volume === 0;
    },

    volumeIcon() {
      if (this.volume > 75) {
        return 'mdi-volume-high';
      } else if (this.volume > 25) {
        return 'mdi-volume-medium';
      } else if (this.volume > 0) {
        return 'mdi-volume-low';
      } else {
        return 'mdi-volume-off';
      }
    },

    shuffleIcon() {
      return 'mdi-shuffle-disabled';
    },
    repeatIcon() {
      return 'mdi-repeat-off';
    }
  },

  watch: {
    'Song.id': {
      handler() {
        this.setTime(0);
        this.setInfo();
        this.$nextTick(() => {
          this.$refs.PlayerEl.play();
          this.isPause = false;
        });
      }
    },
    volume(v) {
      this.$refs.PlayerEl.volume = v / 100;
    }
  },

  created() {
    this.setInfo();
  },

  mounted() {
    this.$refs.PlayerEl.addEventListener('timeupdate', this.timeupdate);
    this.$refs.PlayerEl.addEventListener('loadeddata', this.mediaReady);
  },

  beforeDestroy() {
    this.$refs.PlayerEl.removeEventListener('timeupdate', this.timeupdate);
    this.$refs.PlayerEl.removeEventListener('loadeddata', this.mediaReady);
  },

  methods: {
    mediaReady() {
      this.$refs.PlayerEl.currentTime = this.Song.start;
      this.$refs.PlayerEl.play();
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
      this.length = this.Song.length;
    },
    setTime(v) {
      this.$refs.PlayerEl &&
        (this.$refs.PlayerEl.currentTime = v + (this.Song.start || 0));
    },
    timeupdate(e) {
      if (this.t > this.Song.length) {
        this.nextSong();
        return;
      }
      !this.isSliderHolding &&
        (this.t = Math.floor(e.target.currentTime) - this.Song.start);
    },
    sliderMousedown() {
      this.isSliderHolding = true;
    },
    sliderMouseup() {
      this.isSliderHolding = false;
    },
    prevSong() {
      //
    },
    nextSong() {
      //
    },

    toggleMute() {
      if (this.volume) {
        this.volumeBeforeMute = this.volume;
        this.volume = 0;
      } else {
        this.volume = this.volumeBeforeMute;
      }
      this.setVolumeToDb();
    },
    setVolumeToDb() {
      this.$db.set('volume', this.volume).write();
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

.volume_wrapper {
  position: relative;
  .volume_bar {
    position: absolute;
    bottom: 90%;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
