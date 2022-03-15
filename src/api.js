const API_KEY =
  "f86de1a3e5269a0de9729e57d289e8af7c1335c83c97f1174b752d40f0ea9316";
const tickersHandlers = new Map();
const AGGREGATE_INDEX = "5";

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.addEventListener("message", e => {
  let {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE,
    MESSAGE: message,
    PARAMETER: param
  } = JSON.parse(e.data);

  if (message === "INVALID_SUB") {
    const [, , ticker] = param.split("~");
    // subscribeToTickerOnWs(ticker, "BTC");
    currency = ticker;
  } else if (type !== AGGREGATE_INDEX || !PRICE) return;
  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach(fn => fn(PRICE, message));
});

function sendTowebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }
  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function unsubscribeToTickerOnWs(fromSymbol, toSymbol = "USD") {
  sendTowebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${fromSymbol}~${toSymbol}`]
  });
}

function subscribeToTickerOnWs(ticker, toSymbol = "USD") {
  sendTowebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${toSymbol}`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeToTicker = ticker => {
  tickersHandlers.delete(ticker);
  unsubscribeToTickerOnWs(ticker);
};
window.tickersHandlers = tickersHandlers;
