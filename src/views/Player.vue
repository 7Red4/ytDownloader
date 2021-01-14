<template>
  <v-card class="py-4 fill-height">
    <v-container>
      <v-tabs v-model="currentTab" centered>
        <v-tab>曲源獲取與歌單製作</v-tab>
        <v-tab>已獲取曲源</v-tab>
        <v-tab>我的歌單</v-tab>
        <v-tab>正在播放清單</v-tab>
      </v-tabs>

      <v-window v-model="currentTab" class="pt-4">
        <v-window-item :value="0">
          <CaptureSongsAndCreateList :editing-source-id="editingSourceId" />
        </v-window-item>
        <v-window-item :value="1">
          <CapturedSongs @edit-source="editSource" />
        </v-window-item>
        <v-window-item :value="2">
          <PlayList />
        </v-window-item>
        <v-window-item :value="3">
          <PlayingList />
        </v-window-item>
      </v-window>
    </v-container>

    <template v-if="getCurrentPlaying">
      <v-slide-y-reverse-transition>
        <PlayerEl :Song="getCurrentPlaying" />
      </v-slide-y-reverse-transition>
    </template>

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
import { mapActions, mapGetters } from 'vuex';

// tab views
import CapturedSongs from '@/components/PlayerTabs/CapturedSongs';
import CaptureSongsAndCreateList from '@/components/PlayerTabs/CaptureSongsAndCreateList';
import PlayList from '@/components/PlayerTabs/PlayList';
import PlayingList from '@/components/PlayerTabs/PlayingList';

// player element
import PlayerEl from '@/components/PlayerEl';

export default {
  components: {
    CapturedSongs,
    CaptureSongsAndCreateList,
    PlayList,
    PlayingList,

    PlayerEl
  },
  data() {
    return {
      editingSourceId: '',

      currentTab: 0,
      snack: false,
      snackMsg: ''
    };
  },

  computed: {
    ...mapGetters(['getCurrentPlaying'])
  },

  watch: {
    currentTab(v) {
      if (v !== 0) {
        this.editingSourceId = '';
      }
    }
  },

  methods: {
    editSource(id) {
      this.editingSourceId = id;
      this.currentTab = 0;
    }
  }
};
</script>
