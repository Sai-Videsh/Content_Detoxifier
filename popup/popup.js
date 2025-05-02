chrome.storage.local.get(['keywords', 'approvedCreators', 'strictMode', 'viewLimit'], function(result) {
  document.getElementById('keywords').value = result.keywords || '';
  document.getElementById('creators').value = result.approvedCreators || '';
  document.getElementById('strictMode').checked = result.strictMode || false;
  document.getElementById('viewLimit').value = result.viewLimit || 500;
});

document.getElementById('save').addEventListener('click', () => {
  const settings = {
    keywords: document.getElementById('keywords').value,
    approvedCreators: document.getElementById('creators').value,
    strictMode: document.getElementById('strictMode').checked,
    viewLimit: parseInt(document.getElementById('viewLimit').value)
  };
  chrome.storage.local.set(settings, () => {
    alert('Settings saved! Refresh YouTube/Instagram to apply.');
  });
});

fetch(chrome.runtime.getURL('data/suggestions.json'))
  .then(response => {
    if (!response.ok) throw new Error('Failed to load suggestions');
    return response.json();
  })
  .then(keywordSuggestions => {
    document.getElementById('suggest').addEventListener('click', () => {
      const interest = document.getElementById('interest').value.toLowerCase();
      const suggestions = keywordSuggestions[interest] || ['#general', 'explore', 'learn'];
      const ul = document.getElementById('suggestions');
      ul.innerHTML = '';
      suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.className = 'p-2 hover:bg-gray-200 cursor-pointer';
        li.addEventListener('click', () => {
          const current = document.getElementById('keywords').value;
          document.getElementById('keywords').value = current ? `${current}, ${suggestion}` : suggestion;
        });
        ul.appendChild(li);
      });
    });
  })
  .catch(error => {
    console.error('Error loading suggestions:', error);
    const ul = document.getElementById('suggestions');
    ul.innerHTML = '<li class="p-2 text-red-600">Failed to load suggestions</li>';
  });

chrome.storage.local.get(['analytics'], function(result) {
  const analytics = result.analytics || { timeSpent: 0, keywordsUsed: {} };
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(analytics.keywordsUsed),
      datasets: [{
        label: 'Shorts/Reels Watched',
        data: Object.values(analytics.keywordsUsed),
        backgroundColor: '#10b981'
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  let timeSpent = 0;
  setInterval(() => {
    if (window.location.href.includes('youtube.com') || window.location.href.includes('instagram.com')) {
      timeSpent += 1;
      chrome.storage.local.get(['analytics', 'keywords'], result => {
        const analytics = result.analytics || { timeSpent: 0, keywordsUsed: {} };
        analytics.timeSpent += 1;
        const keywords = result.keywords ? result.keywords.split(',').map(k => k.trim()) : [];
        keywords.forEach(k => {
          analytics.keywordsUsed[k] = (analytics.keywordsUsed[k] || 0) + 1;
        });
        chrome.storage.local.set({ analytics });
      });
    }
  }, 1000);
});