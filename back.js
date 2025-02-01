require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");

// Create a new instance of TwitterApi
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

console.log(client);

// Function to fetch user tweets with like counts
async function getUserTweets(username) {
  try {
    const user = await client.v2.userByUsername(username);
    const tweets = await client.v2.userTimeline(user.data.id, {
      max_results: 10,
      "tweet.fields": ["public_metrics", "created_at"],
    });

    return tweets.data.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      likes: tweet.public_metrics.like_count,
      retweets: tweet.public_metrics.retweet_count,
      replies: tweet.public_metrics.reply_count,
      created_at: tweet.created_at,
    }));
  } catch (error) {
    console.error("Error fetching tweets:", error);
    throw error;
  }
}

// Function to get tweet details by ID
async function getTweetById(tweetId) {
  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      "tweet.fields": ["public_metrics", "created_at"],
    });

    return {
      id: tweet.data.id,
      text: tweet.data.text,
      metrics: tweet.data.public_metrics,
      created_at: tweet.data.created_at,
    };
  } catch (error) {
    console.error("Error fetching tweet:", error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    // // Get tweets for a specific user
    // const tweets = await getUserTweets("NCSIndia");
    // console.log("User tweets:", tweets);

    const tweetDetails = await getTweetById("1879179494558450166");
    console.log("Tweet details:", tweetDetails);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
