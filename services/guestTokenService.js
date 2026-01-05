const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { getRandomProxy } = require("../services/proxyService");

let cachedToken = null;
let tokenExpiry = 0;

async function getGuestToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const proxy = getRandomProxy();
  const agent = new HttpsProxyAgent(proxy);

  const config = {
    headers: {
      Authorization:
        "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    },
    httpsAgent: agent,
    proxy: false
  };

  try {
    const response = await axios.post(
      "https://api.twitter.com/1.1/guest/activate.json",
      null,
      config
    );
    
    cachedToken = response.data.guest_token;
    tokenExpiry = now + (10 * 60 * 1000); 
    
    return cachedToken;
  } catch (error) {
    console.error(error);
    cachedToken = null;
  }
}

module.exports = { getGuestToken };