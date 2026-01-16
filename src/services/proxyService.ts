import proxies from "../config/proxies";

let currentIndex = 0;

export function getRandomProxy(): string {
  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}