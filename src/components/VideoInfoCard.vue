<template>
  <v-card class="video_info_card mb-10">
    <v-row align="center" class="px-3">
      <v-col cols="4">
        <v-img
          :src="
            videoDetails.thumbnails.length
              ? videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url
              : ''
          "
        ></v-img>
      </v-col>

      <v-col cols="8">
        <v-card-title>
          {{ videoDetails.title.slice(0, 40) }}
          {{ videoDetails.title.length > 40 ? '...' : '' }}
        </v-card-title>
        <v-card-text>
          {{ videoDetails.description.slice(0, 120) }}
          {{ videoDetails.description.length > 120 ? '...' : '' }}
        </v-card-text>
        <v-card-text class="d-flex">
          時間長度 : {{ length }}
          <v-spacer></v-spacer>
          <v-btn text small @click="openLink" color="primary">連結</v-btn>
        </v-card-text>
      </v-col>
    </v-row>

    <v-menu v-if="thumbnail" min-width="200" :nudge-top="16" offset-y left>
      <template #activator="{ on }">
        <v-btn v-on="on" class="video_info_card-more" icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item @click="isThumbnailDownloadDialogOpen = true">
          下載首圖
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog
      v-model="isThumbnailDownloadDialogOpen"
      max-width="500px"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title>
          選擇解析度 (寬 x 高)
        </v-card-title>
        <v-list v-if="videoDetails && videoDetails.thumbnails.length">
          <v-list-item
            v-for="resolution in videoDetails.thumbnails"
            :key="resolution.url"
            @click="pickThumbnailPath(resolution.url)"
          >
            {{ resolution.width }} x {{ resolution.height }}
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" dark @input="v => !v && (snackMsg = '')">
      <div class="d-flex align-center">
        {{ snackMsg }}
        <v-spacer></v-spacer>
        <v-btn text icon color="error" @click.native="snack = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-snackbar>
  </v-card>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  props: {
    videoDetails: {
      required: true
    },
    thumbnail: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      snackMsg: '',
      snack: false,
      tumbnailPath: '',
      isThumbnailDownloadDialogOpen: false
    };
  },

  computed: {
    length() {
      if (!this.videoDetails) return '00:00:00';
      if (this.videoDetails.isLive) return '直播中';
      return new Date(this.videoDetails.lengthSeconds * 1000)
        .toISOString()
        .substr(11, 8);
    }
  },
  mounted() {
    if (this.thumbnail) this.registerThumbnailDownload();
  },

  methods: {
    registerThumbnailDownload() {
      ipcRenderer.on('pick-thumbnail-path-reply', (event, path) => {
        this.tumbnailPath = path || '';
        this.downloadTumbnail();
      });

      ipcRenderer.on('download-thumbnail-complete', (event, res) => {
        this.isThumbnailDownloadDialogOpen = false;
        this.snackMsg = '下載完成';
        this.snack = true;
      });

      ipcRenderer.on('download-thumbnail-fail', (event, res) => {
        this.snackMsg = '下載失敗';
        this.snack = true;
      });
    },
    pickThumbnailPath(url) {
      this.thumbnailURL = url;
      ipcRenderer.send('pick-thumbnail-path', this.title);
    },
    downloadTumbnail() {
      if (!this.tumbnailPath) {
        this.snackMsg = '請選擇路徑';
        this.snack = true;
        return;
      }
      ipcRenderer.send('download-thumbnail', {
        url: this.thumbnailURL,
        path: this.tumbnailPath
      });
    },
    openLink() {
      require('electron').shell.openExternal(this.videoDetails.video_url);
    }
  }
};
</script>

<style lang="scss" scoped>
.video_info_card {
  position: relative;
  .video_info_card-more {
    position: absolute;
    top: 4px;
    right: 6px;
  }
}
</style>
