<template>
  <v-card>
    <v-card-text class="d-flex">
      <v-row no-gutters>
        <v-col cols="4" class="d-flex align-center">
          <v-img :aspect-ratio="16 / 9" :src="previewImg">
            <template #placeholder>
              <div class="d-flex fill-height align-center">
                <v-progress-circular
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </div>
            </template>
          </v-img>
        </v-col>
        <v-col cols="8">
          <div class="ml-2">
            <v-tooltip v-if="!isTitleEditing" left :disabled="processing">
              <template #activator="{ on }">
                <p
                  v-on="on"
                  @dblclick="!processing && (isTitleEditing = true)"
                  class="primary--text"
                >
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
            <p class="text-caption">{{ startTime }}</p>
            <template v-if="isLive">
              <p>
                <v-icon size="16" color="red">mdi-circle</v-icon>
                直播中
                <span
                  v-if="tracker.isVideoSourceFailed"
                  class="hint_text grey--text"
                >
                  高畫質影像獲取失敗 將獲取 720p 片源
                </span>
              </p>
            </template>
            <template
              v-if="
                !isLive && tracker.dlMethod === 'ytdl' && !tracker.isMerging
              "
            >
              <p class="mb-1">
                <span class="text-no-wrap mr-1">音訊:</span>
                <v-progress-linear
                  color="cyan"
                  height="25"
                  :value="
                    (tracker.audio.downloaded / tracker.audio.total) * 100
                  "
                >
                  <template #default="{ value }">
                    {{ Number.parseFloat(value).toFixed(2) }}%
                  </template>
                </v-progress-linear>
              </p>
              <p class="mb-1">
                <span class="text-no-wrap mr-1">視訊:</span>
                <v-progress-linear
                  color="pink"
                  height="25"
                  :value="
                    (tracker.video.downloaded / tracker.video.total) * 100
                  "
                >
                  <template #default="{ value }">
                    {{ Number.parseFloat(value).toFixed(2) }}%
                  </template>
                </v-progress-linear>
              </p>
            </template>
            <template
              v-if="
                tracker.dlMethod === 'youtube-dl' ||
                tracker.isMerging ||
                downloadComplete
              "
            >
              <p class="mb-1">
                <span class="text-no-wrap mr-1">進度:</span>
                <v-progress-linear
                  color="success"
                  height="25"
                  :value="downloadComplete ? 100 : progressPercent"
                >
                  <template #default="{ value }">
                    <span v-if="value === Infinity">
                      時間長度: {{ tracker.merged.out_time }}
                    </span>
                    <span v-else>
                      {{ Number.parseFloat(value).toFixed(2) }}%
                    </span>
                  </template>
                </v-progress-linear>
              </p>
            </template>
            <p>
              執行狀態:
              {{ processingStatus }}
              <v-progress-circular
                v-if="processing"
                size="12"
                width="3"
                indeterminate
                color="primary"
              ></v-progress-circular>
            </p>
            <p v-if="tracker.isReserve && !processing">
              執行倒數: {{ $s2hms(tracker.waitingTime) }}
            </p>
          </div>
        </v-col>
      </v-row>
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
            :disabled="processing"
            class="mx-2"
          >
            mdi-trash-can
          </v-icon>
        </template>

        <span>從佇列移除</span>
      </v-tooltip>

      <v-tooltip v-if="processing" bottom>
        <template #activator="{ on }">
          <v-icon
            v-on="on"
            color="error"
            @click="stop"
            class="mx-2"
            :disabled="tracker.isMerging"
          >
            mdi-stop
          </v-icon>
        </template>

        <span>終止</span>
      </v-tooltip>

      <v-tooltip v-else bottom>
        <template #activator="{ on }">
          <v-icon
            v-on="on"
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
import { ipcRenderer, nativeImage } from 'electron';
import path from 'path';

export default {
  props: {
    tracker: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      Infinity: Infinity,
      startTime: '',
      isTitleEditing: false,
      snapshot: ''
    };
  },

  computed: {
    processingStatus() {
      if (this.tracker.isReserve) return '等待中';
      return this.processing
        ? this.tracker.isMerging
          ? '合併中'
          : '下載/錄製中'
        : '閒置';
    },
    isLive() {
      return this.tracker.isLive;
    },
    titleEditValue: {
      get() {
        return this.tracker.title;
      },
      set(v) {
        this.editQue({ title: v, path: this.tracker.path });
      }
    },
    titlePathValue: {
      get() {
        return this.tracker.title;
      },
      set(v) {
        this.editQue({ title: this.tracker.title, path: v });
      }
    },
    progressPercent() {
      return (
        (this.tracker.merged.out_time_ms /
          1000 /
          1000 /
          this.tracker.req.duration) *
        100
      );
    },
    downloadComplete() {
      return (
        Math.round(this.progressPercent) === 100 || this.tracker.isComplete
      );
    },
    processing() {
      return (
        this.tracker.isRunning ||
        this.tracker.isRecording ||
        this.tracker.isMerging
      );
    },
    previewImg() {
      return this.snapshot || this.tracker.thumbnail;
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
    },
    'tracker.timestamp': {
      handler() {
        this.snapshotLoading = true;
        const snapshot = path.join(
          this.tracker.path,
          '.ytdlWorkingFiles',
          `snapshot_${this.tracker.id}.jpg`
        );
        const image = nativeImage.createFromPath(snapshot);
        this.snapshot = image.isEmpty() ? null : image.toDataURL();
      }
    }
  },

  mounted() {
    this.startTime = new Date();
  },

  methods: {
    updateTitle(v) {
      this.isTitleEditing = false;
      if (!v.target.value) return;
      this.titleEditValue = v.target.value;
    },
    start() {
      this.startTime = new Date();
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

<style lang="scss" scoped>
.hint_text {
  font-size: 11px;
}
</style>
