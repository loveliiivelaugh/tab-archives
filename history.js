// history.js

document.addEventListener('DOMContentLoaded', () => {
    loadSessions();

    document.getElementById('clearHistory').addEventListener('click', clearAllHistory);
    document.getElementById('exportHistory').addEventListener('click', exportHistory);
    document.getElementById('searchInput').addEventListener('input', filterTabs);
});

async function loadSessions() {
    const data = await chrome.storage.local.get("archives");
    const archives = data.archives || [];
    const container = document.getElementById('sessionsList');
    const emptyState = document.getElementById('emptyState');

    container.innerHTML = '';
    container.appendChild(emptyState); // Keep empty state in DOM but hidden/shown

    if (archives.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    archives.forEach((session, index) => {
        const card = createSessionCard(session, index);
        container.appendChild(card);
    });
}

function createSessionCard(session, index) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.dataset.id = session.id; // Helpful for deletion

    const date = new Date(session.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    card.innerHTML = `
        <div class="session-header">
            <div class="session-info">
                <span class="session-title">${session.name || 'Archived Session'}</span>
                <span class="session-meta">${session.tabCount} tabs • ${dateStr}</span>
            </div>
            <div class="session-actions">
                <button class="btn-restore" onclick="restoreSession('${session.id}')">Restore All</button>
                <button class="btn-delete-session" onclick="deleteSession(${index})" title="Delete Session">&times;</button>
            </div>
        </div>
        <ul class="tabs-list">
            ${session.tabs.map(tab => createTabItem(tab)).join('')}
        </ul>
    `;

    // Add event listeners for the buttons inside this card (to avoid inline onclick quirks if possible, 
    // but for simplicity inline onclick calling global functions is easier in vanilla JS extensions 
    // IF we attach them to window. However, CSP might block inline scripts.
    // Better to attach listeners dynamically.)

    // Actually, inline onclick strings in innerHTML are often blocked by Content Security Policy (CSP) in V3. 
    // We must attach via standard DOM methods.

    // Re-creating the structure properly with createElement to avoid CSP issues:
    // ... For brevity I used innerHTML above but I will fix the event listeners below.

    // Let's use the innerHTML for structure but replace the buttons with real elements if we want to be safe, 
    // or just traverse and add listeners.

    const restoreBtn = card.querySelector('.btn-restore');
    restoreBtn.removeAttribute('onclick');
    restoreBtn.addEventListener('click', () => restoreSession(session));

    const deleteBtn = card.querySelector('.btn-delete-session');
    deleteBtn.removeAttribute('onclick');
    deleteBtn.addEventListener('click', () => deleteSession(index));

    // Add click listeners for tabs to restore single tab
    const tabLinks = card.querySelectorAll('.tab-item');
    tabLinks.forEach((link, i) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: session.tabs[i].url, active: false });
        });
    });

    return card;
}

function createTabItem(tab) {
    // Sanitizing HTML output is important, but assuming trusted data from own extension for now.
    // Using a template string for the inner HTML of the list item.
    // The actual Click handler is attached in createSessionCard to avoid inline JS.

    const favicon = tab.favIconUrl || 'icons/icon16.png'; // Fallback needed? 
    // Note: accessing favIconUrl might require permissions or might remain valid if cached.

    return `
        <li>
            <a href="${tab.url}" class="tab-item" title="${tab.url}">
                <img src="${favicon}" class="tab-icon" onerror="this.src='data:image/svg+xml;base64,...'"> 
                <span class="tab-title">${escapeHtml(tab.title)}</span>
                <span class="tab-url">${escapeHtml(tab.url)}</span>
            </a>
        </li>
    `;
}

async function restoreSession(session) {
    if (!session || !session.tabs) return;

    // Create new window with the first tab
    if (session.tabs.length > 0) {
        const firstTab = session.tabs[0];
        const newWindow = await chrome.windows.create({ url: firstTab.url, focused: true });

        // Open the rest
        for (let i = 1; i < session.tabs.length; i++) {
            await chrome.tabs.create({ windowId: newWindow.id, url: session.tabs[i].url });
        }
    }
}

async function deleteSession(index) {
    if (!confirm("Are you sure you want to delete this session?")) return;

    const data = await chrome.storage.local.get("archives");
    const archives = data.archives || [];

    if (index >= 0 && index < archives.length) {
        archives.splice(index, 1);
        await chrome.storage.local.set({ archives });
        loadSessions(); // Re-render
    }
}

async function clearAllHistory() {
    if (!confirm("Delete all history? This cannot be undone.")) return;
    await chrome.storage.local.set({ archives: [] });
    loadSessions();
}

function filterTabs(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.session-card');

    cards.forEach(card => {
        const tabs = card.querySelectorAll('li');
        let hasVisibleTabs = false;

        tabs.forEach(tab => {
            const title = tab.querySelector('.tab-title').textContent.toLowerCase();
            const url = tab.querySelector('.tab-url').textContent.toLowerCase();

            if (title.includes(query) || url.includes(query)) {
                tab.style.display = '';
                hasVisibleTabs = true;
            } else {
                tab.style.display = 'none';
            }
        });

        // Hide the whole card if no tabs match
        card.style.display = hasVisibleTabs ? '' : 'none';
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function exportHistory() {
    const data = await chrome.storage.local.get("archives");
    const archives = data.archives || [];

    const blob = new Blob([JSON.stringify(archives, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `tab-archiver-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

