<template>
  <v-card>
    <v-card-title v-if="!hasSources">
      目前沒有已獲取的的歌曲
    </v-card-title>

    <v-card
      v-for="(playSource, id) of getPlaySources"
      :key="id"
      @click="$emit('edit-source', id)"
    >
      <VideoInfoCard :videoDetails="playSource.videoDetails" />
    </v-card>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';

import VideoInfoCard from '@/components/VideoInfoCard';

export default {
  components: { VideoInfoCard },
  computed: {
    ...mapGetters(['getPlaySources']),
    hasSources() {
      return Object.values(this.getPlaySources).length;
    }
  }
};
</script>
