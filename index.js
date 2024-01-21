import http from "http";
import routes from "./routes.js";

function handler(req, res) {
  const { method, url, headers } = req;
  console.log(`Received ${method} request for ${url}`);

  const contentType = headers["content-type"];

  const handler = routes[url] ? routes[url][method] : null;

  const answerContentTypePlain = { "Content-Type": "text/plain" };

  if (handler) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (method !== "GET") {
        let parsedData;

        try {
          if (contentType.startsWith("application/json")) {
            parsedData = JSON.parse(body);
          } else if (
            contentType.startsWith("application/x-www-form-urlencoded")
          ) {
            parsedData = Object.fromEntries(new URLSearchParams(body));
          } else {
            res.writeHead(415, answerContentTypePlain);
            return res.end("Unsupported Media Type");
          }
        } catch (error) {
          res.writeHead(415, answerContentTypePlain);
          if (contentType.startsWith("application/json")) {
            return res.end("invalid JSON");
          } else if (
            contentType.startsWith("application/x-www-form-urlencoded")
          ) {
            return res.end("invalid form data");
          }
        }

        req.body = parsedData;
      }
      handler(req, res);
    });
  } else {
    res.writeHead(404, answerContentTypePlain);
    res.end("404 Not Found");
  }
}

const server = http.createServer(handler);

process.on("SIGTERM", () => {
  console.log("Starting graceful shutdown");
  server.close(() => {
    console.log("All connections closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
