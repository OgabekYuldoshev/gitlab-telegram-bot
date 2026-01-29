import { Hono } from "hono";

type Health = {
  hasError(): boolean;
};

export function createHealthRoutes(health: Health): Hono {
  const router = new Hono();
  router.get("/", (c) => {
    const ok = !health.hasError();
    return c.json({ result: ok ? "OK" : "NOK" }, ok ? 200 : 500);
  });
  return router;
}
