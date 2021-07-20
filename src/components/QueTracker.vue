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
        @focus="(e) => e.target.select()"
      ></v-text-field>
      <p class="text-caption">{{ Date(tracker.start) }}</p>
      <template v-if="isLive">
        <p>
          <v-icon size="16" color="red">mdi-circle</v-icon>
          直播中
        </p>
      </template>
      <template v-else>
        <p class="d-flex" v-if="!tracker.noAudio">
          <span class="text-no-wrap mr-1">音訊:</span>
          <v-progress-linear
            color="cyan"
            height="25"
            :value="(tracker.audio.downloaded / tracker.audio.total) * 100"
          ></v-progress-linear>
        </p>
        <p class="d-flex" v-if="!tracker.noVideo">
          <span class="text-no-wrap mr-1">視訊:</span>
          <v-progress-linear
            color="success"
            height="25"
            :value="(tracker.video.downloaded / tracker.video.total) * 100"
          ></v-progress-linear>
        </p>
      </template>
      <p v-if="!tracker.noVideo && !tracker.noAudio">
        已合併: 影格 {{ tracker.merged.frame }}, 速度
        {{ tracker.merged.speed }}, fps {{ tracker.merged.fps }}
      </p>
      <p>
        執行狀態:
        {{ tracker.isRunning || tracker.isRecording ? '執行中' : '閒置' }}
        <v-progress-circular
          v-if="tracker.isRunning || tracker.isRecording"
          size="12"
          width="3"
          indeterminate
          color="primary"
        ></v-progress-circular>
      </p>
    </v-card-text>
    <v-card-actions class="d-flex justify-end">
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-icon
            v-on="on"
            color="success"
            @click="showItemInFolder"
            class="mx-2"
          >
            mdi-folder-open-outline
          </v-icon>
        </template>

        <span>打開檔案位置</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-icon
            v-on="on"
            color="error"
            @click="deleteQue"
            :disabled="tracker.isRunning || tracker.isRecording"
            class="mx-2"
          >
            mdi-trash-can
          </v-icon>
        </template>

        <span>從佇列移除</span>
      </v-tooltip>

      <v-tooltip v-if="isLive && tracker.isRecording" bottom>
        <template #activator="{ on }">
          <v-icon v-on="on" color="error" @click="stop" class="mx-2">
            mdi-stop
          </v-icon>
        </template>

        <span>終止</span>
      </v-tooltip>

      <v-tooltip v-if="!tracker.isRecording" bottom>
        <template #activator="{ on }">
          <v-icon
            v-on="on"
            :disabled="!isLive && tracker.isRunning"
            :color="isLive ? 'red' : 'primary'"
            @click="start"
            class="mx-2"
          >
            {{
              isLive
                ? 'mdi-record'
                : downloadComplete
                ? 'mdi-play-speed'
                : 'mdi-play'
            }}
          </v-icon>
        </template>

        <span>
          {{ isLive ? '錄製' : downloadComplete ? '重新下載' : '下載' }}
        </span>
      </v-tooltip>
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
    isLive() {
      return this.tracker.info.videoDetails.isLive;
    },
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
    },
    downloadComplete() {
      return (
        this.tracker.audio.downloaded / this.tracker.audio.total === 1 ||
        this.tracker.video.downloaded / this.tracker.video.total === 1
      );
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
    },
    showItemInFolder() {
      ipcRenderer.send('show-item-in-folder', this.tracker.path);
    }
  }
};
</script>

<style lang="scss" scoped></style>
