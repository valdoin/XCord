import express from "express";
import tweetRoute from "./router";

const app = express();
const port = 3000;

app.use("/", tweetRoute);

export function start() {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}