// Keep Trash Bin pinned to the bottom without altering navigation behavior.
const style = document.createElement('style');
style.id = 'trash-bottom-fix';
style.textContent = `.nav button[data-trash-bin]{margin-top:auto !important;order:999 !important}`;
document.head.appendChild(style);
