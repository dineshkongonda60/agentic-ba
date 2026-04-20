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

    console.log("📡 Response received:");
    console.log("➡ Status:", res.status, res.statusText);
    console.log("➡ Headers:", [...res.headers.entries()]);

    const responseText = await res.text();
    console.log("📄 Raw response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("❌ Failed to parse JSON:", parseErr);
      alert("Backend returned non‑JSON response. Check logs.");
      return;
    }

    console.log("✅ Parsed API response:", data);

    if (data.error) {
      alert(`❌ Agent error: ${data.details || data.error}`);
      return;
    }

    document.getElementById("primaryTool").textContent =
      data.primaryTool || "N/A";
    document.getElementById("secondaryTool").textContent =
      data.secondaryTool || "N/A";
    document.getElementById("timeline").textContent =
      data.timeline || "N/A";
    document.getElementById("comparison").textContent =
      data.justification || "No justification";

  } catch (err) {
    console.error("❌ Index flow error:", err);
    alert("❌ Failed to analyze process. See console for details.");
  }
});