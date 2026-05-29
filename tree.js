const DATA_URL = window.FAMILY_DATA_URL || "https://webcerise.github.io/forum-data/";

Promise.all([
  fetch(DATA_URL + "characters.json").then(r => r.json()),
  fetch(DATA_URL + "houses.json").then(r => r.json()),
  fetch(DATA_URL + "trees.json").then(r => r.json())
]).then(([characters, houses, trees]) => {
  renderAllFamilies(characters, houses, trees);
});

function renderAllFamilies(characters, houses, trees) {
  const root = document.querySelector("#family-root");
  if (!root) return;

  root.innerHTML = Object.keys(houses).map(houseId => {
    return renderHousePage(houseId, houses[houseId], trees[houseId], characters);
  }).join("");

  const menu = document.querySelector("#gtreeMenu");
if (menu) {
  menu.innerHTML = Object.keys(houses).map(houseId => `
    <a onclick="gtreeGo('fam-${houseId}')">
      <img src="${houses[houseId].sigil}">
      <span>${houses[houseId].name.replace("Maison ", "")}</span>
    </a>
  `).join("");
}

  document.querySelectorAll(".gtree-canvas").forEach(initCanvas);
}

function renderHousePage(houseId, house, tree, characters) {
  return `
    <div class="family-page" id="fam-${houseId}">
      <div class="house-banner">
        <img src="${house.sigil}">
        <div class="hb-txt">
          <h2>${house.name}</h2>
          <div class="motto">${house.motto}</div>
        </div>
      </div>

      <div class="gtree-canvas">
        <div class="gtree-camera">
          <ul class="tree">
            ${renderTreeNode(tree, characters)}
          </ul>
        </div>

        <div class="gtree-hint">glissez pour déplacer · molette pour zoomer</div>

        <div class="gtree-controls">
          <button onclick="gtreeZoom(this,0.15)">&plus;</button>
          <button onclick="gtreeZoom(this,0)">&#8634;</button>
          <button onclick="gtreeZoom(this,-0.15)">&minus;</button>
        </div>
      </div>
    </div>
  `;
}

function renderTreeNode(node, characters) {
  if (typeof node === "string") {
    return `
      <li>
        ${renderCharacter(characters[node])}
      </li>
    `;
  }

  if (node.type === "couple") {
    return `
      <li>
        <div class="couple">
          ${renderCharacter(characters[node.left])}
          <div class="bond">&#10084;</div>
          ${renderCharacter(characters[node.right])}
        </div>

        ${node.children ? renderChildren(node.children, characters) : ""}
      </li>
    `;
  }

  return "";
}

function renderChildren(children, characters) {
  return `
    <ul>
      ${children.map(child => renderTreeNode(child, characters)).join("")}
    </ul>
  `;
}

function renderCharacter(char) {
  if (!char) return "";

  const statusClass =
    char.status === "played" ? "played" :
    char.status === "libre" ? "libre" :
    char.status === "dead" ? "dead" :
    "";

  const nameHtml = `
    ${char.status === "dead" ? "&#10013; " : ""}${char.name}
    ${char.age !== undefined ? `<span class="age">(${char.age})</span>` : ""}
  `;

  return `
    <div class="node ${statusClass}">
      ${char.avatar ? `
        <span class="av">
          <img src="${char.avatar}" onerror="this.style.display='none'">
        </span>
      ` : ""}

      ${char.title ? `<span class="ttl">${char.title}</span>` : ""}

      ${char.profile ? `
        <a class="nm" href="${char.profile}" target="_blank">${nameHtml}</a>
      ` : `
        <span class="nm">${nameHtml}</span>
      `}

      ${char.epithet ? `<span class="epithet">${char.epithet}</span>` : ""}
      ${char.fc ? `<span class="fc">${char.fc}</span>` : ""}
      ${char.status === "libre" ? `<span class="free">Libre</span>` : ""}
      ${char.status === "pnj" ? `<span class="npc">PNJ</span>` : ""}
      ${char.status === "dead" ? `<span class="npc">PNJ · décédé</span>` : ""}
    </div>
  `;
}

function initCanvas(canvas) {
  const cam = canvas.querySelector(".gtree-camera");
  let s = 0.85;
  let tx = 0;
  let ty = 24;
  let drag = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    cam.style.transform = `translate(calc(-50% + ${tx}px), ${ty}px) scale(${s})`;
  }

  apply();

  canvas.addEventListener("mousedown", e => {
    if (e.target.closest(".gtree-controls") || e.target.closest("a")) return;
    drag = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    canvas.classList.add("grabbing");
  });

  window.addEventListener("mousemove", e => {
    if (!drag) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });

  window.addEventListener("mouseup", () => {
    drag = false;
    canvas.classList.remove("grabbing");
  });

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    s = Math.min(3, Math.max(0.3, s + (e.deltaY < 0 ? 0.1 : -0.1)));
    apply();
  }, { passive: false });

  canvas.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    drag = true;
    sx = e.touches[0].clientX - tx;
    sy = e.touches[0].clientY - ty;
  }, { passive: true });

  canvas.addEventListener("touchmove", e => {
    if (!drag || e.touches.length !== 1) return;
    tx = e.touches[0].clientX - sx;
    ty = e.touches[0].clientY - sy;
    apply();
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    drag = false;
  });

  canvas._zoom = function(d) {
    if (d === 0) {
      s = 0.85;
      tx = 0;
      ty = 24;
    } else {
      s = Math.min(3, Math.max(0.3, s + d));
    }

    apply();
  };
}

window.gtreeZoom = function(btn, d) {
  const c = btn.closest(".gtree-canvas");
  if (c && c._zoom) c._zoom(d);
};
