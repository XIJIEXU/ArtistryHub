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
    const directionsPrompt = `Provide three different unique design project ideas based on the following: 
    Key Words: ${keyWords}, 
    Tools: ${tools}, 
    Project Use: ${projectUse}.
    Limit the total words to 500.`;

    const projectDirections = await promptGPT(directionsPrompt, {
      max_tokens: 3000,
      temperature: 0.7,
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
