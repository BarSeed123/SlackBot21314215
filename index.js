require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

function safeCommand(commandName, handler) {
  app.command(commandName, async ({ command, ack, respond }) => {
    await ack();
    try {
      await handler({ command, respond });
    } catch (err) {
      console.error(`Error in ${commandName}:`, err.message);
      await respond({ text: `Something went wrong running ${commandName}.` });
    }
  });
}


app.command("/bartbot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/bartbot-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/bartbot-ping        - Check bot latency
/bartbot-help        - Show this help message
/bartbot-catfact     - Get a random cat fact
/bartbot-catpic      - Get a random cat picture
/bartbot-dogfact     - Get a random dog fact
/bartbot-dogpic      - Get a random dog picture
/bartbot-joke        - Get a random joke
/bartbot-chucknorris - Get a random Chuck Norris joke
/bartbot-quote       - Get an inspirational quote
/bartbot-advice      - Get a random piece of advice
/bartbot-trivia      - Get a random trivia question
/bartbot-activity    - Get a random activity suggestion (bored? try this)
/bartbot-numberfact  - Get a random number trivia fact
/bartbot-define [word] - Look up a word's definition
/bartbot-roll [NdM]  - Roll dice, e.g. /bartbot-roll 2d6
/bartbot-coinflip    - Flip a coin`
  });
});
-

safeCommand("/bartbot-catfact", async ({ respond }) => {
  const response = await axios.get("https://catfact.ninja/fact");
  await respond({ text: `Cat Fact:\n${response.data.fact}` });
});

safeCommand("/bartbot-catpic", async ({ respond }) => {
  const response = await axios.get("https://api.thecatapi.com/v1/images/search");
  await respond({ text: response.data[0].url });
});

safeCommand("/bartbot-dogfact", async ({ respond }) => {
  const response = await axios.get("https://dog-api.kinduff.com/api/facts");
  await respond({ text: `Dog Fact:\n${response.data.facts[0]}` });
});

safeCommand("/bartbot-dogpic", async ({ respond }) => {
  const response = await axios.get("https://dog.ceo/api/breeds/image/random");
  await respond({ text: response.data.message });
});

safeCommand("/bartbot-numberfact", async ({ respond }) => {
  const response = await axios.get("http://numbersapi.com/random/trivia");
  await respond({ text: `Number Fact:\n${response.data}` });
});



safeCommand("/bartbot-joke", async ({ respond }) => {
  const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
  await respond({ text: `${response.data.setup}\n\n${response.data.punchline}` });
});

safeCommand("/bartbot-chucknorris", async ({ respond }) => {
  const response = await axios.get("https://api.chucknorris.io/jokes/random");
  await respond({ text: response.data.value });
});

safeCommand("/bartbot-quote", async ({ respond }) => {
  const response = await axios.get("https://zenquotes.io/api/random");
  const { q, a } = response.data[0];
  await respond({ text: `"${q}"\n— ${a}` });
});

safeCommand("/bartbot-advice", async ({ respond }) => {
  const response = await axios.get("https://api.adviceslip.com/advice");
  await respond({ text: `Advice:\n${response.data.slip.advice}` });
});



safeCommand("/bartbot-trivia", async ({ respond }) => {
  const response = await axios.get("https://opentdb.com/api.php?amount=1");
  const q = response.data.results[0];
  const decode = (str) =>
    str
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&eacute;/g, "é");
  await respond({
    text: `Trivia (${decode(q.category)} - ${q.difficulty}):\n${decode(q.question)}\nAnswer: ${decode(q.correct_answer)}`
  });
});

safeCommand("/bartbot-activity", async ({ respond }) => {
  const response = await axios.get("https://www.boredapi.com/api/activity");
  await respond({ text: `Bored? Try this:\n${response.data.activity}` });
});

safeCommand("/bartbot-define", async ({ command, respond }) => {
  const word = command.text.trim();
  if (!word) {
    await respond({ text: "Usage: /bartbot-define [word]" });
    return;
  }

  const response = await axios.get(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  );
  const entry = response.data[0];
  const meaning = entry.meanings[0];
  const definition = meaning.definitions[0].definition;
  await respond({
    text: `${entry.word} (${meaning.partOfSpeech}):\n${definition}`
  });
});


app.command("/bartbot-coinflip", async ({ ack, respond }) => {
  await ack();
  const result = Math.random() < 0.5 ? "Heads" : "Tails";
  await respond({ text: `🪙 ${result}!` });
});

app.command("/bartbot-roll", async ({ command, ack, respond }) => {
  await ack();

  const input = command.text.trim() || "1d6";
  const match = input.match(/^(\d+)d(\d+)$/i);

  if (!match) {
    await respond({ text: "Usage: /bartbot-roll [NdM], e.g. /bartbot-roll 2d6" });
    return;
  }

  const count = Math.min(parseInt(match[1], 10), 20);
  const sides = Math.min(parseInt(match[2], 10), 1000);

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((sum, r) => sum + r, 0);

  await respond({ text: `🎲 Rolled ${count}d${sides}: [${rolls.join(", ")}]\nTotal: ${total}` });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();