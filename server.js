/**
 * GEOGRAPHY EDU - BACKEND API GATEWAY & STATIC SERVER
 * Du an: High School Help Kit
 * Nha phat trien: Tran Huy Vu
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// --- 1. SIMPLE DOTENV PARSER ---
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...rest] = trimmed.split("=");
        const val = rest.join("=").trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Simple in-memory rate limiter per IP: max 20 requests per minute
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 30;

  let record = rateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    rateLimitMap.set(ip, record);
    return true;
  }
  if (record.count >= maxReq) {
    return false;
  }
  record.count++;
  return true;
}

// MIME Types mapping
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// --- 2. HTTP REQUEST HANDLER ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp = (forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "127.0.0.1";

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    res.end();
    return;
  }

  // --- API ROUTE: Health Check ---
  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      status: "healthy",
      service: "Geography Edu Backend Gateway",
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      version: "2.0.0"
    });
    return;
  }

  // --- API ROUTE: AI Chat Proxy ---
  if (pathname === "/api/ai/chat" && req.method === "POST") {
    if (!checkRateLimit(clientIp)) {
      sendJson(res, 429, { error: "Yeu cau qua nhanh. Vui long thu lai sau 1 phut." });
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const { prompt, contents, systemInstruction } = body;

      if (!GEMINI_API_KEY) {
        sendJson(res, 500, { error: "GEMINI_API_KEY chua duoc cau hinh tren may chu." });
        return;
      }

      // Format payload for Gemini API
      const geminiPayload = {
        contents: contents || [{ parts: [{ text: prompt || "" }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1500
        }
      };

      if (systemInstruction) {
        geminiPayload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Call Google Gemini API from server side
      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload)
      });

      const data = await geminiRes.json();
      if (!geminiRes.ok) {
        sendJson(res, geminiRes.status, { error: data.error?.message || "Loi tu Gemini API" });
        return;
      }

      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, { error: err.message || "Loi may chu noi bo." });
    }
    return;
  }

  // --- API ROUTE: AI Translate Proxy ---
  if (pathname === "/api/ai/translate" && req.method === "POST") {
    if (!checkRateLimit(clientIp)) {
      sendJson(res, 429, { error: "Yeu cau qua nhanh. Vui long thu lai sau 1 phut." });
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const { text, targetLang } = body;

      if (!text || !targetLang) {
        sendJson(res, 400, { error: "Thieu noi dung van ban hoac ngon ngu dich." });
        return;
      }

      if (!GEMINI_API_KEY) {
        sendJson(res, 500, { error: "GEMINI_API_KEY chua duoc cau hinh tren may chu." });
        return;
      }

      const prompt = `Translate the following Geography study material text into language '${targetLang}'. Return ONLY the direct translation accurately with standard educational geography terminology, without any notes or emojis:\n\n${text}`;

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        })
      });

      const data = await geminiRes.json();
      if (!geminiRes.ok) {
        sendJson(res, geminiRes.status, { error: data.error?.message || "Loi dich thuat" });
        return;
      }

      const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      sendJson(res, 200, { translatedText, targetLang });
    } catch (err) {
      sendJson(res, 500, { error: err.message || "Loi may chu noi bo." });
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let localPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(localPath).replace(/^(\.\.[\/\\])+/, "");
  const normalizedDir = path.resolve(__dirname);
  const filePath = path.resolve(normalizedDir, "." + safePath);

  // Security: prevent directory traversal and block sensitive/hidden files
  const baseName = path.basename(filePath).toLowerCase();
  const BLOCKED_FILES = new Set(["server.js", "package.json", "package-lock.json", ".env", ".env.example", ".gitignore"]);
  const isInsideRoot = filePath === path.join(normalizedDir, "index.html") || filePath.startsWith(normalizedDir + path.sep);

  if (!isInsideRoot || baseName.startsWith(".") || baseName.endsWith(".rules") || baseName.endsWith(".ps1") || BLOCKED_FILES.has(baseName)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[Geography Edu] Server running at http://localhost:${PORT} [Env: ${NODE_ENV}]`);
});
