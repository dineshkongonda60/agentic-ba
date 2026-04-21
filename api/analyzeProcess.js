import formidable from "formidable";
import fs from "fs";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let input = {};
  let extractedText = "";

  try {
    const contentType = req.headers["content-type"] || "";

    /* =====================================================
       1️⃣ Parse multipart (upload.html) OR JSON (index.html)
       ===================================================== */
    if (contentType.includes("multipart/form-data")) {
      const form = formidable({ multiples: false });

      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });

      input = normalizeFields(fields);

      /* -------------------------
         File extraction (safe)
      -------------------------- */
      if (files.process_file) {
        let file = files.process_file;
        if (Array.isArray(file)) file = file[0];

        const filename =
          file.originalFilename ||
          file.name ||
          file.newFilename ||
          "";

        const ext = filename.includes(".")
          ? filename.split(".").pop().toLowerCase()
          : "";

        try {
          if (ext === "docx") {
            const result = await mammoth.extractRawText({
              path: file.filepath
            });
            extractedText = result.value;
          } else if (ext === "pdf") {
            const buffer = fs.readFileSync(file.filepath);
            const result = await pdfParse(buffer);
            extractedText = result.text;
          } else {
            extractedText = "Uploaded file type not supported for extraction.";
          }
        } catch (err) {
          console.error("File extraction error:", err);
          extractedText = "Failed to extract document content.";
        }
      }
    } else {
      // ✅ JSON flow (index.html)
      input = JSON.parse(await getRawBody(req));
    }

    /* =====================================================
       2️⃣ Normalize extracted text
       ===================================================== */
    extractedText = extractedText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 3000)
      .join("\n");

    /* =====================================================
       3️⃣ Prompts
       ===================================================== */
    const systemPrompt = `
You are an Automation Suitability and Estimation Agent for Business Analysts.

STRICT OUTPUT RULES:
1. Respond with ONLY a raw JSON object.
2. DO NOT use markdown, backticks, or code blocks.
3. DO NOT include explanations or commentary.
4. Output must be valid JSON parseable by JSON.parse().

REQUIRED OUTPUT JSON SCHEMA:
{
  "primaryTool": "string",
  "secondaryTool": "string",
  "timeline": "string",
  "requiredSkills": ["string"],
  "justification": "string"
}

Return EXACTLY this structure.
`;

    const userPrompt = `
Process Name: ${input.processName || "N/A"}
Process Description:
${input.processDescription || "Not provided"}

OCR Required: ${input.ocrRequired || "Unknown"}
Decision Nature: ${input.decisionNature || "Unknown"}
Volume: ${input.volume || "Unknown"}
Resources: ${input.resources || "Unknown"}
Available Skills: ${(input.skills || []).join(", ") || "Not specified"}

AS-IS Process Text:
${extractedText || "No document provided"}
`;

    /* =====================================================
       4️⃣ OpenAI Call
       ===================================================== */
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty OpenAI response");
    }

    /* =====================================================
       5️⃣ Clean markdown & parse JSON safely
       ===================================================== */
    const cleaned = content
      .replace(/```json\s*/i, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "Agent execution failed",
        details: "OpenAI returned non-JSON output",
        raw: content
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Agent Error:", err);
    return res.status(500).json({
      error: "Agent execution failed",
      details: err.message
    });
  }
}

/* =====================================================
   Utils
   ===================================================== */

// Read raw body for JSON requests
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Normalize formidable fields (string | array)
function normalizeFields(fields) {
  const normalized = {};
  for (const key in fields) {
    normalized[key] = Array.isArray(fields[key])
      ? fields[key]
      : fields[key]?.toString();
  }

  if (typeof normalized.skills === "string") {
    normalized.skills = normalized.skills.split(",").map(s => s.trim());
  }

  return normalized;
}