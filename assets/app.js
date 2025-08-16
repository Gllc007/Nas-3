// --- Config opcional (Supabase) ---
const SUPABASE_URL = "";        // ej: https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = "";   // anon key del proyecto
const SUPABASE_TABLE = "assessments";

// --- Lógica del formulario NAS ---
const EXCLUSIVE_GROUPS = [
  new Set(["1a","1b","1c"]),
  new Set(["4a","4b","4c"]),
  new Set(["6a","6b","6c"]),
  new Set(["7a","7b"]),
  new Set(["8a","8b","8c"]),
];

function byCode(a,b){ return a[0].localeCompare(b[0]); }

function renderCatalog(){
  const grid = document.getElementById('catalogGrid');
  const entries = Object.entries(window.NAS_CATALOG).sort(byCode);
  grid.innerHTML = entries.map(([code, meta]) => `
    <label class="item">
      <input type="checkbox" value="${code}" data-weight="${meta.weight}">
      <strong>${code}</strong> ${meta.label} <em>(${meta.weight})</em>
    </label>`
  ).join("");
}

function getSelectedCodes(){
  return Array.from(document.querySelectorAll('#catalogGrid input[type=checkbox]:checked'))
    .map(cb => cb.value);
}

function validateExclusive(codes){
  const s = new Set(codes);
  const conflicts = [];
  for (const group of EXCLUSIVE_GROUPS){
    const chosen = Array.from(s).filter(c => group.has(c));
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
  document.getElementById('totalScore').textContent = total.toFixed(1);
}

function loadHistory(){
  const el = document.getElementById('history');
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  if (rows.length === 0){
    el.innerHTML = "<p class='muted'>Aún no hay registros locales.</p>";
    return;
  }
  const table = [`<table><thead><tr><th>Fecha</th><th>Paciente</th><th>ID</th><th>Puntaje</th><th>Ítems</th><th>Nota</th></tr></thead><tbody>`];
  for (const r of rows){
    table.push(`<tr><td>${r.created_at}</td><td>${r.patient_name}</td><td>${r.identifier||"—"}</td><td>${r.total_score}</td><td>${r.codes.join(", ")}</td><td>${r.note||"—"}</td></tr>`);
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

async function saveToSupabase(row){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
    return { ok:false, message:"Supabase no configurado." };
  }
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(row)
    });
    if(!res.ok){
      const msg = await res.text();
      return { ok:false, message:`Error Supabase: ${res.status} ${msg}` };
    }
    const data = await res.json();
    return { ok:true, data };
  }catch(err){
    return { ok:false, message: err.message };
  }
}

function exportCSV(){
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  if (rows.length === 0) return alert("No hay datos para exportar.");
  const headers = ["created_at","patient_name","identifier","total_score","codes","note"];
  const csv = [headers.join(",")].concat(rows.map(r => [
    r.created_at,
    `"${(r.patient_name||"").replace(/"/g,'""')}"`,
    `"${(r.identifier||"").replace(/"/g,'""')}"`,
    r.total_score,
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

document.addEventListener("change", e => {
  if (e.target.closest("#catalogGrid")) refreshSummary();
});

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
  refreshSummary();
  loadHistory();
  document.getElementById("exportCsv").addEventListener("click", exportCSV);

  document.getElementById("nasForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const row = {
      created_at: new Date().toISOString().slice(0,16).replace("T"," "),
      patient_name: fd.get("patient_name"),
      identifier: fd.get("identifier"),
      note: fd.get("note"),
      codes: getSelectedCodes(),
      total_score: parseFloat(document.getElementById('totalScore').textContent)
    };

    const conflicts = validateExclusive(row.codes);
    if (conflicts.length){
      alert("Hay conflictos en grupos exclusivos: " + conflicts.map(c=>c.join(", ")).join(" | "));
      return;
    }
    appendHistory(row);

    // Guardado central (opcional)
    // const result = await saveToSupabase(row);
    // if(!result.ok){ alert(result.message); }

    e.target.reset();
    document.querySelectorAll('#catalogGrid input[type=checkbox]').forEach(cb=>cb.checked=false);
    refreshSummary();
    alert("Evaluación guardada (historial local).");
  });
});
