const EXCLUSIVE_SETS = [
  new Set(["1a","1b","1c"]),
  new Set(["4a","4b","4c"]),
  new Set(["6a","6b","6c"]),
  new Set(["7a","7b"]),
  new Set(["8a","8b","8c"]),
];

function numberToComma(n){
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function isExclusive(code){
  return EXCLUSIVE_SETS.some(set => set.has(code));
}

function renderCatalog(){
  const grid = document.getElementById('catalogGrid');
  const order = window.NAS_ORDER || Object.keys(window.NAS_CATALOG);
  const items = order.map(code => [code, window.NAS_CATALOG[code]]).filter(([c,m])=>!!m);
  grid.innerHTML = items.map(([code, meta]) => `
    <label class="item ${isExclusive(code)?'exclusive':''}" data-code="${code}">
      <span class="badge">${isExclusive(code)?'Excluyente':''}</span>
      <input type="checkbox" value="${code}" data-nas>
      <strong>${code}</strong> ${meta.label} <em>(${meta.weight})</em>
    </label>`).join("");
}

function getSelectedCodes(){
  return Array.from(document.querySelectorAll('input[type=checkbox][data-nas]:checked')).map(cb => cb.value);
}

function exclusiveAuto(e){
  const code = e.target.value;
  for (const group of EXCLUSIVE_SETS){
    if (group.has(code)){
      document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
        if (cb.value !== code && group.has(cb.value)) cb.checked = false;
      });
      break;
    }
  }
}

function computeScore(codes){
  return codes.reduce((acc, code) => acc + (window.NAS_CATALOG[code]?.weight || 0), 0);
}

function refreshSummary(){
  const codes = getSelectedCodes();
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
  const table = [`<table><thead><tr><th>Fecha</th><th>Identificador</th><th>Turno</th><th>Paciente</th><th>Unidad</th><th>Puntaje</th><th>Ítems</th><th>Nota</th></tr></thead><tbody>`];
  for (const r of rows){
    table.push(`<tr><td>${r.created_at}</td><td>${r.identifier||"—"}</td><td>${r.shift||"—"}</td><td>${r.patient_status||"N/A"}</td><td>${r.unit||"—"}</td><td>${numberToComma(r.total_score)}</td><td>${r.codes.join(", ")}</td><td>${r.note||"—"}</td></tr>`);
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
  const headers = ["created_at","identifier","shift","patient_status","unit","total_score","codes","note"];
  const csv = [headers.join(",")].concat(rows.map(r => [
    r.created_at,
    `"${(r.identifier||"").replace(/"/g,'""')}"`,
    `"${(r.shift||"").replace(/"/g,'""')}"`,
    `"${(r.patient_status||"N/A").replace(/"/g,'""')}"`,
    `"${(r.unit||"—").replace(/"/g,'""')}"`,
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
  if (e.target.matches('input[type=checkbox][data-nas]')){
    exclusiveAuto(e);
    refreshSummary();
  }
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
    f.patient_status.value = r.patient_status || "N/A";
    f.unit.value = r.unit || "UCI";
    if (r.created_at) f.created_at.value = r.created_at.replace(" ", "T");
    const prev = r.codes || [];
    document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
      cb.checked = prev.includes(cb.value);
    });
    refreshSummary();
  });

  document.getElementById("printBtn").addEventListener("click", () => window.print());

  document.getElementById("nasForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const codes = getSelectedCodes();
    const row = {
      created_at: (f.created_at.value || new Date().toISOString().slice(0,16)).replace("T"," "),
      identifier: f.identifier.value,
      shift: f.shift.value,
      patient_status: f.patient_status.value || "N/A",
      unit: f.unit.value || "UCI",
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

function getSelectedCodes(){
  return Array.from(document.querySelectorAll('input[type=checkbox][data-nas]:checked')).map(cb => cb.value);
}
