document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded");

  /* ======================================================
     INDEX.HTML – Button-based flow (JSON)
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
        applications: getSelectedValues("applicationsSelect"),
        skills: getSelectedValues("skillsSelect")
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

        console.log("📡 Response status:", res.status);

        const responseText = await res.text();
        console.log("📄 Raw response text:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (err) {
          console.error("❌ JSON parse error:", err);
          alert("Backend returned invalid JSON. Check logs.");
          return;
        }

        console.log("✅ Parsed API response:", data);

        if (data.error) {
          alert(`❌ ${data.details || data.error}`);
          return;
        }

        /* ---------- Render results ---------- */

        document.getElementById("primaryTool").textContent =
          data.primaryTool || "N/A";

        document.getElementById("secondaryTool").textContent =
          data.secondaryTool || "N/A";

        document.getElementById("timeline").textContent =
          data.timeline || "N/A";

        const skillsList = document.getElementById("requiredSkills");
        if (skillsList) {
          skillsList.innerHTML = "";
          (data.requiredSkills || []).forEach(skill => {
            const li = document.createElement("li");
            li.textContent = skill;
            skillsList.appendChild(li);
          });
        }

        document.getElementById("comparison").textContent =
          data.justification || "No justification provided";

      } catch (err) {
        console.error("❌ Index flow error:", err);
        alert("❌ Failed to analyze process. See console for details.");
      }
    });
  }

  /* ======================================================
     UPLOAD.HTML – Form-based flow (FormData)
     ====================================================== */

  const uploadForm = document.getElementById("processForm");
  const uploadOutput = document.getElementById("output");

  if (uploadForm && uploadOutput) {
    console.log("✅ Upload page detected");

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

        const responseText = await res.text();
        console.log("📄 Raw response text:", responseText);

        uploadOutput.textContent = responseText;

      } catch (err) {
        console.error("❌ Upload flow error:", err);
        uploadOutput.textContent = "❌ Failed to analyze process";
      }
    });
  }

  /* ======================================================
     Helper Functions
     ====================================================== */

  function getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];

    return Array.from(container.querySelectorAll(".selected"))
      .map(el => el.textContent.trim());
  }
});
