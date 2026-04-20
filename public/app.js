document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded");

  /* ======================================================
     UPLOAD.HTML FLOW (Form-based, multipart/FormData)
     ====================================================== */

  const uploadForm = document.getElementById("processForm");
  const uploadOutput = document.getElementById("output");

  if (uploadForm && uploadOutput) {
    console.log("✅ Upload page detected (processForm found)");

    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("✅ Upload form submitted");

      const formData = new FormData(uploadForm);

      try {
        console.log("🚀 Sending FormData to /api/analyzeProcess");

        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          body: formData
        });

        console.log("📡 Response received:", res);

        if (!res.ok) {
          throw new Error(`Backend error: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Parsed API response:", data);

        uploadOutput.textContent = JSON.stringify(data, null, 2);

      } catch (err) {
        console.error("❌ Upload flow error:", err);
        uploadOutput.textContent = "❌ Failed to analyze process";
      }
    });
  } else {
    console.log("ℹ️ Upload form not present on this page");
  }

  /* ======================================================
     INDEX.HTML FLOW (Button-based, JSON)
     ====================================================== */

  const analyzeBtn = document.getElementById("analyzeBtn");

  if (analyzeBtn) {
    console.log("✅ Index page detected (Analyze button found)");

    analyzeBtn.addEventListener("click", async () => {
      console.log("✅ Analyze button clicked");

      const payload = {
        processName: document.getElementById("processName")?.value || "",
        processDescription:
          document.getElementById("processDescription")?.value || "",
        ocrRequired: document.getElementById("ocrRequired")?.value || "",
        decisionNature: document.getElementById("decisionNature")?.value || "",
        volume: document.getElementById("volume")?.value || "",
        resources: document.getElementById("resources")?.value || "",
        applications: [],
        skills: []
      };

      console.log("📦 Payload to be sent:", payload);

      try {
        console.log("🚀 Sending JSON to /api/analyzeProcess");

        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        console.log("📡 Response received:", res);

        if (!res.ok) {
          throw new Error(`Backend error: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Parsed API response:", data);

        // ✅ Update UI safely
        document.getElementById("primaryTool").textContent =
          data.primaryTool || "N/A";

        document.getElementById("secondaryTool").textContent =
          data.secondaryTool || "N/A";

        document.getElementById("timeline").textContent =
          data.timeline || "N/A";

        document.getElementById("comparison").textContent =
          data.justification || JSON.stringify(data, null, 2);

      } catch (err) {
        console.error("❌ Index flow error:", err);
        alert("❌ Failed to analyze process. Please check logs.");
      }
    });
  } else {
    console.log("ℹ️ Analyze button not present on this page");
  }
});