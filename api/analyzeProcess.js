import formidable from "formidable";
import fs from "fs";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

/**
 * IMPORTANT: Disable default body parsing
 * because we handle multipart manually
 */
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
    /* -------------------------------------------
       1️⃣ Parse multipart OR JSON
    -------------------------------------------- */
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const form = new formidable.IncomingForm();

      const parsed = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });

      input = parsed.fields;

      /* -------------------------------------------
         2️⃣ File Detection & Extraction
      -------------------------------------------- */
      if (parsed.files?.process_file) {
        const file = parsed.files.process_file;
        const filePath = file.filepath;
        const ext = file.originalFilename
          .split(".")
          .pop()
          .toLowerCase();

        try {
          if (ext === "docx") {
            const result = await mammoth.extractRawText({
              path: filePath
            });
            extractedText = result.value;
          } else if (ext === "pdf") {
            const buffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text;
          } else if (["png", "jpg", "jpeg"].includes(ext)) {
            extractedText =
              "Image uploaded. OCR processing will be handled via Vision API in a future phase.";
          }
        } catch (err) {
          console.error("Extraction error:", err);
          extractedText = "Failed to extract document content.";
        }
      }
    } else {
      /* -------------------------------------------
         JSON fallback
      -------------------------------------------- */
      input = req.body;
    }

    /* -------------------------------------------
       3️⃣ Normalize extracted text
    -------------------------------------------- */
    extractedText = extractedText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 3000)
      .join("\n");

    /* -------------------------------------------
       4️⃣ Prompts
    -------------------------------------------- */
    const systemPrompt = `
You are an Automation Suitability and Estimation Agent for Business Analysts.
Rules:
1. Recommend ONLY the top 2 automation tools.
2. Provide realistic timelines (weeks/days).
3. List required skills per tool.
4. Provide short justification.
5. Respond ONLY in valid JSON.
`;

    const userPrompt = `
Process Name: ${input.processName || "N/A"}
Process Description:
${input.processDescription || input.process_summary || "Not provided"}

Applications:
${(input.applications || []).join(", ") || "Not specified"}

OCR Required: ${input.ocrRequired || "Unknown"}
Decision Nature: ${input.decisionNature || "Unknown"}
Volume: ${input.volume || "Unknown"}
Resources: ${input.resources || "Unknown"}

Available Skills:
${(input.skills || []).join(", ") || "Not specified"}

AS‑IS Document Content:
${extractedText || "No document provided"}
`;

    /* -------------------------------------------
       5️⃣ Agent (OpenAI) Call
    -------------------------------------------- */
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
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
    const result = JSON.parse(content);

    return res.status(200).json(result);

  } catch (err) {
    console.error("Agent Error:", err);
    return res.status(500).json({
      error: "Agent execution failed",
      details: err.message
    });
  }
}