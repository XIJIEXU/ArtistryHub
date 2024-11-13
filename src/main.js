// main.ts

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import * as log from "./shared/logger.ts";
import { promptGPT } from "./shared/openai.ts";

// 设置日志级别
log.setLogLevel(log.LogLevel.DEBUG);
log.info("Starting ArtistryHub server");

// 创建应用和路由
const app = new Application();
const router = new Router();

// 汇率转换的 API 路由
router.get("/api/inspiration", async (ctx) => {
  const topic = ctx.request.url.searchParams.get("topic") || "art"; // 默认话题是“art”
  log.info(`Received topic: ${topic}`);

  // 调用 ChatGPT API 生成灵感
  const inspiration = await promptGPT(`Give me an artistic inspiration or idea related to "${topic}".`);
  
  // 返回灵感建议
  ctx.response.body = { topic, inspiration };
});

// 设置其他路由
router.get("/api/test", (ctx) => {
  log.info("Received test request");
  ctx.response.body = "Try the ArtistryHub app!";
});

// 使用路由
app.use(router.routes());
app.use(router.allowedMethods());

// 提供静态文件服务
app.use(staticServer);

// 启动服务器
console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });