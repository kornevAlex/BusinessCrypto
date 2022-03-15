<template>
  <section v-if="selectedTicker" class="relative">
    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
      {{ selectedTicker.name }} - USD
    </h3>
    <div
      class="flex items-end border-gray-600 border-b border-l h-64"
      ref="graph"
    >
      <div
        v-for="(bar, idx) in normalizedGraph"
        :key="idx"
        :style="{ height: `${bar}%`, width: `${pointWidth}px` }"
        class="bg-purple-800 border w-10"
        ref="pointInGraph"
      ></div>
    </div>
    <button
      @click="selectedTicker"
      type="button"
      class="absolute top-0 right-0"
    >
      <icon-delete />
    </button>
  </section>
</template>

<script>
import IconDelete from "./icons/IconDelete.vue";
export default {
  components: { IconDelete },
  mounted() {
    this.countGraphValues();
    window.addEventListener("resize", this.countGraphValues);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.countGraphValues);
  },
  data() {
    return {
      pointWidth: 38,
      maxGraphElements: 1
    };
  },
  props: {
    selectedTicker: {
      type: Object
    },
    graph: {
      type: Object
    }
  },
  methods: {
    countGraphValues() {
      if (!this.$refs.graph) return;

      this.maxGraphElements = Math.round(
        this.$refs.graph?.clientWidth / this.pointWidth
      );

      if (this.graph.length > this.maxGraphElements) {
        this.$emit("reduce-graph-length", this.maxGraphElements);
      }
    }
  },
  computed: {
    normalizedGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);

      if (maxValue === minValue) {
        return this.graph.map(() => 50);
      }

      return this.graph.map(
        price => 5 + ((price - minValue) * 95) / (maxValue - minValue)
      );
    }
  },
  watch: {
    graph: {
      deep: true,
      handler() {
        console.log(this.graph.length > this.maxGraphElements);
        if (this.graph.length > this.maxGraphElements) {
          this.$emit("reduce-graph-length");
        }
      }
    }
  }
};
</script>

<style></style>
