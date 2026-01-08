const xrpl = require('xrpl');
require('dotenv').config();

async function setupStudentWallet() {
  const client = new xrpl.Client(process.env.XRPL_WS);
  await client.connect();
  
  const studentWallet = xrpl.Wallet.fromSeed(process.env.STUDENT_SECRET);
  const USD_ISSUER = process.env.USD_ISSUER;
  const STK_ISSUER = process.env.STK_ISSUER;
  const issuerWallet = xrpl.Wallet.fromSeed(process.env.ISSUER_SECRET); // Use ISSUER_SECRET instead

  console.log("Setting up wallet for A1234567Z:", studentWallet.address);

  // 1. Set trustline for USD
  console.log("\n1️⃣ Creating USD trustline...");
  const usdTrustSet = {
    TransactionType: "TrustSet",
    Account: studentWallet.address,
    LimitAmount: {
      currency: "USD",
      issuer: USD_ISSUER,
      value: "1000000"
    }
  };
  await client.submitAndWait(usdTrustSet, { wallet: studentWallet });
  console.log("✅ USD trustline created");

  // 2. Set trustline for STK
  console.log("\n2️⃣ Creating STK trustline...");
  const stkTrustSet = {
    TransactionType: "TrustSet",
    Account: studentWallet.address,
    LimitAmount: {
      currency: "STK",
      issuer: STK_ISSUER,
      value: "1000000"
    }
  };
  await client.submitAndWait(stkTrustSet, { wallet: studentWallet });
  console.log("✅ STK trustline created");

  // 3. Get USD from AMM pool by depositing issuer tokens
  console.log("\n3️⃣ Depositing to AMM to get LP tokens, then withdrawing USD...");
  
  // Send some tokens from issuer wallet directly
  const payment = {
    TransactionType: "Payment",
    Account: issuerWallet.address,
    Destination: studentWallet.address,
    Amount: {
      currency: "USD",
      issuer: USD_ISSUER,
      value: "500"
    }
  };
  
  await client.submitAndWait(payment, { wallet: issuerWallet });
  console.log("✅ 500 USD sent to student");

  console.log("\n🎉 A1234567Z wallet ready for AMM swaps!");
  await client.disconnect();
}

setupStudentWallet().catch(console.error);

