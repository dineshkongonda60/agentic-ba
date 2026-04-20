document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("processForm");
  const output = document.getElementById("output");

  // ✅ Guard clause (this is the key fix)
  if (!form || !output) {
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await fetch("/api/analyzeProcess", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();
      output.textContent = JSON.stringify(data, null, 2);

    } catch (err) {
      console.error(err);
      output.textContent = "❌ Failed to analyze process";
    }
  });
});
