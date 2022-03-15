<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="add"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="DOGE"
          />
        </div>
      </div>
    </div>
    <add-button @click="add" :disabled="disabledButton" />
  </section>
</template>

<script>
import addButton from "./addButton.vue";

export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  components: {
    addButton
  },
  data() {
    return {
      ticker: ""
    };
  },
  methods: {
    add() {
      const currentTicker = {
        name: this.ticker.toUpperCase(),
        price: "-",
        error: false,
        priceToBTC: 1
      };

      this.$emit("add-ticker", currentTicker);

      this.ticker = "";
    }
  },
  computed: {
    disabledButton() {
      if (this.disabled) return true;
      return !this.ticker;
    }
  }
};
</script>

<style></style>
