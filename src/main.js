// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import server helper functions from the class library
import { createExitSignal, staticServer } from "./shared/server.ts";

// Import the promptGPT function from the class library
import { promptGPT } from "./shared/openai.ts";

import * as log from "./shared/logger.ts";

// tell the shared library code to log everything
log.setLogLevel(log.LogLevel.DEBUG);
log.info("Starting InnoVibe server");

const app = new Application();
const router = new Router();

// API-1-IdeaSpark
router.post("/api/inspiration", async (ctx) => {
  try {
    const { keyWords, tools, projectUse } = await ctx.request.body().value;

    // Generate prompt based on user input
    const directionsPrompt = `Use Tools: ${tools} and base on keyWords: ${keyWords} 
    projectUse: ${projectUse} to generate three totally different design project ideas, control total words under 700.
    Including project main idea, project name, and how to use the tool. 
    Avoid using any special formatting like bold text. The description should use plain text only without any special formatting like bold or italic text, 
    any markdown formatting.`;


    const projectDirections = await promptGPT(directionsPrompt, {
      max_tokens: 800,
      temperature: 0.4,
    });

    // Send the response with the generated directions
    ctx.response.body = { message: "Idea Spark generated", directions: projectDirections };
  } catch (err) {
    console.error("Error generating idea sparks:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate idea sparks due to server error",
      details: err.message || err.toString(),
      path: ctx.request.url.pathname,
    };
  }
});

//不要动！！
// Tell the app to use the custom routes
app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
log.info("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
