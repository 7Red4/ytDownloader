<template>
  <v-app dark>
    <v-app-bar color="primary" app class="mt-4">
      <v-tabs color="white">
        <v-tab to="/">
          <span class="title white--text">
            <v-icon>mdi-youtube</v-icon>
            下載器
          </span>
        </v-tab>
        <v-tab to="/Player">
          <span class="title white--text">
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
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
import { Color, RGBA } from 'custom-electron-titlebar';

export default {
  name: 'App',

  watch: {
    '$vuetify.theme.dark': {
      handler(v) {
        this.handleChangeDark(v);
      }
    }
  },

  created() {
    this.$titlebar.updateTitle('YT 下載器');
  },

  mounted() {
    console.log(this.$db.getState());
    const isDark = this.$db.get('dark').value();
    this.$vuetify.theme.dark = !!isDark;
  },

  methods: {
    handleChangeDark(v) {
      this.$db.set('dark', v).write();
      const primary = this.$vuetify.theme.themes[v ? 'dark' : 'light'].primary;
      this.$titlebar.updateBackground(Color.fromHex(primary));
    }
  }
};
</script>
