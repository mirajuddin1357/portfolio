import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { setupProduction } from "./production";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error Handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", err);
  res.status(status).json({ message });
});

(async () => {
  console.log("Starting server with NODE_ENV:", process.env.NODE_ENV);
  
  // Setup based on environment
  if (process.env.NODE_ENV === "development") {
    console.log("Setting up development mode");
    const devServer = await registerRoutes(app);
    await setupVite(app, devServer);
    devServer.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running in development mode on http://localhost:${PORT}`);
    });
  } else {
    console.log("Setting up production mode");
    const prodServer = await registerRoutes(app);
    setupProduction(app);
    prodServer.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running in production mode on port ${PORT}`);
    });
  }
})();
