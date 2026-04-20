document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded");

  const analyzeBtn = document.getElementById("analyzeBtn");

  if (!analyzeBtn) {
    console.warn("Analyze button not found on this page");
    return;
  }

  analyzeBtn.addEventListener("click", async () => {
    console.log("✅ Analyze button clicked");

    const payload = {
      processName: document.getElementById("processName")?.value || "",
      processDescription:
        document.getElementById("processDescription")?.value || "",
      ocrRequired: document.getElementById("ocrRequired")?.value || "",
      decisionNature: document.getElementById("decisionNature")?.value || "",
      volume: document.getElementById("volume")?.value || "",
      resources: document.getElementById("resources")?.value || ""
    };

    console.log("📦 Payload:", payload);

    try {
      const res = await fetch("/api/analyzeProcess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      console.log("📡 Status:", res.status);

      const text = await res.text();
      console.log("📄 Raw response:", text);

      const data = JSON.parse(text);

      if (data.error) {
        alert(`❌ ${data.details || data.error}`);
        return;
      }

      document.getElementById("primaryTool").textContent =
        data.primaryTool || "N/A";
      document.getElementById("secondaryTool").textContent =
        data.secondaryTool || "N/A";
      document.getElementById("timeline").textContent =
        data.timeline || "N/A";
      document.getElementById("comparison").textContent =
        data.justification || "No explanation provided";

    } catch (err) {
      console.error("Client error:", err);
      alert("❌ Failed to analyze process");
    }
  });
});