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
        <v-card-text>時間長度 : {{ length }}</v-card-text>
      </v-col>
    </v-row>

    <v-menu min-width="200" :nudge-top="16" offset-y left>
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
  </v-card>
</template>

<script>
export default {
  props: {
    videoDetails: {
      required: true
    }
  },

  data() {
    return {
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
