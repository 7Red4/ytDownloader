<template>
  <v-app dark>
    <v-system-bar color="primary darken-1" class="elevation-0" app>
      <template v-if="!isMac">
        <v-icon>mdi-youtube</v-icon>
      </template>

      <v-spacer style="height: 100%; -webkit-app-region: drag"></v-spacer>
      <template v-if="!isMac">
        <v-btn text @click="minimizeWindow">
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <v-btn text @click="toggleWindow">
          <v-icon>
            {{
              isMaximized
                ? 'mdi-checkbox-multiple-blank-outline'
                : 'mdi-checkbox-blank-outline'
            }}
          </v-icon>
        </v-btn>
        <v-btn text @click="closeWindow">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-system-bar>

    <v-app-bar color="primary" class="elevation-0" app clipped-right>
      <v-btn fab small text @click="isSettingDialog = true">
        <v-icon>mdi-cog-outline</v-icon>
      </v-btn>
      <v-btn fab small text @click="isHelpDialog = true">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>

      <v-spacer></v-spacer>
      <v-tabs color="white" centered v-if="false">
        <v-tab to="/">
          <span class="text-h6 white--text">
            <v-icon>mdi-youtube</v-icon>
            下載器
          </span>
        </v-tab>
        <v-tab to="/Player">
          <span class="text-h6 white--text">
            <v-icon>mdi-play-circle-outline</v-icon>
            播放器
          </span>
        </v-tab>
      </v-tabs>

      <v-spacer></v-spacer>
      <v-btn fab small text @click="$vuetify.theme.dark = !$vuetify.theme.dark">
        <v-icon>
          {{
            $vuetify.theme.dark
              ? 'mdi-lightbulb-off-outline'
              : 'mdi-lightbulb-on-outline'
          }}
        </v-icon>
      </v-btn>
      <v-btn fab small text @click="TOGGLE_SHOW_QUE">
        <v-icon>mdi-format-list-checkbox</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="overflow-y-auto">
      <transition name="route-change-transition">
        <keep-alive>
          <router-view :key="$route.fullPath" class="pb-8"></router-view>
        </keep-alive>
      </transition>
    </v-main>

    <v-navigation-drawer
      :value="getShowQue"
      @input="(v) => SET_SHOW_QUE(v)"
      class="que_drawer"
      width="600"
      disable-resize-watcher
      clipped
      right
      app
    >
      <v-card :ripple="false" @click.right="showMenu" class="fill-height">
        <SizeBox
          :height="$vuetify.application.top + $vuetify.application.bar"
          class="d-block d-lg-none"
        />
        <v-card-title>
          下載中的影片
          <v-spacer></v-spacer>
        </v-card-title>
        <div class="pt-4">
          <div v-for="tracker in getQueList" :key="tracker.id">
            <QueTracker :tracker="tracker" />
            <v-divider></v-divider>
          </div>
        </div>
      </v-card>

      <v-menu
        v-model="isMenuShow"
        :position-x="x"
        :position-y="y"
        absolute
        offset-y
      >
        <v-list>
          <v-list-item @click="startAll">全部開始</v-list-item>
          <v-list-item @click="deleteAll">全部刪除</v-list-item>
          <v-list-item @canplay="stopAll">全部停止</v-list-item>
        </v-list>
      </v-menu>
    </v-navigation-drawer>

    <BotSheet :info="getError" />
    <SettingDialog v-model="isSettingDialog" />
    <HelpDialog v-model="isHelpDialog" />

    <v-card
      :color="`grey ${$vuetify.theme.dark ? 'darken' : 'lighten'}-3`"
      flat
      tile
      class="bottom_status_bar px-4"
      height="24"
    >
      <span class="grey--text">v{{ version }}</span>
    </v-card>
  </v-app>
</template>

<script>
import { ipcRenderer, webFrame } from 'electron';

import { mapActions, mapGetters } from 'vuex';

import QueTracker from '@/components/QueTracker';
import BotSheet from '@/components/BotSheet';
import SettingDialog from '@/components/SettingDialog';
import HelpDialog from '@/components/HelpDialog';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  name: 'App',

  components: { QueTracker, BotSheet, SettingDialog, HelpDialog },

  data() {
    return {
      platform: '',
      version: '',
      isMaximized: false,
      isDrawer: false,

      isMenuShow: false,
      isSettingDialog: false,
      isHelpDialog: false,
      x: 0,
      y: 0
    };
  },

  computed: {
    ...mapGetters(['getShowQue', 'getQueList', 'getError']),
    isMac() {
      return this.platform === 'darwin';
    }
  },

  watch: {
    '$vuetify.theme.dark': {
      handler(v) {
        this.handleChangeDark(v);
      }
    },
    '$route.path': {
      handler(v) {
        this.$db.set('last_route', v).write();
        ipcRenderer.send('get-platform');
      }
    }
  },

  created() {
    if (isDevelopment) window.app = this;
    ipcRenderer.send('get-platform');
    ipcRenderer.on('get-platform-reply', (event, platform) => {
      this.platform = platform;
    });
    ipcRenderer.send('get-version');
    ipcRenderer.on('get-version-reply', (event, version) => {
      this.version = version;
    });

    // set tracker event listener
    ipcRenderer.on('download-processing', (event, tracker) => {
      this.SET_QUE(tracker);
    });

    ipcRenderer.on('snapshot-update', (event, tracker) => {
      this.SET_QUE({ ...tracker, timestamp: Date.now() });
    });

    ipcRenderer.on('download-complete', (event, tracker) => {
      this.SET_QUE(tracker);
    });

    ipcRenderer.on('start-fail', (event, error) => {
      this.SET_ERROR(error);
    });

    ipcRenderer.on('download-fail', (event, error) => {
      this.snackMsg = error;
      this.snack = true;
      this.isProcessing = false;
    });

    ipcRenderer.on('delete-que-reply', (event, queId) => {
      this.DELETE_QUE(queId);
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Equal' && e.ctrlKey) {
        webFrame.setZoomFactor(1.0);
      }
    });
  },

  mounted() {
    // console.log(this.$db.getState());
    const isDark = !this.$db.get('light').value();
    this.$vuetify.theme.dark = !!isDark;

    // const last_route = this.$db.get('last_route').value();
    // if (!!last_route && this.$route.path !== last_route) {
    //   this.$router.push(last_route);
    // }

    this.$store.dispatch(
      'SET_SHUFFLE_STATE',
      this.$db.get('shuffle').value() || 0
    );
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_QUE',
      'SET_SHOW_QUE',
      'SET_QUE',
      'DELETE_QUE',
      'SET_ERROR'
    ]),
    handleChangeDark(v) {
      this.$db.set('light', !v).write();
    },
    minimizeWindow() {
      ipcRenderer.send('minimize-window');
    },
    toggleWindow() {
      ipcRenderer.send('toggle-window');
      this.isMaximized = !this.isMaximized;
    },
    closeWindow() {
      ipcRenderer.send('close-window');
    },

    showMenu(e) {
      e.preventDefault();
      this.isMenuShow = false;
      this.x = e.clientX;
      this.y = e.clientY;
      this.$nextTick(() => {
        this.isMenuShow = true;
      });
    },

    startAll() {
      ipcRenderer.send('start-ques');
    },

    deleteAll() {
      ipcRenderer.send('delete-ques');
    },

    stopAll() {
      ipcRenderer.send('stop-ques');
    }
  }
};
</script>

<style lang="scss" scoped>
.que_drawer {
  z-index: 2 !important;
}

.route-change-transition-enter,
.route-change-transition-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.route-change-transition-enter-to,
.route-change-transition-leave {
  opacity: 1;
  transform: translateY(0);
}

.route-change-transition-enter-active,
.route-change-transition-leave-active {
  position: absolute;
  width: 100%;
  transition: 0.17s;
}

.bottom_status_bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  left: 0;
}
</style>
