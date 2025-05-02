chrome.storage.local.get(['keywords', 'approvedCreators', 'strictMode', 'viewLimit'], function(result) {
  const keywords = result.keywords ? result.keywords.split(',').map(k => k.trim().toLowerCase()) : [];
  const approvedCreators = result.approvedCreators ? result.approvedCreators.split(',').map(c => c.trim().toLowerCase()) : [];
  const strictMode = result.strictMode || false;
  const viewLimit = result.viewLimit || 5;
  let viewedCount = 0;

  if (keywords.length === 0) return;

  function filterContent() {
    const selectors = {
      youtube: 'ytd-reel-shelf-renderer, ytd-rich-item-renderer',
      instagram: 'article, div._ab1k'
    };
    const items = document.querySelectorAll(selectors.youtube + ',' + selectors.instagram);

    items.forEach(item => {
      const title = item.querySelector('#video-title, h3, h4')?.textContent.toLowerCase() || '';
      const description = item.querySelector('.metadata-snippet-container, div._a9zs')?.textContent.toLowerCase() || '';
      const creator = item.querySelector('a.yt-simple-endpoint, span._aacl')?.textContent.toLowerCase() || '';

      const hasMatch = keywords.some(keyword => {
        const cleanKeyword = keyword.startsWith('#') ? keyword.slice(1) : keyword;
        const isExclusion = keyword.startsWith('-');
        if (isExclusion) {
          return !title.includes(cleanKeyword.slice(1)) && !description.includes(cleanKeyword.slice(1));
        }
        if (strictMode) {
          return title.includes(cleanKeyword) || description.includes(cleanKeyword);
        }
        return title.includes(cleanKeyword.split(' ')[0]) || description.includes(cleanKeyword.split(' ')[0]);
      });

      const isApprovedCreator = approvedCreators.includes(creator);
      if (hasMatch || isApprovedCreator) {
        item.style.display = 'block';
        if (isApprovedCreator) {
          item.parentNode.prepend(item);
          item.style.border = '2px solid #10b981';
        }
      } else {
        item.style.display = 'none';
      }
    });
  }

  function checkViewLimit() {
    viewedCount++;
    if (viewedCount >= viewLimit) {
      const modal = document.createElement('div');
      modal.style = 'position: fixed; top: 20%; left: 20%; width: 60%; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 1000;';
      modal.innerHTML = `
        <h3>Time to reflect!</h3>
        <p>You've watched ${viewLimit} Shorts/Reels. Keep going or take a break?</p>
        <button onclick="this.parentNode.remove();">Continue</button>
        <button onclick="window.close();">Close Tab</button>
      `;
      document.body.appendChild(modal);
      viewedCount = 0;
    }
  }

  let timeout;
  function debouncedFilter() {
    clearTimeout(timeout);
    timeout = setTimeout(filterContent, 100);
  }

  filterContent();
  const observer = new MutationObserver(debouncedFilter);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('scroll', checkViewLimit);
});