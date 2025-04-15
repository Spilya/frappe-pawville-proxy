import { createServer } from "http";

const PORT = process.env.PORT || 8080;

function manipulateData(discordResponse: any) {
  const newObj = structuredClone(discordResponse);
  if (!discordResponse) return newObj;

  if (discordResponse.username) {
    newObj.name = discordResponse.username;
    newObj.email = `${discordResponse.username}@pawville.city`;
  }
}

const proxy = createServer((req, res) => {
  let body = "";
  req.on('data', chunk => (body += String(chunk)));
  req.on('end', async () => {
    console.log(`${req.method} ${req.url}`);
    try {
      const response = await fetch(`https://discord.com${req.url}`, {
        method: req.method,
        headers: req.headers as any,
        body
      });

      res.writeHead(response.status);

      for (const [key, value] of response.headers.entries())
        res.setHeader(key, value);

      const textResponse = await response.text();
      try {
        const discordResponse = JSON.parse(textResponse);
        const convertedResponse = manipulateData(discordResponse);
        res.end(JSON.stringify(convertedResponse));
      } catch {
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