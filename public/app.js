document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded");

  /* -----------------------------------------
     UPLOAD.HTML (Form-based flow)
  ------------------------------------------ */
  const uploadForm = document.getElementById("processForm");
  const uploadOutput = document.getElementById("output");

  if (uploadForm && uploadOutput) {
    console.log("✅ Upload form detected");

    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("✅ Upload form submitted");

      const formData = new FormData(uploadForm);

      try {
        console.log("🚀 Calling /api/analyzeProcess (upload)");

        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        uploadOutput.textContent = JSON.stringify(data, null, 2);

      } catch (err) {
        console.error("❌ Upload flow error:", err);
        uploadOutput.textContent = "❌ Failed to analyze process";
      }
    });
  }

  /* -----------------------------------------
     INDEX.HTML (Button-based flow)
  ------------------------------------------ */
  const analyzeBtn = document.getElementById("analyzeBtn");

  if (analyzeBtn) {
    console.log("✅ Index Analyze button detected");

    analyzeBtn.addEventListener("click", async () => {
      console.log("✅ Analyze button clicked");

      const payload = {
        processName: document.getElementById("processName")?.value,
        processDescription: document.getElementById("processDescription")?.value,
        ocrRequired: document.getElementById("ocrRequired")?.value,
        decisionNature: document.getElementById("decisionNature")?.value,
        volume: document.getElementById("volume")?.value,
        resources: document.getElementById("resources")?.value
      };

      console.log("📦 Payload:", payload);

      try {
        console.log("🚀 Calling /api/analyzeProcess (index)");

        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("✅ API response:", data);

        document.getElementById("primaryTool").textContent =
          data.primaryTool || "N/A";
        document.getElementById("secondaryTool").textContent =
          data.secondaryTool || "N/A";
        document.getElementById("timeline").textContent =
          data.timeline || "N/A";
        document.getElementById("comparison").textContent =
          data.justification || "No reasoning provided";

      } catch (err) {
        console.error("❌ Index flow error:", err);
        alert("Failed to analyze process");
      }
    });
  }
});
