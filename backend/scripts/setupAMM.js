#!/usr/bin/env node

/**
 * Minimal AMM Setup
 * Creates RLUSD issuer + AMM pool with hardcoded StudyToken issuer
 */

const xrpl = require("xrpl");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const XRPL_WS = "wss://s.altnet.rippletest.net:51233";
const TESTNET_FAUCET = "https://faucet.altnet.rippletest.net/accounts";

let client;

async function fundFromFaucet(address) {
  console.log(`💰 Funding ${address}...`);
  try {
    const response = await fetch(TESTNET_FAUCET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: address })
    });
    const data = await response.json();
    if (data.result?.tx_json?.hash) {
      console.log(`✅ Funded`);
      await new Promise(r => setTimeout(r, 6000)); // Wait 6 seconds for ledger
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Faucet error: ${error.message}`);
    return false;
  }
}

async function submitTransaction(tx, wallet, client, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${retries}...`);
      const result = await client.submitAndWait(tx, { wallet }, {
        maxLedgerVersionOffset: 30
      });
      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        return result;
      } else {
        throw new Error(result.result.meta.TransactionResult);
      }
    } catch (error) {
      if (attempt < retries) {
        console.log(`   ⏳ Retrying in 8 seconds...`);
        await new Promise(r => setTimeout(r, 8000));
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  try {
    console.log("\n🚀 Minimal AMM Setup\n");

    // Connect
    client = new xrpl.Client(XRPL_WS);
    await client.connect();
    console.log("✅ Connected to XRPL testnet\n");

    // 1. Create RLUSD issuer
    console.log("Step 1: Creating RLUSD issuer...");
    const rlusdIssuer = xrpl.Wallet.generate();
    console.log(`   Address: ${rlusdIssuer.address}`);
    await fundFromFaucet(rlusdIssuer.address);

    // Configure USD issuer
    console.log("   ⚙️  Enabling DefaultRipple for USD issuer...");
    await new Promise(r => setTimeout(r, 4000)); // Wait before transaction
    const configUSD = {
      TransactionType: "AccountSet",
      Account: rlusdIssuer.address,
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
    };
    await submitTransaction(configUSD, rlusdIssuer, client);
    console.log("   ✅ USD issuer configured");

    // 2. Use existing student wallet as liquidity provider
    const studentWallet = xrpl.Wallet.fromSeed(process.env.STUDENT_SECRET || "sEd7rBGm5kxzauRTAV2hbsa3UHm");
    console.log(`\nStep 2: Using student wallet: ${studentWallet.address}`);
    await fundFromFaucet(studentWallet.address);

    // 3. Hardcoded StudyToken issuer (reusing pattern from existing code)
    const studyTokenIssuer = xrpl.Wallet.generate();
    console.log(`\nStep 3: Creating StudyToken issuer...\n   Address: ${studyTokenIssuer.address}`);
    await fundFromFaucet(studyTokenIssuer.address);

    // Configure STK issuer
    console.log("   ⚙️  Enabling DefaultRipple for STK issuer...");
    await new Promise(r => setTimeout(r, 4000)); // Wait before transaction
    const configSTK = {
      TransactionType: "AccountSet",
      Account: studyTokenIssuer.address,
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
    };
    await submitTransaction(configSTK, studyTokenIssuer, client);
    console.log("   ✅ STK issuer configured");

    // Step 4: Issue tokens
    console.log("\nStep 4: Setting up trustlines and issuing tokens...");
    await new Promise(r => setTimeout(r, 4000)); // Wait before transactions

    // USD trustline (3-char code instead of RLUSD)
    const usdTrust = {
      TransactionType: "TrustSet",
      Account: studentWallet.address,
      LimitAmount: { currency: "USD", issuer: rlusdIssuer.address, value: "1000000" }
    };
    await submitTransaction(usdTrust, studentWallet, client);
    console.log("   ✅ USD trustline created");

    // Issue USD
    const issueUSD = {
      TransactionType: "Payment",
      Account: rlusdIssuer.address,
      Destination: studentWallet.address,
      Amount: { currency: "USD", issuer: rlusdIssuer.address, value: "10000" }
    };
    await submitTransaction(issueUSD, rlusdIssuer, client);
    console.log("   ✅ Issued 10,000 USD");

    // STK trustline (3-char code instead of StudyToken)
    const stkTrust = {
      TransactionType: "TrustSet",
      Account: studentWallet.address,
      LimitAmount: { currency: "STK", issuer: studyTokenIssuer.address, value: "1000000" }
    };
    await submitTransaction(stkTrust, studentWallet, client);
    console.log("   ✅ STK trustline created");

    // Issue STK
    const issueSTK = {
      TransactionType: "Payment",
      Account: studyTokenIssuer.address,
      Destination: studentWallet.address,
      Amount: { currency: "STK", issuer: studyTokenIssuer.address, value: "25000" }
    };
    await submitTransaction(issueSTK, studyTokenIssuer, client);
    console.log("   ✅ Issued 25,000 STK");

    // 5. Create AMM pool
    console.log("\nStep 5: Creating AMM pool (2.5k USD : 5k STK)...");
    await new Promise(r => setTimeout(r, 8000)); // Extra wait before AMM creation

    const ammCreate = {
      TransactionType: "AMMCreate",
      Account: studentWallet.address,
      Amount: { currency: "USD", issuer: rlusdIssuer.address, value: "2500" },
      Amount2: { currency: "STK", issuer: studyTokenIssuer.address, value: "5000" },
      TradingFee: 30 // 0.3%
    };

    const ammRes = await submitTransaction(ammCreate, studentWallet, client, 4);
    if (ammRes.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`AMM creation failed: ${ammRes.result.meta.TransactionResult}`);
    }

    console.log(`   ✅ AMM transaction hash: ${ammRes.result.hash}`);
    console.log(`   ✅ Ledger index: ${ammRes.result.ledger_index}`);

    // Get AMM ID using amm_info (query by asset pair)
    console.log("   🔍 Querying AMM by asset pair...");
    await new Promise(r => setTimeout(r, 4000)); // Wait for AMM to be indexed

    const ammInfo = await client.request({
      command: "amm_info",
      asset: {
        currency: "USD",
        issuer: rlusdIssuer.address
      },
      asset2: {
        currency: "STK",
        issuer: studyTokenIssuer.address
      },
      ledger_index: "validated"
    });

    const ammId = ammInfo.result.amm.account;
    console.log(`   ✅ Found AMM account: ${ammId}`);

    // 6. Save to .env
    console.log("\nStep 6: Saving to .env...");
    const envContent = `
# AMM Configuration (USD ↔ STK pool)
AMM_ID=${ammId}
USD_ISSUER=${rlusdIssuer.address}
STK_ISSUER=${studyTokenIssuer.address}
USD_SECRET=${rlusdIssuer.privateKey}
STK_SECRET=${studyTokenIssuer.privateKey}
`;
    fs.appendFileSync(path.join(__dirname, "../.env"), envContent);
    console.log("   ✅ Saved to .env\n");

    console.log("✅ Setup Complete!");
    console.log(`\nAMM Pool ID: ${ammId}`);
    console.log(`USD Issuer: ${rlusdIssuer.address}`);
    console.log(`STK Issuer: ${studyTokenIssuer.address}`);
    console.log(`Student Wallet: ${studentWallet.address}`);
    console.log(`\nNext: Restart backend and test pricing endpoint`);
    console.log(`GET http://localhost:3001/api/amm/price?amountIn=100&token=USD\n`);

    await client.disconnect();
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
