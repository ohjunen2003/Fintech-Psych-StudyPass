//Entry point
const app = require("./app");
const { initXRPL } = require("./utils/xrpl");
const PORT = process.env.PORT || 3001;
async function start() {
    try {
        await initXRPL();
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
start();