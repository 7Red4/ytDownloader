<template>
  <v-bottom-sheet
    persistent
    :value="info !== null"
    @input="(v) => !v && SET_ERROR(null)"
    scrollable
  >
    <v-card :height="sheetHeight" :class="{ 'no-select': isGrabing }">
      <v-card-title class="elevation-3">
        <span class="text-title">CONSOLE</span>
        <div @mousedown="mousedown" class="grab_area fill-height"></div>
        <v-icon @click="resetSheet">mdi-close</v-icon>
      </v-card-title>

      <v-card-text class="error--text overflow-auto">
        <br />
        <p class="text-h6">
          {{ info }}
        </p>
        <p v-for="(v, k, i) of parsedError" :key="`error:${i}`">
          <strong class="text-h6">
            {{ k }}
          </strong>
          <span class="text-h6 mx-1">:</span>
          <br />
          <span style="white-space: pre-wrap">
            {{ v.toString() }}
          </span>
        </p>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  props: {
    info: {
      type: [Object, Error],
      default: null
    }
  },

  data() {
    return {
      isGrabing: false,
      startY: 0,
      originHeight: 0,
      sheetHeight: 400
    };
  },

  computed: {
    parsedError() {
      if (!this.info) return {};
      const obj = {};
      Object.getOwnPropertyNames(this.info).forEach((k) => {
        obj[k] = this.info[k];
      });

      return obj;
    }
  },

  mounted() {
    window.addEventListener('mousemove', this.mousemove);
    window.addEventListener('mouseup', this.mouseup);
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.mousemove);
    window.removeEventListener('mouseup', this.mouseup);
  },

  methods: {
    ...mapActions(['SET_ERROR']),
    mousedown(e) {
      this.isGrabing = true;
      this.startY = e.screenY;
      this.originHeight = this.sheetHeight;
    },
    mousemove(e) {
      if (this.isGrabing) {
        this.sheetHeight = this.originHeight + (this.startY - e.screenY);
      }
    },
    mouseup(e) {
      this.isGrabing = false;
    },
    resetSheet() {
      this.SET_ERROR(null);
      this.sheetHeight = 400;
    }
  }
};
</script>

<style lang="scss" scoped>
.grab_area {
  cursor: ns-resize;
  flex: 1;
}

.no-select {
  * {
    user-select: none !important;
  }
}
</style>
