import { Hono } from "hono";

export function createHomeRoutes(): Hono {
  const router = new Hono();
  router.get("/", (c) => {
    return c.json({ message: "Welcome to the GitLab Webhooks to Telegram bot" });
  });
  return router;
}
