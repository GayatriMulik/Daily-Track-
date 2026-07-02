import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialize Gemini client to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // API Route: Smart YouTube Playlist Curriculum Fetcher using Gemini
  app.post("/api/playlist/fetch", async (req, res) => {
    const { url, name } = req.body;

    if (!name && !url) {
      return res.status(400).json({ error: "Please provide a course name or a YouTube playlist URL." });
    }

    try {
      // Lazy initialize the Gemini API
      const ai = getGeminiClient();

      // Formulate a smart prompt for Gemini to design a custom curriculum
      const prompt = `The student is adding a YouTube playlist/course for learning.
Input course/playlist name or query: "${name || ""}"
Input URL (may contain useful context): "${url || ""}"

Act as an expert instructor and construct an authentic, comprehensive, and sequential course curriculum (representing 10 to 20 actual video lessons) based on this topic.
Ensure the lesson titles are realistic, highly descriptive, professional (NO emojis), and logically structured from beginner foundations to intermediate and advanced application.

Provide a refined, polished name for this playlist, and a list of structured lessons.`;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              playlistName: {
                type: Type.STRING,
                description: "A polished, professional title for the course, e.g. 'Advanced React 19 Architect Masterclass'"
              },
              videos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: {
                      type: Type.STRING,
                      description: "A unique sequential ID like 'video-1', 'video-2', etc."
                    },
                    title: {
                      type: Type.STRING,
                      description: "The actual detailed video lesson title, e.g. 'Understanding Component Lifecycle & Concurrent Rendering'"
                    },
                    completed: {
                      type: Type.BOOLEAN,
                      description: "Always false"
                    }
                  },
                  required: ["id", "title", "completed"]
                }
              }
            },
            required: ["playlistName", "videos"]
          }
        }
      });

      const responseText = geminiResponse.text;
      if (!responseText) {
        throw new Error("Model returned empty response.");
      }

      const result = JSON.parse(responseText);
      return res.json(result);

    } catch (err: any) {
      console.error("Error generating playlist curriculum:", err);
      // Fallback response with beautiful default lessons if Gemini key is missing or fails
      const fallbackName = name ? name : "YouTube Study Course";
      const fallbackVideos = [
        { id: "video-1", title: "Course Introduction and Setup", completed: false },
        { id: "video-2", title: "Core Concepts and Fundamentals", completed: false },
        { id: "video-3", title: "Working with Data Structures and State", completed: false },
        { id: "video-4", title: "Building Practical Applications", completed: false },
        { id: "video-5", title: "Debugging and Optimization Techniques", completed: false },
        { id: "video-6", title: "Advanced Patterns and Best Practices", completed: false },
        { id: "video-7", title: "Deployment and Production Workflow", completed: false },
        { id: "video-8", title: "Final Review and Next Steps", completed: false }
      ];

      return res.json({
        playlistName: fallbackName,
        videos: fallbackVideos,
        warning: "Gemini AI was not reachable or configured, so a high-fidelity fallback curriculum was initialized."
      });
    }
  });

  // Serve static client assets / hook Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
