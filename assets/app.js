// Config opcional Supabase
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SUPABASE_TABLE = "assessments";

const EXCLUSIVE_GROUPS = [
  new Set(["1a","1b","1c"]),
  new Set(["4a","4b","4c"]),
  new Set(["6a","6b","6c"]),
  new Set(["7a","7b"]),
  new Set(["8a","8b","8c"]),
];

function numberToComma(n){
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function renderCatalog(filter=""){
  const grid = document.getElementById('catalogGrid');
  const order = window.NAS_ORDER || Object.keys(window.NAS_CATALOG);
  const q = (filter||"").trim().toLowerCase();

  const items = order
    .map(code => [code, window.NAS_CATALOG[code]])
    .filter(([code, meta]) => !!meta)
    .filter(([code, meta]) => !q || code.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q));

  grid.innerHTML = items.map(([code, meta], idx) => `
    <label class="item" data-idx="${idx}">
      <input type="checkbox" value="${code}" data-nas>
      <strong>${code}</strong> ${meta.label} <em>(${meta.weight})</em>
    </label>`
  ).join("");
}

function getSelectedCodes(){
  return Array.from(document.querySelectorAll('input[type=checkbox][data-nas]:checked')).map(cb => cb.value);
}

function validateExclusive(codes){
  const s = new Set(codes);
  const conflicts = [];
  for (const g of EXCLUSIVE_GROUPS){
    const chosen = Array.from(s).filter(c => g.has(c));
    if (chosen.length > 1) conflicts.push(chosen);
  }
  return conflicts;
}

function computeScore(codes){
  return codes.reduce((acc, code) => acc + (window.NAS_CATALOG[code]?.weight || 0), 0);
}

function showValidation(conflicts){
  const box = document.getElementById('validationBox');
  if (conflicts.length === 0){
    box.style.display = 'none';
    box.innerHTML = "";
  } else {
    box.style.display = 'block';
    box.innerHTML = "<strong>Conflictos de selección:</strong> " + conflicts.map(c=>c.join(", ")).join(" | ");
  }
}

function refreshSummary(){
  const codes = getSelectedCodes();
  showValidation(validateExclusive(codes));
  const total = computeScore(codes);
  document.getElementById('totalScore').textContent = numberToComma(total);
}

function loadHistory(){
  const el = document.getElementById('history');
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  if (rows.length === 0){
    el.innerHTML = "<p class='muted'>Aún no hay registros locales.</p>";
    return;
  }
  const table = [`<table><thead><tr><th>Fecha</th><th>Identificador</th><th>Turno</th><th>Puntaje</th><th>Ítems</th><th>Nota</th></tr></thead><tbody>`];
  for (const r of rows){
    table.push(`<tr><td>${r.created_at}</td><td>${r.identifier||"—"}</td><td>${r.shift||"—"}</td><td>${numberToComma(r.total_score)}</td><td>${r.codes.join(", ")}</td><td>${r.note||"—"}</td></tr>`);
  }
  table.push("</tbody></table>");
  el.innerHTML = table.join("");
}

function appendHistory(row){
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  rows.unshift(row);
  localStorage.setItem('nas_history', JSON.stringify(rows));
  loadHistory();
}

function exportCSV(){
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  if (rows.length === 0) return alert("No hay datos para exportar.");
  const headers = ["created_at","identifier","shift","total_score","codes","note"];
  const csv = [headers.join(",")].concat(rows.map(r => [
    r.created_at,
    `"${(r.identifier||"").replace(/"/g,'""')}"`,
    `"${(r.shift||"").replace(/"/g,'""')}"`,
    (r.total_score ?? 0),
    `"${r.codes.join(" ").replace(/"/g,'""')}"`,
    `"${(r.note||"").replace(/"/g,'""')}"`
  ].join(","))).join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nas_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function setDefaultDateTime(){
  const f = document.getElementById('nasForm');
  if(!f.created_at.value){
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    f.created_at.value = local;
  }
}

document.addEventListener("change", e => {
  if (e.target.matches('input[type=checkbox][data-nas]')) refreshSummary();
});

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
  setDefaultDateTime();
  refreshSummary();
  loadHistory();

  document.getElementById("exportCsv").addEventListener("click", exportCSV);
  document.getElementById("dupLast").addEventListener("click", () => {
    const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
    if(rows.length === 0){ alert("No hay registros previos que duplicar."); return; }
    const r = rows[0];
    const f = document.getElementById('nasForm');
    f.identifier.value = r.identifier || "";
    f.shift.value = r.shift || "Día";
    f.note.value = r.note || "";
    if (r.created_at) f.created_at.value = r.created_at.replace(" ", "T");
    // restore selection
    const prev = r.codes || [];
    document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
      cb.checked = prev.includes(cb.value);
    });
    refreshSummary();
  });

  document.getElementById("printBtn").addEventListener("click", () => window.print());

  document.getElementById("searchBox").addEventListener("input", (e)=>{
    const prev = getSelectedCodes();
    renderCatalog(e.target.value);
    document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
      cb.checked = prev.includes(cb.value);
    });
    refreshSummary();
  });

  document.getElementById("nasForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const codes = getSelectedCodes();
    const conflicts = validateExclusive(codes);
    if (conflicts.length){
      alert("Hay conflictos en grupos exclusivos: " + conflicts.map(c=>c.join(", ")).join(" | "));
      return;
    }
    const row = {
      created_at: (f.created_at.value || new Date().toISOString().slice(0,16)).replace("T"," "),
      identifier: f.identifier.value,
      shift: f.shift.value,
      note: f.note.value,
      codes,
      total_score: codes.reduce((acc, c) => acc + (window.NAS_CATALOG[c]?.weight || 0), 0),
    };
    appendHistory(row);
    f.reset();
    renderCatalog(); // limpia selección
    setDefaultDateTime();
    refreshSummary();
    alert("Evaluación guardada (historial local).");
  });
});
