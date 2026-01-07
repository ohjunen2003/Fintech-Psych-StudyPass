const express = require("express");
const { client: getClient, getBalance } = require("../utils/xrpl");
const router = express.Router();

router.get("/balance/:address", async (req, res) => {
  try {
    const balance = await getBalance(req.params.address);
    res.json({
      success: true,
      address: req.params.address,
      balance: balance,
      currency: "XRP",
      network: "testnet"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/account/:address", async (req, res) => {
  try {
    const client = getClient();
    const response = await client.request({
      command: "account_info",
      account: req.params.address,
      ledger_index: "validated"
    });
    
    res.json({
      success: true,
      account: response.result.account_data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;