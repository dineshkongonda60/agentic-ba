document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded");

  let applicationsMS = null;
  let skillsMS = null;

  /* ======================================================
     INDEX.HTML ONLY – Initialize multi-selects safely
     ====================================================== */
  if (
    typeof createMultiSelect === "function" &&
    document.getElementById("applicationsSelect") &&
    document.getElementById("skillsSelect")
  ) {
    console.log("✅ Initializing multi-select components");

    applicationsMS = createMultiSelect("applicationsSelect", [
      "SAP",
      "Oracle",
      "Email",
      "Excel",
      "SharePoint",
      "Web Portal"
    ]);

    skillsMS = createMultiSelect("skillsSelect", [
      "Automation Anywhere",
      "UiPath",
      "Python",
      "SAP Integration",
      "Document Automation",
      "AI / ML"
    ]);
  } else {
    console.log("ℹ️ Multi-select not required on this page");
  }

  /* ======================================================
     INDEX.HTML – Analyze button logic
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
        applications: applicationsMS ? applicationsMS.getSelected() : [],
        skills: skillsMS ? skillsMS.getSelected() : []
      };

      console.log("📦 Payload:", payload);

      try {
        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log("📄 Raw response:", text);

        const data = JSON.parse(text);

        // ✅ Show results
        const results = document.querySelector(".results");
        if (results) results.style.display = "block";

        document.getElementById("primaryTool").textContent =
          data.primaryTool || "N/A";
        document.getElementById("secondaryTool").textContent =
          data.secondaryTool || "N/A";
        document.getElementById("timeline").textContent =
          data.timeline || "N/A";
        document.getElementById("comparison").textContent =
          data.justification || "No justification provided";

        const skillsList = document.getElementById("requiredSkills");
        if (skillsList) {
          skillsList.innerHTML = "";
          (data.requiredSkills || []).forEach(skill => {
            const li = document.createElement("li");
            li.textContent = skill;
            skillsList.appendChild(li);
          });
        }

        // ✅ Always-visible debug fallback
        const raw = document.getElementById("agentRawOutput");
        if (raw) raw.textContent = JSON.stringify(data, null, 2);

      } catch (err) {
        console.error("❌ Analyze error:", err);
        alert("❌ Failed to analyze process");
      }
    });
  }

  /* ======================================================
     UPLOAD.HTML – Form-based logic (NO multiselect)
     ====================================================== */
  const uploadForm = document.getElementById("processForm");
  const uploadOutput = document.getElementById("output");

  if (uploadForm && uploadOutput) {
    console.log("✅ Upload page detected");

    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(uploadForm);

      try {
        const res = await fetch("/api/analyzeProcess", {
          method: "POST",
          body: formData
        });

        uploadOutput.textContent = await res.text();
      } catch (err) {
        console.error(err);
        uploadOutput.textContent = "❌ Upload analysis failed";
      }
    });
  }
});