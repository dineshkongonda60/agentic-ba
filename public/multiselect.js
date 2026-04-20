function createMultiSelect(containerId, optionsList) {
  const container = document.getElementById(containerId);
  let selected = [];
  let options = [...optionsList]; // allow dynamic additions

  container.innerHTML = `
    <div class="selected-items">
      <span class="placeholder">Select or type to add…</span>
    </div>
    <div class="dropdown">
      <input type="text" placeholder="Search or add..." />
      <div class="options"></div>
    </div>
  `;

  const selectedBox = container.querySelector(".selected-items");
  const dropdown = container.querySelector(".dropdown");
  const searchInput = dropdown.querySelector("input");
  const optionsDiv = dropdown.querySelector(".options");

  function renderOptions(filter = "") {
    optionsDiv.innerHTML = "";

    const filtered = options.filter(opt =>
      opt.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(opt => {
      const div = document.createElement("div");
      div.className = "option";
      div.textContent = opt;

      if (selected.includes(opt)) {
        div.classList.add("disabled");
      }

      div.onclick = () => addItem(opt);
      optionsDiv.appendChild(div);
    });

    // If typed value not found → show "Add"
    if (filter && !options.some(o => o.toLowerCase() === filter.toLowerCase())) {
      const addNew = document.createElement("div");
      addNew.className = "option";
      addNew.textContent = `Add "${filter}"`;
      addNew.onclick = () => addItem(filter, true);
      optionsDiv.appendChild(addNew);
    }
  }

  function addItem(value, isNew = false) {
    if (!selected.includes(value)) {
      selected.push(value);

      if (isNew) {
        options.push(value); // permanently add
      }

      renderSelected();
      renderOptions(searchInput.value);
    }

    searchInput.value = "";
  }

  function renderSelected() {
    selectedBox.innerHTML = "";

    if (!selected.length) {
      selectedBox.innerHTML = `<span class="placeholder">Select or type to add…</span>`;
      return;
    }

    selected.forEach(val => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.innerHTML = `${val} <span>×</span>`;
      chip.querySelector("span").onclick = () => {
        selected = selected.filter(s => s !== val);
        renderSelected();
        renderOptions(searchInput.value);
      };
      selectedBox.appendChild(chip);
    });
  }

  selectedBox.onclick = () => container.classList.toggle("open");

  searchInput.oninput = () => renderOptions(searchInput.value);

  searchInput.onkeydown = (e) => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      e.preventDefault();
      addItem(searchInput.value.trim(), true);
    }
  };

  document.addEventListener("click", e => {
    if (!container.contains(e.target)) container.classList.remove("open");
  });

  renderOptions();

  // ✅ Exposed API (for document auto‑populate later)
  return {
    getSelected: () => selected,
    setSelected: (items) => {
      items.forEach(i => {
        if (!options.includes(i)) options.push(i);
        if (!selected.includes(i)) selected.push(i);
      });
      renderSelected();
      renderOptions();
    }
  };
}
