import { createServer } from "http";

const PORT = process.env.PORT || 8080;

function manipulateData(discordResponse: any) {
  if (!discordResponse?.username) throw Error("Your JSON is shit");
  return {
    id: discordResponse.id,
    name: discordResponse.username,
    email: `${discordResponse.username}@pawville.city`
  };
}

const proxy = createServer((req, res) => {
  let body = "";
  req.on('data', chunk => (body += String(chunk)));
  req.on('end', async () => {
    console.log(`${req.method} ${req.url}`);
    try {
      const response = await fetch(`https://discord.com${req.url}`, {
        method: req.method,
        headers: {
          ...req.headers as any,
          "user-agent": "DiscordBot (python-requests, 2.32.3)",
          "host": "discord.com"
        },
        body
      });

      res.writeHead(response.status);

      for (const [key, value] of response.headers.entries()) {
        if (key !== "content-type") continue;
        res.setHeader(key, value);
      }

      const textResponse = await response.text();
      try {
        if (!req.url.endsWith("/users/@me")) throw Error("Not me");
        const discordResponse = JSON.parse(textResponse);
        const convertedResponse = manipulateData(discordResponse);
        res.end(JSON.stringify(convertedResponse));
      } catch (error) {
        res.end(textResponse);
      }
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Proxy error: ' + String(err));
      return;
    }
  });
});

proxy.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));