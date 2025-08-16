// Optional Supabase config
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

// Group mapping: Section title -> codes predicate
const GROUPS = [
  { key: "1", title: "1. Monitorización y balance", match: code => /^1[abc]$/.test(code) },
  { key: "2", title: "2. Control de exámenes", match: code => code === "2" },
  { key: "3", title: "3. Medicación", match: code => code === "3" },
  { key: "4", title: "4. Higiene y procedimientos", match: code => /^4[abc]$/.test(code) },
  { key: "5", title: "5. Drenajes", match: code => code === "5" },
  { key: "6", title: "6. Movilización", match: code => /^6[abc]$/.test(code) },
  { key: "7", title: "7. Apoyo a familia/paciente", match: code => /^7[ab]$/.test(code) },
  { key: "8", title: "8. Administrativas", match: code => /^8[abc]$/.test(code) },
  { key: "9", title: "9. Asistencia respiratoria", match: code => code === "9" },
  { key: "10", title: "10. Vía aérea artificial", match: code => code === "10" },
  { key: "11", title: "11. Mejoría función pulmonar", match: code => code === "11" },
  { key: "12", title: "12. Vasoactivos", match: code => code === "12" },
  { key: "13", title: "13. Reposición IV >3 L/día", match: code => code === "13" },
  { key: "14", title: "14. Monitoreo hemodinámico avanzado", match: code => code === "14" },
  { key: "15", title: "15. RCP últimas 24h", match: code => code === "15" },
  { key: "16", title: "16. Hemofiltración/diálisis", match: code => code === "16" },
  { key: "17", title: "17. Diuresis cuantitativa", match: code => code === "17" },
  { key: "18", title: "18. PIC", match: code => code === "18" },
  { key: "19", title: "19. Trastornos ácido-base", match: code => code === "19" },
  { key: "20", title: "20. NPT central", match: code => code === "20" },
  { key: "21", title: "21. Alimentación enteral", match: code => code === "21" },
  { key: "22", title: "22. Intervenciones UCI (24h)", match: code => code === "22" },
  { key: "23", title: "23. Intervenciones fuera UCI", match: code => code === "23" },
];

function numberToComma(n){
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function getSelectedCodes(){
  return Array.from(document.querySelectorAll('input[type=checkbox][data-nas]:checked')).map(cb => cb.value);
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

function renderGroups(filter=""){
  const container = document.getElementById('catalogGroups');
  const q = filter.trim().toLowerCase();
  const entries = Object.entries(window.NAS_CATALOG).sort(([a],[b])=>a.localeCompare(b));

  let html = "";
  for (const g of GROUPS){
    const items = entries.filter(([code, meta]) => g.match(code) && (!q || code.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q)));
    if (items.length === 0) continue;
    html += `<details class="group" open><summary>${g.title}</summary><div class="grid">`;
    html += items.map(([code, meta]) => `
      <label class="item">
        <input type="checkbox" data-nas value="${code}">
        <strong>${code}</strong> ${meta.label} <em>(${meta.weight})</em>
      </label>`).join("");
    html += `</div></details>`;
  }
  container.innerHTML = html;
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
  const table = [`<table><thead><tr><th>Fecha</th><th>Paciente</th><th>ID</th><th>Unidad</th><th>Turno</th><th>Puntaje</th><th>Ítems</th><th>Nota</th></tr></thead><tbody>`];
  for (const r of rows){
    table.push(`<tr><td>${r.created_at}</td><td>${r.patient_name}</td><td>${r.identifier||"—"}</td><td>${r.unit||"—"}</td><td>${r.shift||"—"}</td><td>${numberToComma(r.total_score)}</td><td>${r.codes.join(", ")}</td><td>${r.note||"—"}</td></tr>`);
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
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ return { ok:false, message:"Supabase no configurado." }; }
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
  const headers = ["created_at","patient_name","identifier","unit","shift","total_score","codes","note"];
  const csv = [headers.join(",")].concat(rows.map(r => [
    r.created_at,
    `"${(r.patient_name||"").replace(/"/g,'""')}"`,
    `"${(r.identifier||"").replace(/"/g,'""')}"`,
    `"${(r.unit||"").replace(/"/g,'""')}"`,
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

function setFormValues(row){
  const f = document.getElementById('nasForm');
  f.patient_name.value = row.patient_name || "";
  f.identifier.value = row.identifier || "";
  f.unit.value = row.unit || "";
  f.shift.value = row.shift || "Día";
  f.note.value = row.note || "";
  f.created_at.value = row.created_at ? row.created_at.replace(" ", "T") : "";
  // Restore selections
  document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
    cb.checked = row.codes && row.codes.includes(cb.value);
  });
  refreshSummary();
}

function duplicateLast(){
  const rows = JSON.parse(localStorage.getItem('nas_history') || "[]");
  if(rows.length === 0){ alert("No hay registros previos que duplicar."); return; }
  setFormValues(rows[0]);
}

function setDefaultDateTime(){
  const f = document.getElementById('nasForm');
  if(!f.created_at.value){
    // default local time without seconds
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
  renderGroups();
  setDefaultDateTime();
  refreshSummary();
  loadHistory();

  document.getElementById("exportCsv").addEventListener("click", exportCSV);
  document.getElementById("dupLast").addEventListener("click", duplicateLast);
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  document.getElementById("searchBox").addEventListener("input", (e)=>{
    const prev = getSelectedCodes();
    renderGroups(e.target.value);
    // restore selection
    document.querySelectorAll('input[type=checkbox][data-nas]').forEach(cb=>{
      cb.checked = prev.includes(cb.value);
    });
    refreshSummary();
  });

  document.getElementById("toggleAll").addEventListener("change", (e)=>{
    const details = document.querySelectorAll('.group');
    details.forEach(d => d.open = (e.target.value === "expand"));
  });

  document.getElementById("nasForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const codes = getSelectedCodes();
    const conflicts = validateExclusive(codes);
    if (conflicts.length){
      alert("Hay conflictos en grupos exclusivos: " + conflicts.map(c=>c.join(", ")).join(" | "));
      return;
    }

    // date-time from input or now if empty
    let created_at = f.created_at.value;
    if(!created_at){
      const now = new Date();
      created_at = now.toISOString().slice(0,16); // UTC
    } else {
      // Keep as local format YYYY-MM-DDTHH:mm -> store as "YYYY-MM-DD HH:mm"
    }
    const created_display = created_at.replace("T", " ");

    const row = {
      created_at: created_display,
      patient_name: f.patient_name.value,
      identifier: f.identifier.value,
      unit: f.unit.value,
      shift: f.shift.value,
      note: f.note.value,
      codes,
      total_score: computeScore(codes),
    };

    appendHistory(row);

    // Optional Supabase save
    // const result = await saveToSupabase(row);
    // if(!result.ok){ alert(result.message); }

    f.reset();
    renderGroups(); // re-render to clear checkboxes
    setDefaultDateTime();
    refreshSummary();
    alert("Evaluación guardada (historial local).");
  });
});
