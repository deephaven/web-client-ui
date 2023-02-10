// Import the module and set it on the window so the shim still work for now
const apiUrl = `${import.meta.env.VITE_CORE_API_URL}/${
  import.meta.env.VITE_CORE_API_NAME
}`;
try {
  const dhModule = await import(/* @vite-ignore */ apiUrl);
  globalThis.dh = dhModule.default;
} catch (e) {
  document.getElementById('root')?.insertAdjacentHTML(
    'afterbegin',
    `<div class="modal d-block">
      <div class="modal-dialog modal-dialog-centered theme-bg-light">
        <div class="modal-content">
          <div class="modal-body">
            <h5 class="modal-title">Error: Unable to load API</h5>
            <p class="text-break">Ensure the server is running and you are able to reach ${apiUrl}, then refresh the page.</p>
          </div>
        </div>
      </div>
    </div>`
  );
}

export default globalThis.dh;
