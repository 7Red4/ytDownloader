<script>
const sizeUnitsRe =
  /[^d]m|[^d]ex[^d]|[^d]%|[^d]px|[^d]cm|[^d]mm|[^d]in|[^d]pt|[^d]pc|[^d]ch|[^d]rem|[^d]vh|[^d]vw|[^d]vmin|[^d]vmax/;
const validator = (v) => {
  return sizeUnitsRe.test(v) || !Number.isNaN(v);
};

export default {
  name: 'SizeBox',
  props: {
    width: {
      type: [String, Number],
      default: 0,
      validate(v) {
        return validator(v);
      }
    },
    height: {
      type: [String, Number],
      default: 0,
      validate(v) {
        return validator(v);
      }
    },
    minWidth: {
      type: [String, Number],
      default: 0,
      validate(v) {
        return validator(v);
      }
    },
    minHeight: {
      type: [String, Number],
      default: 0,
      validate(v) {
        return validator(v);
      }
    },
    inline: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    computedStyle() {
      return {
        width: Number.isNaN(this.width)
          ? this.width
          : this.width
          ? `${this.width}px`
          : null,
        height: Number.isNaN(this.height)
          ? this.height
          : this.height
          ? `${this.height}px`
          : null,
        minWidth: Number.isNaN(this.minWidth)
          ? this.minWidth
          : this.minWidth
          ? `${this.minWidth}px`
          : null,
        minHeight: Number.isNaN(this.minHeight)
          ? this.minHeight
          : this.minHeight
          ? `${this.minHeight}px`
          : null,
        display: this.inline ? 'inline-block' : 'block'
      };
    }
  },

  render(h) {
    return h('div', { style: this.computedStyle });
  }
};
</script>
