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

    /* -------------------------
       Parse multipart OR JSON
    -------------------------- */
    if (contentType.includes("multipart/form-data")) {
  const form = formidable({ multiples: false });

  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });

  input = fields;

  if (files.process_file) {
    const file = files.process_file;
    const ext = file.originalFilename.split(".").pop().toLowerCase();

    try {
      if (ext === "docx") {
        const result = await mammoth.extractRawText({ path: file.filepath });
        extractedText = result.value;
      } else if (ext === "pdf") {
        const buffer = fs.readFileSync(file.filepath);
        const result = await pdfParse(buffer);
        extractedText = result.text;
      }
    } catch {
      extractedText = "Failed to extract document content";
    }
  }
}

    /* -------------------------
       Normalize extracted text
    -------------------------- */
    extractedText = extractedText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 3000)
      .join("\n");

    /* -------------------------
       Prompts
    -------------------------- */
    const systemPrompt = `
You are an Automation Suitability and Estimation Agent for Business Analysts.

STRICT OUTPUT RULES:
1. Respond with ONLY a raw JSON object.
2. DO NOT use markdown, backticks, or code blocks.
3. DO NOT include explanations or commentary.
4. Output must be valid JSON parseable by JSON.parse().


REQUIRED OUTPUT JSON SCHEMA (MANDATORY):
{
  "primaryTool": "string",
  "secondaryTool": "string",
  "timeline": "string (e.g. 4–6 weeks)",
  "requiredSkills": ["string", "string"],
  "justification": "string"
}

FIELD DEFINITIONS:
- primaryTool: Main automation technology best suited (e.g. Automation Anywhere, UiPath, Python, Blue Prism, Work fusion, Pega)
- secondaryTool: Supporting or complementary technology
- timeline: Estimated delivery timeline
- requiredSkills: Key skills required
- justification: Short business & technical reasoning

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

    /* -------------------------
       OpenAI Call
    -------------------------- */
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

    /* -------------------------
       Clean + Parse JSON safely
    -------------------------- */
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

/* Utility: raw body reader */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}