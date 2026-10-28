// The cover owns its click handler before the rest of the game is loaded.
function loadGame() {
  const target = new URL('app.js', import.meta.url);
  target.search = new URL(import.meta.url).search;
  return import(target.href);
}
export function installEntrance(doc, load = loadGame) {
  const button = doc.querySelector('#enter-game'), status = doc.querySelector('#entry-status');
  const label = button.innerHTML;
  let loading = false;
  const enter = async () => {
    if (loading) return;
    loading = true; button.disabled = true; button.textContent = '正在进入…';
    status.hidden = true; status.textContent = '';
    try {
      const game = await load();
      game.enterGame();
    } catch (error) {
      status.textContent = '暂时无法进入，请重试或刷新页面。'; status.hidden = false;
      console.error('SEAMLOOM could not start:', error);
    } finally {
      loading = false; button.disabled = false; button.innerHTML = label;
    }
  };
  button.addEventListener('click', enter);
  return () => button.removeEventListener('click', enter);
}
installEntrance(document);
setTimeout(() => document.querySelector('#boot-fade')?.remove(), 900);
