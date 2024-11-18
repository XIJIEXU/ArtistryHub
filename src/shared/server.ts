import * as log from "./logger.ts";
import { Context } from "https://deno.land/x/oak@14.2.0/context.ts";
import { type Next } from "https://deno.land/x/oak@14.2.0/middleware.ts";

// Serve static files from the public directory
export async function staticServer(context: Context, next: Next) {
  try {
    // Log the incoming request path
    console.log(`Static server request: ${context.request.url.pathname}`);
    
    // Check if the 'public' directory exists, otherwise log error and contents of the current directory
    try {
      await Deno.stat(`${Deno.cwd()}/public`);
    } catch (err) {
      log.error("Public folder not found");
      log.log("cwd: ", Deno.cwd());
      console.log(`cwd: ${Deno.cwd()}`);
      for await (const dirEntry of Deno.readDir(".")) {
        console.log(dirEntry.name); // Log the contents of the current directory
      }
      return; // Exit the function if the directory is missing
    }

    // Send static files from the 'public' folder
    await context.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",  // Default to 'index.html' when the directory is accessed
    });
  } catch (err) {
    log.error("Error serving static files:", err);
    await next(); // Proceed to next middleware if an error occurs
  }
}

// Handle process termination signal (SIGINT)
export function createExitSignal() {
  const exitController = new AbortController();
  
  Deno.addSignalListener("SIGINT", () => {
    log.warn("Received SIGINT, sending abort signal.");
    exitController.abort();
    log.warn("Exiting...");
    Deno.exit();
  });

  return exitController.signal;
}
