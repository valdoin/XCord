const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { getGuestToken } = require("../services/guestTokenService");
const { getRandomProxy } = require("../services/proxyService");

async function fetchTweet(req, res) {
  try {
    const tweetID = req.params.tweetID;
    const proxy = getRandomProxy();
    const agent = new HttpsProxyAgent(proxy);
    const guestToken = await getGuestToken();

    const config = {
      method: "GET",
      url: "https://api.x.com/graphql/Xl5pC_lBk_gcO2ItU39DQw/TweetResultByRestId",
      params: {
        variables: JSON.stringify({
          tweetId: tweetID,
          withCommunity: false,
          includePromotedContent: false,
          withVoice: false,
        }),
        features: JSON.stringify({
          creator_subscriptions_tweet_preview_api_enabled: true,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          articles_preview_enabled: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          rweb_video_timestamps_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        }),
        fieldToggles: JSON.stringify({
          withArticleRichContentState: true,
          withArticlePlainText: false,
          withGrokAnalyze: false,
        }),
      },
      headers: {
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        "x-guest-token": guestToken,
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "en",
        "x-client-transaction-id":
          "Wrdg0MrefzpjAczgX2jye33wFrdElzhi3P9+VHaFYP9UPGEAom97LFYpk7zd3wc118OvbFgMtLEjZb7qUJRMEiqpHn91WQ",
      },
      httpsAgent: agent,
      proxy: false
    };

    const response = await axios(config);
    res.status(200).send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch tweet" });
  }
}

module.exports = { fetchTweet };