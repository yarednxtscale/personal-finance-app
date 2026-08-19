const addImportButton = () => {
  const heading = [...document.querySelectorAll('.card h3')].find((el) => el.textContent.trim() === 'Data export');
  const card = heading?.closest('.card');
  if (!card || card.dataset.csvLauncher === '1') return;

  card.dataset.csvLauncher = '1';
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';
  actions.innerHTML = '<button class="btn btn-primary" id="settings-import-csv">Import CSV</button>';
  card.appendChild(actions);

  actions.querySelector('#settings-import-csv').addEventListener('click', async () => {
    try {
      const mod = await import('/finance-csv-v2.js');
      if (mod?.openImport) {
        await mod.openImport();
      } else if (window.financeHubCsv?.openImport) {
        await window.financeHubCsv.openImport();
      }
    } catch (error) {
      console.error('CSV importer failed to load', error);
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = 'Could not open CSV importer.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2600);
    }
  });
};

const observer = new MutationObserver(addImportButton);
observer.observe(document.body, { childList: true, subtree: true });
addImportButton();
