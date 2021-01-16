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
    <div class="d-flex justify-center align-center">
      <v-btn fab text x-small @click="changeShuffleState">
        <v-icon>{{ shuffleIcon }}</v-icon>
      </v-btn>

      <v-btn fab text small @click="prevSong">
        <v-icon>mdi-skip-previous</v-icon>
      </v-btn>

      <v-btn fab text small @click="playPause">
        <v-icon>mdi-{{ isPause ? 'play' : 'pause' }}</v-icon>
      </v-btn>

      <v-btn fab text small @click="nextSong">
        <v-icon>mdi-skip-next</v-icon>
      </v-btn>

      <v-btn fab text x-small @click="changeRepeatState">
        <v-icon>{{ repeatIcon }}</v-icon>
      </v-btn>
    </div>
    <v-list dense class="py-0">
      <v-list-item class="align-center py-0">
        <v-list-item-avatar></v-list-item-avatar>
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

        <v-card flat width="140" class="d-flex align-center">
          <v-btn icon @click="$emit('show-now-playing')">
            <v-icon>mdi-playlist-play</v-icon>
          </v-btn>
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
import { mapActions, mapGetters } from 'vuex';

export default {
  props: {
    Song: {
      required: true
    }
  },

  data() {
    return {
      length: 0,
      volumeBeforeMute: this.$db.get('volume').value() || 100,
      volume: this.$db.get('volume').value() || 100,
      t: 0,
      isPause: false,
      isSliderHolding: false,
      shuffleStates: ['mdi-shuffle-disabled', 'mdi-shuffle'],
      shuffleState: this.$db.get('shuffle').value() || 0,
      repeatStates: ['mdi-repeat-off', 'mdi-repeat', 'mdi-repeat-once'],
      repeatState: this.$db.get('repeat').value() || 0
    };
  },

  computed: {
    ...mapGetters(['getPlayingListIds', 'getCurrentPlayingIdx', 'getSongById']),
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
      return this.shuffleStates[this.shuffleState % 2];
    },
    repeatIcon() {
      return this.repeatStates[this.repeatState % 3];
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
    this.$refs.PlayerEl.addEventListener('ended', this.nextSong);
  },

  beforeDestroy() {
    this.$refs.PlayerEl.removeEventListener('timeupdate', this.timeupdate);
    this.$refs.PlayerEl.removeEventListener('loadeddata', this.mediaReady);
    this.$refs.PlayerEl.removeEventListener('ended', this.nextSong);
  },

  methods: {
    ...mapActions(['SET_CURRENT_PLAY_SONG']),
    // setting
    mediaReady() {
      this.$refs.PlayerEl.currentTime = this.Song.start;
      this.$refs.PlayerEl.play();
    },
    setInfo() {
      this.length = this.Song.length;
    },
    setTime(v) {
      this.t = v;
      this.$refs.PlayerEl &&
        (this.$refs.PlayerEl.currentTime = v + (this.Song.start || 0));
    },
    timeupdate(e) {
      if (this.t >= this.Song.length) {
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

    // controll
    play() {
      this.$refs.PlayerEl.play();
      this.isPause = false;
    },
    pause() {
      this.$refs.PlayerEl.pause();
      this.isPause = true;
    },
    playPause() {
      if (this.$refs.PlayerEl.paused) {
        this.play();
      } else {
        this.pause();
      }
    },
    prevSong() {
      const playingListIds = this.getPlayingListIds;
      if (!playingListIds.length) {
        this.setTime(0);
        return;
      }
      const length = playingListIds.length;
      const idx = this.getCurrentPlayingIdx;

      this.SET_CURRENT_PLAY_SONG(
        this.getSongById(playingListIds[idx ? idx - 1 : length - 1])
      );
    },
    nextSong() {
      const playingListIds = this.getPlayingListIds;
      const state = this.repeatState % 3;
      if (state === 2) {
        /* repeat one */
        this.setTime(0);
        return;
      }
      if (!playingListIds.length) {
        /* no list */
        this.pause();
        this.setTime(0);
        return;
      }
      const length = playingListIds.length;
      const idx = this.getCurrentPlayingIdx;
      const isLast = idx + 1 === length;

      if (state === 1) {
        /* repeat all */
        this.SET_CURRENT_PLAY_SONG(
          this.getSongById(playingListIds[isLast ? 0 : idx + 1])
        );
        return;
      }

      if (state === 0) {
        /* repeat off && is last song of playlist */
        this.pause();
        this.setTime(0);
        return;
      }
    },
    toggleMute() {
      if (this.volume) {
        this.volumeBeforeMute = this.volume;
        this.volume = 0;
      } else {
        if (!this.volumeBeforeMute) this.volumeBeforeMute = 100;
        this.volume = this.volumeBeforeMute;
      }
      this.setVolumeToDb();
    },
    changeShuffleState() {
      this.shuffleState++;
      this.$db.set('shuffle', this.shuffleState % 2).write();
      // if shuffle reset playing list
    },
    changeRepeatState() {
      this.repeatState++;
      this.$db.set('repeat', this.repeatState % 3).write();
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
