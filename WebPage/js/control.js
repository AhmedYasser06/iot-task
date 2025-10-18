// ===== Elements =====
const range = document.getElementById("rangeInput");
const display = document.getElementById("valueDisplay");
const lampIcon = document.getElementById('lampIcon');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const connectionStatus = document.getElementById('connectionStatus');

// ===== WebSocket Connection =====
const HOST = location.origin.replace(/^http/, "ws");
const ws = new WebSocket(HOST);

let isLocalChange = false; // prevent echo loops

// ===== Visual Update Function =====
function updateLampBrightness(value) {
    const percentage = (value / 255) * 100;
    
    if (value == 0) {
        lampIcon.style.filter = 'grayscale(100%)';
        lampIcon.style.opacity = '0.3';
    } else {
        lampIcon.style.filter = `brightness(${100 + percentage}%) drop-shadow(0 0 ${percentage/5}px #ffd700)`;
        lampIcon.style.opacity = '1';
    }
}

// ===== Update Connection Status =====
function updateConnectionStatus(status, message, alertClass) {
    statusText.textContent = message;
    connectionStatus.className = `alert alert-${alertClass} text-center`;
    statusIcon.textContent = status;
}

// ===== Range Input Event Listener =====
range.addEventListener("input", () => {
    const value = range.value;
    display.textContent = value;
    updateLampBrightness(value);

    // Mark that this change came from user interaction
    isLocalChange = true;

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "range", value: value }));
    }
});

// ===== WebSocket Event Handlers =====
ws.onopen = () => {
    console.log("✅ Connected to server");
    updateConnectionStatus("✅", "Connected to server", "success");
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.type === "rangeUpdate") {
            // Only update if the change came from another client
            if (!isLocalChange) {
                range.value = data.value;
                display.textContent = data.value;
                updateLampBrightness(data.value);
            }
            isLocalChange = false; // reset after applying
        }
    } catch (err) {
        console.log("📩 Message from server:", event.data);
    }
};

ws.onclose = () => {
    console.log("❌ Connection closed");
    updateConnectionStatus("❌", "Connection closed - Trying to reconnect...", "warning");
    
    // Try to reconnect after 3 seconds
    setTimeout(() => {
        location.reload();
    }, 3000);
};

ws.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
    updateConnectionStatus("⚠️", "Connection error - Check your server", "danger");
};

// ===== Button Control Function =====
function setLight(value) {
    range.value = value;
    display.textContent = value;
    updateLampBrightness(value);
    
    // Send to server
    isLocalChange = true;
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "range", value: value }));
    }
}

// ===== Initialize on page load =====
window.addEventListener('load', () => {
    updateLampBrightness(range.value);
});
