import fs from "fs";
import { createServer } from "http";
import path from "path";
import url from "url";

import { CharacterNetworkServer } from "@mml-playground/character-network";
import chokidar from "chokidar";
import express, { Request } from "express";
import enableWs from "express-ws";
import httpProxy from "http-proxy";
import { LocalObservableDOMFactory, EditableNetworkedDOM } from "networked-dom-server";

const PLAYGROUND_DOCUMENT_PATH = path.resolve(__dirname, "../playground.html");
const PORT = process.env.PORT || 8080;
const DOCUMENT_SOCKET_PATH = "/document";
const CHARACTER_NETWORK_SOCKET_PATH = "/network";
const EXAMPLE_DOCUMENTS_SOCKET_PATH = "/examples";
let examplesHostUrl = "";

const app = express();
const { getWss } = enableWs(app);
const server = createServer(app);

const proxy = httpProxy.createProxyServer({
  target: {
    host: "localhost",
    port: 3000,
  },
  ws: true,
});

server.on("upgrade", function (req, socket, head) {
  const isViteHmr = req.headers["sec-websocket-protocol"] === "vite-hmr";
  if (isViteHmr) {
    proxy.ws(req, socket, head);
  } else {
    getWss().handleUpgrade(req, socket, head, function done(ws) {
      getWss().emit("connection", ws, req);
    });
  }
});

app.enable("trust proxy");

const getMmlDocumentContent = (documentPath: string) => {
  return fs.readFileSync(documentPath, { encoding: "utf8", flag: "r" }).replace(
    /\/\/\{PLAYGROUND_RUNTIME_CONSTANTS\}/g,
    `
    const EXAMPLES_HOST_URL = '${examplesHostUrl}';
  `,
  );
};

const playgroundDocument = new EditableNetworkedDOM(
  url.pathToFileURL(PLAYGROUND_DOCUMENT_PATH).toString(),
  LocalObservableDOMFactory,
);

const updateExamplesHostUrl = (req: Request) => {
  if (!examplesHostUrl) {
    examplesHostUrl = `${req.secure ? "wss" : "ws"}://${
      req.headers["x-forwarded-host"]
        ? `${req.headers["x-forwarded-host"]}:${req.headers["x-forwarded-port"]}`
        : req.headers.host
    }${EXAMPLE_DOCUMENTS_SOCKET_PATH}`;

    playgroundDocument.load(getMmlDocumentContent(PLAYGROUND_DOCUMENT_PATH));
  }
};

playgroundDocument.load(getMmlDocumentContent(PLAYGROUND_DOCUMENT_PATH));

chokidar.watch(PLAYGROUND_DOCUMENT_PATH).on("change", () => {
  playgroundDocument.load(getMmlDocumentContent(PLAYGROUND_DOCUMENT_PATH));
});

(app as any).ws(DOCUMENT_SOCKET_PATH, (ws: any) => {
  playgroundDocument.addWebSocket(ws as any);
  ws.on("close", () => {
    playgroundDocument.removeWebSocket(ws as any);
  });
});

const exampleDocuments: {
  [key: string]: {
    documentPath: string;
    document: EditableNetworkedDOM;
  };
} = {};

const characterNetwork = new CharacterNetworkServer();
(app as any).ws(CHARACTER_NETWORK_SOCKET_PATH, (ws: any) => {
  characterNetwork.connectClient(ws);
});

(app as any).ws(`${EXAMPLE_DOCUMENTS_SOCKET_PATH}/:filename`, (ws: any, req: any) => {
  const { filename } = req.params;
  const exampleDocument = exampleDocuments[filename]?.document;
  if (!exampleDocument) {
    ws.close();
    return;
  }

  exampleDocument.addWebSocket(ws as any);
  ws.on("close", () => {
    exampleDocument.removeWebSocket(ws as any);
  });
});

const FORK_PAGE_CONTENT = `
  Please click the 'Fork' button to create your sandbox.
`;

if (process.env.NODE_ENV === "production") {
  const demoModulePath = require
    .resolve("@mml-playground/web/package.json")
    .replace("package.json", "dist");
  const demoIndexContent = fs.readFileSync(path.join(demoModulePath, "index.html"), "utf8");
  app.get("/", (req, res) => {
    if (process.env.DISABLE_SERVER === "true") {
      res.send(FORK_PAGE_CONTENT);
      return;
    }

    updateExamplesHostUrl(req);
    res.send(demoIndexContent);
  });
  app.use("/", express.static(demoModulePath));
} else {
  app.get("/*", (req, res) => {
    if (process.env.DISABLE_SERVER === "true") {
      res.send(FORK_PAGE_CONTENT);
      return;
    }

    updateExamplesHostUrl(req);
    proxy.web(req, res);
  });
}

const examplesWatchPath = path.resolve(path.join(__dirname, "../examples"), "*.html");
const watcher = chokidar.watch(examplesWatchPath, {
  ignored: /^\./,
  persistent: true,
});
watcher
  .on("add", (relativeFilePath) => {
    const filename = path.basename(relativeFilePath);
    console.log(`Example document '${filename}' has been added`);
    const contents = getMmlDocumentContent(relativeFilePath);
    const document = new EditableNetworkedDOM(
      url.pathToFileURL(filename).toString(),
      LocalObservableDOMFactory,
    );
    document.load(contents);

    const currentData = {
      documentPath: filename,
      document,
    };
    exampleDocuments[filename] = currentData;
  })
  .on("change", (relativeFilePath) => {
    const filename = path.basename(relativeFilePath);
    console.log(`Example document '${filename}' has been changed`);
    const contents = getMmlDocumentContent(relativeFilePath);
    const document = exampleDocuments[filename].document;
    document.load(contents);
  })
  .on("unlink", (relativeFilePath) => {
    const filename = path.basename(relativeFilePath);
    console.log(`Example document '${filename}' has been removed`);
    const document = exampleDocuments[filename].document;
    document.dispose();
    delete exampleDocuments[filename];
  })
  .on("error", (error) => {
    console.error("Error whilst watching directory", error);
  });

console.log("Listening on port", PORT);
server.listen(PORT);
