<template>
  <v-card>
    <v-card-text>
      <p class="">{{ tracker.title }}</p>
      <p class="">{{ Date(tracker.start) }}</p>
      <p class="d-flex">
        <span class="text-no-wrap mr-1">
          音訊:
        </span>
        <v-progress-linear
          color="cyan"
          height="25"
          :value="(tracker.audio.downloaded / tracker.audio.total) * 100"
        ></v-progress-linear>
      </p>
      <p class="d-flex">
        <span class="text-no-wrap mr-1">
          視訊:
        </span>
        <v-progress-linear
          color="success"
          height="25"
          :value="(tracker.video.downloaded / tracker.video.total) * 100"
        ></v-progress-linear>
      </p>
      <p class="">
        已合併: 影格 {{ tracker.merged.frame }}, 速度
        {{ tracker.merged.speed }}, fps {{ tracker.merged.fps }}
      </p>
      <p>執行狀態: {{ tracker.isRunning ? '執行中' : '閒置' }}</p>
    </v-card-text>
    <v-card-actions class="d-flex justify-end">
      <v-btn color="error" text @click="deleteQue">
        從佇列移除
      </v-btn>
      <v-btn v-if="tracker.isRunning" color="error" small @click="stop">
        終止
      </v-btn>
      <v-btn v-if="!tracker.isRunning" color="primary" small @click="start">
        下載
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  props: {
    tracker: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      Date: Date
    };
  },

  methods: {
    start() {
      ipcRenderer.send('start-que-by-id', this.tracker.id);
    },
    stop() {
      ipcRenderer.send('stop-que', this.tracker.id);
    },
    deleteQue() {
      ipcRenderer.send('delete-que', this.tracker.id);
    }
  }
};
</script>

<style lang="scss" scoped></style>
