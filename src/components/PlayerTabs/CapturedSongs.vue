<template>
  <v-card>
    <v-card-title v-if="!hasSources">
      目前沒有已獲取的的歌曲
    </v-card-title>
    <v-card-text>
      <v-card
        v-for="(playSource, id) of getPlaySources"
        :key="id"
        @click="$emit('edit-source', id)"
        :disabled="!playSource.src"
      >
        <v-card-title>
          此來源已新增
          {{ getSongsBySourceId(id) ? getSongsBySourceId(id).length : 0 }} 首歌
        </v-card-title>
        <VideoInfoCard
          :videoDetails="playSource.videoDetails"
          :loading="!playSource.src"
        />
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';

import VideoInfoCard from '@/components/VideoInfoCard';

export default {
  components: { VideoInfoCard },
  computed: {
    ...mapGetters(['getPlaySources', 'getSongsBySourceId']),
    hasSources() {
      return this.getPlaySources;
    }
  }
};
</script>
