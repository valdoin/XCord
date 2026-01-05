const proxies = require("../config/proxies");

let currentIndex = 0;

function getRandomProxy() {
  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}

module.exports = { getRandomProxy };