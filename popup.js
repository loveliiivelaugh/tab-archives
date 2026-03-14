// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const archiveWindowBtn = document.getElementById('archiveWindow');
    const archiveAllBtn = document.getElementById('archiveAll');

    if (archiveWindowBtn) {
        archiveWindowBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: "archive_tabs", scope: "window" }, (response) => {
                if (response && response.status === "success") {
                    window.close(); // Close popup on success
                }
            });
        });
    }

    if (archiveAllBtn) {
        archiveAllBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: "archive_tabs", scope: "all" }, (response) => {
                if (response && response.status === "success") {
                    window.close();
                }
            });
        });
    }
});
