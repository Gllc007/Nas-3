function renderCatalog(){
  const grid=document.getElementById('catalogGrid');
  const entries=Object.entries(window.NAS_CATALOG);
  grid.innerHTML=entries.map(([c,m])=>`
    <label class="item">
      <input type="checkbox" value="${c}" data-weight="${m.weight}">
      <strong>${c}</strong> ${m.label} (${m.weight})
    </label>`).join("");
}
function compute(){
  const boxes=document.querySelectorAll('#catalogGrid input:checked');
  let total=0;
  boxes.forEach(b=>total+=parseFloat(b.dataset.weight));
  document.getElementById('totalScore').innerText=total.toFixed(1);
}
document.addEventListener('DOMContentLoaded',()=>{
  renderCatalog();
  document.getElementById('catalogGrid').addEventListener('change',compute);
});
