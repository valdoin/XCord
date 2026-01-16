import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getRandomProxy } from "./proxyService";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getGuestToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const proxy = getRandomProxy();
  const agent = new HttpsProxyAgent(proxy);

  const config: AxiosRequestConfig = {
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
    return null;
  }
}