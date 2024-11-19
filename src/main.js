// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import server helper functions from the class library
import { createExitSignal, staticServer } from "./shared/server.ts";

// Import the promptGPT function from the class library
import { promptGPT } from "./shared/openai.ts";

import * as log from "./shared/logger.ts";

// tell the shared library code to log everything
log.setLogLevel(log.LogLevel.DEBUG);
log.info("Starting ArtistryHub server");

const app = new Application();
const router = new Router();

// API-1-Inspiration
router.post("/api/inspiration", async (ctx) => {
  try {
    const {
      projectDescription,
      mediaPreference,
      stylePreference,
      targetAudience,
    } = await ctx.request.body().value;

    //prompt
    const inspirationPrompt = `Project Description: ${projectDescription} Media Preference: ${mediaPreference} 
    Style Preferences: ${stylePreference} Target Audience: ${targetAudience}. 
    Avoid using any special formatting like bold text. The description should use plain text only without any special formatting like bold or italic text, 
    any markdown formatting.`;

    const inspiration = await promptGPT(inspirationPrompt, {
      max_tokens: 800,
      temperature: 0.7,
    });

    //response
    ctx.response.body = { message: "Design Inspiration generated", inspiration };
  } catch (err) {
    console.error(chalk.red("Error generating design inspiration:"), err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate design inspiration due to server error",
      details: err.message || err.toString(),
      path: ctx.request.url.pathname,
    };
  }
});


// API-2-Research
router.post("/api/research", async (ctx) => {
  try {
    const {
      projectDescription,
      researchType, 
    } = await ctx.request.body().value;

    const researchPrompt = `Project Description: ${projectDescription}. 
      Research Type: ${researchType}. 
      Please provide research insights based on the project description and the selected research type. 
      Avoid using any special formatting like bold text. The description should use plain text only without any special formatting like bold or italic text, any markdown formatting. 500 words limite`;

    const researchResults = await promptGPT(researchPrompt, {
      max_tokens: 1000,  
      temperature: 0.4,
    });

    ctx.response.body = { message: "Research generated", researchResults };
  } catch (err) {
    console.error("Error generating research:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate research due to server error",
      details: err.message || err.toString(),
      path: ctx.request.url.pathname,
    };
  }
});

// API-3-Iteration
router.post("/api/iteration", async (ctx) => {
  try {
    const {
      projectDescription,
      imageBase64,  // 上传的项目图片以Base64格式传递
    } = await ctx.request.body().value;

    // 为GPT生成反馈的提示
    const iterationPrompt = `Project Description: ${projectDescription}.
    Please provide feedback on the project and suggest the next steps based on the project description. 
    Use plain text only without any special formatting like bold or italic text, any markdown formatting.
    If an image is provided, analyze the design and offer suggestions for improvements or next steps.`;

    // 如果有图片，附加图片数据
    const promptWithImage = imageBase64 ? `${iterationPrompt} Image: ${imageBase64}` : iterationPrompt;

    // 获取ChatGPT的反馈和建议
    const feedbackResults = await promptGPT(promptWithImage, {
      max_tokens: 1000,
      temperature: 0.6,
    });

    ctx.response.body = { message: "Iteration feedback generated", feedback: feedbackResults };
  } catch (err) {
    console.error("Error generating iteration feedback:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate feedback due to server error",
      details: err.message || err.toString(),
      path: ctx.request.url.pathname,
    };
  }
});

// API-4-Brainstorm
router.post("/api/brainstorm", async (ctx) => {
  try {
    const { words, mediaType } = await ctx.request.body().value;

    // Build the prompt with user input
    const brainstormPrompt = `Given the words: ${words.join(', ')}, and the selected media type: ${mediaType},
    generate 5 unique creative ideas related to these inputs. The ideas should be relevant to the chosen media type and creative in nature.
    Provide the ideas in plain text without any special formatting like bold or italic text, or markdown. 500 words limitation.`

    // Use GPT to generate five ideas based on the user input
    const ideas = await promptGPT(brainstormPrompt, {
      max_tokens: 2000,
      temperature: 0.7,
    });

    ctx.response.body = { message: "Brainstorm ideas generated", ideas: ideas.trim().split('\n').slice(0, 5) };  // Splitting the ideas into an array and limiting to 5
  } catch (err) {
    console.error("Error generating brainstorm ideas:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Failed to generate brainstorm ideas due to server error",
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
