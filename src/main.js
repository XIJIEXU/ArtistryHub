// main.ts

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import * as log from "./shared/logger.ts";
import { promptGPT } from "./shared/openai.ts";

log.setLogLevel(log.LogLevel.DEBUG);
log.info("Starting ArtistryHub server");

const app = new Application();
const router = new Router();

// Get inspiration route
router.get("/api/inspiration", async (ctx) => {
  const topic = ctx.request.url.searchParams.get("topic") || "art";
  const style = ctx.request.url.searchParams.get("style") || "abstract";
  const media = ctx.request.url.searchParams.get("media") || "digital";

  log.info(`Received request for inspiration: topic=${topic}, style=${style}, media=${media}`);

  const inspiration = await promptGPT(`Give me an artistic inspiration or idea related to "${topic}", "${style}", and using "${media}".`);

  ctx.response.body = { inspiration };
});

// Static pages routes
router.get("/get-inspiration", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/public`, index: "get-inspiration.html" });
});

router.get("/research", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/public`, index: "research.html" });
});

router.get("/iteration", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/public`, index: "iteration.html" });
});

router.get("/brainstorm", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/public`, index: "brainstorm.html" });
});

// Serve static files (e.g., style.css)
app.use(staticServer);

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
