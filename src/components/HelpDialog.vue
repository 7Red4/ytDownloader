<template>
  <v-dialog
    :value="$attrs.value"
    @input="(v) => $emit('input', v)"
    scrollable
    width="80vw"
    max-width="800"
    transition="dialog-transition"
  >
    <v-card class="pb-4">
      <v-card-title class="mx-0 px-0 pt-0">
        <v-app-bar color="primary">
          <span class="white--text">尋求幫助</span>
        </v-app-bar>
      </v-card-title>

      <v-card-text class="pt-4">
        <p>歡迎加入 discord 群組尋求協助 或 給予建議</p>

        <span @click="openLink" class="cursor-pointer primary--text">
          https://discord.gg/f74QNaTBbW
        </span>

        <v-btn color="primary" x-small @click="copyLink" class="mx-4">
          複製連結
        </v-btn>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack">已複製連結</v-snackbar>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      snack: false
    };
  },
  methods: {
    openLink() {
      require('electron').shell.openExternal('https://discord.gg/f74QNaTBbW');
    },
    copyLink() {
      window.navigator.clipboard.writeText('https://discord.gg/f74QNaTBbW');
      this.snack = true;
    }
  }
};
</script>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
