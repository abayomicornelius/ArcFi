import express, { type Request, type Response } from "express";
import { env } from "./env.js";
import { verifySignature, parseMergedPullRequestEvent } from "./github.js";
import { handleMergedPullRequest } from "./oracle.js";

type RequestWithRawBody = Request & { rawBody?: Buffer };

export function createServer() {
  const app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = buf;
      },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/webhooks/github", (req: RequestWithRawBody, res: Response) => {
    const signature = req.header("x-hub-signature-256");
    if (!req.rawBody || !verifySignature(req.rawBody, signature, env.githubWebhookSecret)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const eventName = req.header("x-github-event") ?? "";
    const event = parseMergedPullRequestEvent(eventName, req.body);

    if (!event) {
      // Not a merged PR closing a linked issue — nothing to do, still a
      // healthy delivery as far as GitHub is concerned.
      res.status(200).json({ ok: true, handled: false });
      return;
    }

    // Ack immediately; GitHub's webhook delivery times out well before an
    // on-chain tx confirms. The actual release runs in the background.
    res.status(202).json({ ok: true, handled: true });
    handleMergedPullRequest(event).catch((err) => {
      console.error("[oracle] unhandled error processing merged PR:", err);
    });
  });

  return app;
}

export function startServer() {
  const app = createServer();
  app.listen(env.port, () => {
    console.log(`[oracle] listening on :${env.port}`);
  });
}
