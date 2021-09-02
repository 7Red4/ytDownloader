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
          <span class="white--text">設定</span>
        </v-app-bar>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-textarea
          label="Cookie"
          v-model="cookie"
          auto-grow
          outlined
        ></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('input', false)">取消</v-btn>
        <v-btn color="primary" @click="submit">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const schema = {
  cookie: ''
};

export default {
  data: () => ({
    ...schema
  }),

  watch: {
    '$attrs.value': {
      handler(v) {
        v ? this.init() : this.dismiss();
      }
    }
  },

  methods: {
    init() {
      const cookie = this.$db.get('cookie').value();
      this.cookie = cookie;
    },
    dismiss() {
      Object.keys(schema).forEach((key) => {
        this[key] = schema[key];
      });
    },

    submit() {
      this.$db.set('cookie', this.cookie).write();
    }
  }
};
</script>
