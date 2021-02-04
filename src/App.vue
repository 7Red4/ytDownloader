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
            mdi-checkbox{{ isMaximized ? '-multiple' : '' }}-blank-outline
          </v-icon>
        </v-btn>
        <v-btn text @click="closeWindow">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-system-bar>

    <v-app-bar color="primary" class="elevation-0" app clipped-right>
      <v-tabs color="white" centered>
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

    <v-navigation-drawer
      :value="getShowQue"
      @input="v => SET_SHOW_QUE(v)"
      class="que_drawer"
      width="400"
      clipped
      right
      app
    >
      <div
        :style="{
          height: `${$vuetify.application.top + $vuetify.application.bar}px`
        }"
      ></div>
      <v-card>
        <v-card-title>
          下載中的影片
        </v-card-title>
      </v-card>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
      <v-divider></v-divider>
      <QueTracker />
    </v-navigation-drawer>

    <v-main>
      <transition name="route-change-transition">
        <keep-alive>
          <router-view :key="$route.fullPath"></router-view>
        </keep-alive>
      </transition>
    </v-main>
  </v-app>
</template>

<script>
import { ipcRenderer } from 'electron';

import { mapActions, mapGetters } from 'vuex';

import QueTracker from '@/components/QueTracker';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  name: 'App',

  components: { QueTracker },

  data() {
    return {
      platform: '',
      isMaximized: false,
      isDrawer: false
    };
  },

  computed: {
    ...mapGetters(['getShowQue', 'getQueList']),
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
  },

  mounted() {
    // console.log(this.$db.getState());
    const isDark = this.$db.get('dark').value();
    this.$vuetify.theme.dark = !!isDark;

    const last_route = this.$db.get('last_route').value();
    if (!!last_route && this.$route.path !== last_route) {
      this.$router.push(last_route);
    }

    this.$store.dispatch(
      'SET_SHUFFLE_STATE',
      this.$db.get('shuffle').value() || 0
    );
  },

  methods: {
    ...mapActions(['TOGGLE_SHOW_QUE', 'SET_SHOW_QUE']),
    handleChangeDark(v) {
      this.$db.set('dark', v).write();
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
</style>
