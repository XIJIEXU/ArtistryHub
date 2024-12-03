import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT } from "./shared/openai.ts";
import * as log from "./shared/logger.ts";

// Logging setup
log.setLogLevel(log.LogLevel.DEBUG);
log.info("Starting InnoVibe server");

// Create application and router
const app = new Application();
const router = new Router();

// Enable CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
});

// API-1-IdeaSpark router
router.post("/api/inspiration", async (ctx) => {
  try {
    const { keyWord1, keyWord2, keyWord3, tools, projectUse } = await ctx.request.body().value;

    const directionsPrompt = `Based on the following inputs, generate three unique and detailed project directions:
    - Key Words: ${keyWord1}, ${keyWord2}, ${keyWord3}
    - Tools: ${tools}
    - Project Use: ${projectUse}
    
    For each project idea, provide:
    1. A clear project description.
    2. A unique project name.
    3. A suggestion for how the specified tools can be used in this project.
    
    Each project idea should be distinct and creatively explore the different possibilities of the provided keywords and tools, keeping in mind the project use.
    
    The total word count for all three project ideas should not exceed 700 words.
    
    Please provide the response as a plain text with each project idea on a new line. Avoid using any special formatting.`;

    // Call GPT to generate project directions
    const projectDirections = await promptGPT(directionsPrompt, {
      max_tokens: 700, 
      temperature: 0.7,
    });

    console.log("Received project directions from GPT:", projectDirections);  // Log the response

    // Ensure the data is returned as an array of strings
    const projectDirectionsArray = projectDirections.split('\n').map((item) => item.trim()).filter(Boolean);  // Split by line and remove empty strings

    // Log the formatted array
    console.log("Formatted project directions:", projectDirectionsArray);

    // Send the response back
    ctx.response.body = {
      message: "Project directions generated",
      projectDirections: projectDirectionsArray,
    };
  } catch (err) {
    console.error("Error generating project directions:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate project directions due to server error",
      details: err.message || err.toString(),
      path: ctx.request.url.pathname,
    };
  }
});


// Tell the app to use the custom routes
app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
log.info("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
