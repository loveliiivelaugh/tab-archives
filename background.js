// background.js

// Listen for messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "archive_tabs") {
        archiveTabs(request.scope).then(sendResponse);
        return true; // Keep the message channel open for async response
    }
});

/**
 * Archives tabs based on the scope ('window' or 'all').
 * @param {string} scope - 'window' for current window, 'all' for all windows.
 */
async function archiveTabs(scope) {
    try {
        const queryOptions = scope === 'window' ? { currentWindow: true } : {};
        const tabs = await chrome.tabs.query(queryOptions);

        // Filter out internal extension pages to avoid closing the history page itself if it's open?
        // Actually, we might want to archive everything except the extension's own pages.
        const validTabs = tabs.filter(t => !t.url.startsWith('chrome-extension://') && !t.pinned);

        if (validTabs.length === 0) {
            return { status: "no_tabs", count: 0 };
        }

        const session = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            name: `Session - ${new Date().toLocaleString()}`,
            tabCount: validTabs.length,
            tabs: validTabs.map(t => ({
                url: t.url,
                title: t.title,
                favIconUrl: t.favIconUrl
            }))
        };

        // Save to storage
        const data = await chrome.storage.local.get("archives");
        const archives = data.archives || [];
        archives.unshift(session); // Add new session to the top
        await chrome.storage.local.set({ archives });

        // Close the tabs safely
        const tabIds = validTabs.map(t => t.id);
        await chrome.tabs.remove(tabIds);

        // Open history page to show what was just archived
        chrome.tabs.create({ url: "history.html" });

        return { status: "success", count: validTabs.length };
    } catch (error) {
        console.error("Archiving failed:", error);
        return { status: "error", message: error.message };
    }
}
