<template>
  <span v-if="inline">
    <v-progress-circular
      v-if="isLoading"
      v-bind="$attrs"
      indeterminate
    ></v-progress-circular>
    <slot v-if="shoudShowContent" :res="res"></slot>
  </span>

  <div v-else>
    <v-progress-circular
      v-if="isLoading"
      v-bind="$attrs"
      indeterminate
    ></v-progress-circular>
    <slot v-if="shoudShowContent" :res="res"></slot>
  </div>
</template>

<script>
export default {
  props: {
    fn: {
      type: Function,
      default: null
    },

    loading: {
      type: Boolean,
      default: false
    },

    inline: {
      type: Boolean,
      default: false
    },

    remainContent: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loadComplete: false,
      res: null
    };
  },

  computed: {
    isLoading() {
      return this.loading || !this.loadComplete;
    },
    shoudShowContent() {
      return !this.isLoading || this.remainContent;
    }
  },

  async mounted() {
    if (this.fn) {
      this.res = await this.fn();
    }

    this.loadComplete = true;
    this.$nextTick(() => {
      this.$emit('load');
    });
  }
};
</script>
