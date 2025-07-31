import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupProduction(app: express.Express) {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../public")));

  // API routes should be handled before the catchall
  
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
    } else {
      const indexPath = path.join(__dirname, "../public/index.html");
      console.log("Serving index.html from:", indexPath);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).send("Error loading index.html");
        }
      });
    }
  });
}
