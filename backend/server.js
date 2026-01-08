//Entry point
const app = require("./app");
const { initXRPL } = require("./utils/xrpl");
const PORT = process.env.PORT || 3001;

// Start server immediately, initialize XRPL asynchronously so network/connect
// issues won't block the server from accepting requests during local dev.
function start() {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    // Initialize XRPL in background. If it fails, just log and continue.
    initXRPL()
        .then((client) => {
            if (client) console.log('✅ XRPL initialized');
            else console.warn('⚠️ XRPL initialization returned no client (running without XRPL).');
        })
        .catch((err) => {
            console.warn('⚠️ XRPL init failed (continuing without XRPL):', err && err.message ? err.message : err);
        });
}

start();