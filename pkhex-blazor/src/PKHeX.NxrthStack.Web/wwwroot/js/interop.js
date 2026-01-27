// PKHeX NxrthStack JavaScript Interop
// Handles communication between Blazor WASM and parent React app

window.PKHeXInterop = {
    // Notify parent frame of events
    notifyParent: function(type, payload) {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: type,
                    payload: payload
                }, '*');
            }
        } catch (e) {
            console.warn('Failed to notify parent:', e);
        }
    },

    // Download file to user's device
    downloadFile: function(byteArray, fileName) {
        const blob = new Blob([new Uint8Array(byteArray)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    // Read file as byte array (for programmatic file loading)
    readFileAsBytes: async function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result;
                const bytes = new Uint8Array(arrayBuffer);
                resolve(Array.from(bytes));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    // Copy text to clipboard
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.warn('Clipboard write failed:', e);
            return false;
        }
    }
};

// Listen for messages from parent React app
window.addEventListener('message', function(event) {
    // Handle messages from parent frame
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'REACT_LOAD_SAVE':
                // Future: Handle programmatic save loading from React
                console.log('Received save data from React');
                break;
            case 'REACT_REQUEST_EXPORT':
                // Future: Handle export request from React
                console.log('React requested save export');
                break;
        }
    }
});

// Notify parent when Blazor app is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure Blazor is initialized
    setTimeout(function() {
        window.PKHeXInterop.notifyParent('PKHEX_READY', { version: '1.0.0' });
    }, 100);
});
