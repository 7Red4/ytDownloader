<template>
  <v-card>
    <v-card-text>
      <v-tooltip v-if="!isTitleEditing" left>
        <template #activator="{ on }">
          <p v-on="on" @dblclick="isTitleEditing = true" class="primary--text">
            {{ titleEditValue }}
          </p>
        </template>
        <span>連點標題可編輯</span>
      </v-tooltip>
      <v-text-field
        v-else
        solo
        dense
        fill
        ref="TitleEdit"
        :value="titleEditValue"
        @blur="updateTitle"
        @keyup.enter="updateTitle"
        @focus="e => e.target.select()"
      ></v-text-field>
      <p class="text-caption">{{ Date(tracker.start) }}</p>
      <p class="d-flex" v-if="!tracker.noAudio">
        <span class="text-no-wrap mr-1">
          音訊:
        </span>
        <v-progress-linear
          color="cyan"
          height="25"
          :value="(tracker.audio.downloaded / tracker.audio.total) * 100"
        ></v-progress-linear>
      </p>
      <p class="d-flex" v-if="!tracker.noVideo">
        <span class="text-no-wrap mr-1">
          視訊:
        </span>
        <v-progress-linear
          color="success"
          height="25"
          :value="(tracker.video.downloaded / tracker.video.total) * 100"
        ></v-progress-linear>
      </p>
      <p v-if="!tracker.noVideo && !tracker.noAudio">
        已合併: 影格 {{ tracker.merged.frame }}, 速度
        {{ tracker.merged.speed }}, fps {{ tracker.merged.fps }}
      </p>
      <p>
        執行狀態: {{ tracker.isRunning ? '執行中' : '閒置' }}
        <v-progress-circular
          v-if="tracker.isRunning"
          size="12"
          width="3"
          indeterminate
          color="primary"
        ></v-progress-circular>
      </p>
    </v-card-text>
    <v-card-actions class="d-flex justify-end">
      <v-btn
        color="error"
        text
        @click="deleteQue"
        :disabled="tracker.isRunning"
      >
        從佇列移除
      </v-btn>
      <!-- <v-btn v-if="tracker.isRunning" color="error" small @click="stop">
        終止
      </v-btn> -->
      <v-btn :disabled="tracker.isRunning" color="primary" small @click="start">
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
      Date: Date,
      isTitleEditing: false
    };
  },

  computed: {
    titleEditValue: {
      get() {
        return this.tracker.title;
      },
      set(v) {
        this.editQue({ title: v });
      }
    },
    titlePathValue: {
      get() {
        return this.tracker.title;
      },
      set(v) {
        this.editQue({ path: v });
      }
    }
  },

  watch: {
    isTitleEditing(v) {
      if (v) {
        this.$nextTick(() => {
          const target = this.$refs.TitleEdit;
          target.focus();
        });
      }
    }
  },

  methods: {
    updateTitle(v) {
      this.isTitleEditing = false;
      if (!v.target.value) return;
      this.titleEditValue = v.target.value;
    },
    start() {
      ipcRenderer.send('start-que-by-id', this.tracker.id);
    },
    stop() {
      ipcRenderer.send('stop-que', this.tracker.id);
    },
    deleteQue() {
      ipcRenderer.send('delete-que', this.tracker.id);
    },
    editQue({ title, path } = {}) {
      ipcRenderer.send('edit-que', { id: this.tracker.id, title, path });
    }
  }
};
</script>

<style lang="scss" scoped></style>
