<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <div class="w-full my-4"></div>
      <add-ticker @add-ticker="add" :disabled="tooManyTickersAdded" />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <button
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            v-if="page > 1"
            @click="page = page - 1"
          >
            Назад
          </button>
          <button
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            @click="page = page + 1"
            v-if="hasNextPage"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in paginatedTickers"
            :key="t.name"
            @click="select(t)"
            :class="{
              'border-4': selectedTicker === t,
              'bg-red-500': !!t.error,
              'bg-white': !t.error
            }"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ t.price }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="requestDelete(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <icon-delete />
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <graph-ticker
        @reduce-graph-length="reduceGraphLength"
        v-if="selectedTicker"
        :selectedTicker="selectedTicker"
        :graph="graph"
      />
    </div>
    <modal-app
      v-if="ConfirmDelete"
      @close="closeModal"
      @click="handleDelete"
      :ticker="handledTicker"
    >
      <template #ticker>
        {{ handledTicker.name }}
      </template>
      <template #actions="{ confirm }">
        <input
          type="text"
          :placeholder="handledTicker.name"
          v-model="confirmTicker"
        />
        <button
          :class="{ 'opacity-50': isDisabledButton }"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          @click="confirm"
          :disabled="isDisabledButton"
        >
          Удалить
        </button>
      </template>
    </modal-app>
  </div>
</template>

<script>
// [x] 6. Наличие в состоянии ЗАВИСИМЫХ ДАННЫХ | Критичность: 5+
// [x] 4. Запросы напрямую внутри компонента (???) | Критичность: 5
// [x] 2. При удалении остается подписка на загрузку тикера | Критичность: 5
// [ ] 5. Обработка ошибок API | Критичность: 5
// [x] 3. Количество запросов | Критичность: 4
// [x] 8. При удалении тикера не изменяется localStorage | Критичность: 4
// [x] 1. Одинаковый код в watch | Критичность: 3
// [ ] 9. localStorage и анонимные вкладки | Критичность: 3
// [ ] 7. График ужасно выглядит если будет много цен | Критичность: 2
// [ ] 10. Магические строки и числа (URL, 5000 миллисекунд задержки, ключ локал стораджа, количество на странице) |  Критичность: 1

// Параллельно
// [x] График сломан если везде одинаковые значения
// [x] При удалении тикера остается выбор

import { subscribeToTicker, unsubscribeToTicker } from "./api";
import AddTicker from "./components/AddTicker.vue";
import GraphTicker from "./components/GraphTicker.vue";
import IconDelete from "./components/icons/IconDelete.vue";
import ModalApp from "./components/ModalApp.vue";

export default {
  name: "App",
  components: {
    AddTicker,
    GraphTicker,
    IconDelete,
    ModalApp
  },
  data() {
    return {
      bc: null,
      filter: "",

      tickers: [],
      selectedTicker: null,
      handledTicker: null,

      graph: [],

      page: 1,
      ConfirmDelete: false,
      confirmTicker: ""
    };
  },

  created() {
    this.bc = new BroadcastChannel("test_channel");
    this.bc.onmessage = event => {
      const parsedTickers = JSON.parse(event.data);
      this.tickers = parsedTickers;
    };
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    const VALID_KEYS = ["filter", "page"];

    VALID_KEYS.forEach(key => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    // if (windowData.filter) {
    //   this.filter = windowData.filter;
    // }

    // if (windowData.page) {
    //   this.page = windowData.page;
    // }

    const tickersData = localStorage.getItem("cryptonomicon-list");

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach(({ name }) => {
        subscribeToTicker(name, (newPrice, error) => {
          return this.updateTicker(name, newPrice, error);
        });
      });
    }
  },
  computed: {
    isDisabledButton() {
      return !(this.confirmTicker === this.handledTicker.name);
    },
    tooManyTickersAdded() {
      return this.tickers.length > 4;
    },
    startIndex() {
      return (this.page - 1) * 6;
    },
    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      };
    }
  },

  methods: {
    requestDelete(ticker) {
      this.handledTicker = ticker;
    },
    closeModal() {
      this.handledTicker = null;
      this.confirmTicker = "";
    },
    add(currentTicker) {
      this.tickers = [...this.tickers, currentTicker];
      this.filter = "";

      subscribeToTicker(currentTicker.name, (newPrice, error) =>
        this.updateTicker(currentTicker.name, newPrice, error)
      );
    },

    select(ticker) {
      this.selectedTicker = ticker;
      this.graph = [];
    },

    handleDelete(tickerToRemove) {
      try {
        this.tickers = this.tickers.filter(t => t !== tickerToRemove);
        if (this.selectedTicker === tickerToRemove) {
          this.selectedTicker = null;
        }
        unsubscribeToTicker(tickerToRemove.name);
        this.closeModal();
      } catch (error) {
        console.log(error);
      }
    },
    updateTicker(name, price, err) {
      this.tickers
        .filter(t => t.name === name)
        .forEach(t => {
          if (t === this.selectedTicker) {
            this.graph.push(price);
          }
          if (err) {
            t.error = true;
          } else {
            t.price = price;
          }
        });
      this.bc.postMessage(JSON.stringify(this.tickers));
    },
    reduceGraphLength(maxLength) {
      if (maxLength) {
        this.graph.length = maxLength;
        return;
      }
      this.graph.shift();
    }
  },

  watch: {
    handledTicker() {
      if (this.handledTicker) {
        this.ConfirmDelete = true;
        return;
      }
      this.ConfirmDelete = false;
    },
    tickers() {
      // Почему не сработал watch при добавлении?
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter() {
      this.page = 1;
    },

    pageStateOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    },
    watch: {
      selectedTicker() {
        this.$nextTick(() => {
          this.countGraphValues();
        });
      }
    }
  }
};
</script>
<style></style>
