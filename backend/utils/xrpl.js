//XRPL connection
// backend/utils/xrpl.js
const xrpl = require("xrpl");
let client = null;

async function initXRPL() {
    const ws = process.env.XRPL_WS || "wss://s.altnet.rippletest.net:51233";
    client = new xrpl.Client(ws);
    try {
        await client.connect();
        console.log("✅ Connected to XRPL Testnet at", ws);
        return client;
    } catch (err) {
        console.warn("⚠️ Could not connect to XRPL testnet:", err.message);
        console.warn("Continuing without XRPL connection (dev mode). Some features will be disabled.");
        client = null;
        return null;
    }
}

async function getBalance(address) {
    if (!client) throw new Error("XRPL client not connected");
    
    try {
        const response = await client.request({
            command: "account_info",
            account: address,
            ledger_index: "validated"
        });
        
        if (response.result && response.result.account_data && response.result.account_data.Balance) {
            const balance = parseInt(response.result.account_data.Balance) / 1000000; // Convert drops to XRP
            return balance;
        } else {
            throw new Error("Account not found or invalid response structure");
        }
    } catch (error) {
        console.error("❌ XRPL getBalance error:", error.message);
        throw new Error(`Failed to get balance: ${error.message}`);
    }
}

module.exports = { initXRPL, client: () => client, getBalance };