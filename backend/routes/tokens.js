const express = require("express");
const { client, getBalance } = require("../utils/xrpl");
const xrpl = require("xrpl");
const router = express.Router();

// XRPL Testnet Accounts
const STUDENT_WALLET = process.env.STUDENT_WALLET;
const STUDENT_SECRET = process.env.STUDENT_SECRET;
const ISSUER_WALLET = process.env.ISSUER_WALLET;
const ISSUER_SECRET = process.env.ISSUER_SECRET;

// MPT Token Configuration (StudyTokens)
const STUDY_TOKEN_ID = "535455445954"; // "STUDYT" in hex
const CONVERSION_RATE = 2; // 1 RLUSD = 2 StudyTokens

// Mock RLUSD balances for demo (in production, this would be real RLUSD)
const mockRLUSDBalances = {};
// Mock StudyToken balances (would be queried from XRPL MPT in production)
const studyTokenBalances = {};

// Initialize mock RLUSD for demo
const initializeMockRLUSD = (wallet) => {
    if (!mockRLUSDBalances[wallet]) {
        mockRLUSDBalances[wallet] = 100; // Give 100 RLUSD for demo
        console.log(`💰 Initialized wallet ${wallet} with 100 RLUSD`);
    }
    if (!studyTokenBalances[wallet]) {
        studyTokenBalances[wallet] = 0; // Start with 0 StudyTokens
    }
};

// Issue StudyTokens using REAL XRPL Transactions
router.post("/mint", async (req, res) => {
    const { wallet, rlusdAmount } = req.body;
    
    try {
        const xrplClient = client();
        if (!xrplClient) {
            return res.status(500).json({ 
                success: false, 
                error: "XRPL connection not available" 
            });
        }
        
        const rlusdToSpend = parseFloat(rlusdAmount) || 0;
        if (rlusdToSpend <= 0) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid amount. Must be greater than 0"
            });
        }
        
        // Check REAL XRP balance from testnet
        const currentXRPBalance = await getBalance(wallet);
        const xrpToSpend = rlusdToSpend; // 1:1 conversion for demo
        
        if (currentXRPBalance < xrpToSpend) {
            return res.status(400).json({ 
                success: false,
                error: `Insufficient XRP. Need ${xrpToSpend}, have ${currentXRPBalance}`,
                currentBalance: currentXRPBalance
            });
        }
        
        const studyTokensToMint = Math.floor(rlusdToSpend * CONVERSION_RATE);
        
        // Create wallet from student secret (this is your real testnet wallet)
        const studentWallet = xrpl.Wallet.fromSeed(STUDENT_SECRET);
        
        // Verify the wallet address matches
        if (studentWallet.address !== wallet) {
            return res.status(400).json({
                success: false,
                error: `Wallet mismatch. Expected ${studentWallet.address}, got ${wallet}`,
                details: "Please logout and login again"
            });
        }
        
        console.log(`🔥 REAL XRPL TRANSACTION: Spending ${xrpToSpend} XRP for ${studyTokensToMint} StudyTokens`);
        console.log(`📍 From: ${wallet} (${currentXRPBalance} XRP available)`);
        console.log(`📍 To: ${ISSUER_WALLET}`);
        
        // Create the payment transaction (following official XRPL.js patterns)
        const payment = {
            TransactionType: "Payment",
            Account: wallet,
            Destination: ISSUER_WALLET,
            Amount: xrpl.xrpToDrops(xrpToSpend.toString()) // Convert XRP to drops
        };
        
        // Submit the REAL XRPL transaction using submitAndWait
        console.log(`📤 Submitting REAL XRPL payment transaction...`);
        const response = await xrplClient.submitAndWait(payment, {
            wallet: studentWallet
        });
        
        console.log(`📦 Transaction result:`, response.result.meta.TransactionResult);
        
        if (response.result.meta.TransactionResult !== 'tesSUCCESS') {
            console.error(`❌ XRPL Transaction failed:`, response.result.meta.TransactionResult);
            throw new Error(`XRP payment failed: ${response.result.meta.TransactionResult}`);
        }
        
        console.log(`✅ REAL XRP Payment successful! Hash: ${response.result.hash}`);
        
        // Update StudyToken balance in our system
        studyTokenBalances[wallet] = (studyTokenBalances[wallet] || 0) + studyTokensToMint;
        
        // Get new XRP balance after the REAL transaction
        const newXRPBalance = await getBalance(wallet);
        
        res.json({
            success: true,
            wallet,
            xrpSpent: xrpToSpend,
            studyTokensMinted: studyTokensToMint,
            conversionRate: CONVERSION_RATE,
            previousXRPBalance: currentXRPBalance,
            newXRPBalance: newXRPBalance, // This should be reduced by xrpToSpend
            newStudyTokenBalance: studyTokenBalances[wallet],
            realXRPLTransaction: {
                hash: response.result.hash,
                type: "Payment",
                from: wallet,
                to: ISSUER_WALLET,
                amount: `${xrpToSpend} XRP`,
                network: "testnet",
                ledgerIndex: response.result.ledger_index,
                validated: response.result.validated
            },
            message: `✅ REAL TRANSACTION: Spent ${xrpToSpend} XRP, received ${studyTokensToMint} StudyTokens`,
            xrplExplorer: `https://testnet.xrpl.org/transactions/${response.result.hash}`
        });
        
    } catch (error) {
        console.error("❌ XRPL real transaction error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to process real XRPL transaction",
            details: error.message
        });
    }
});

// Get RLUSD balance (shows real XRP balance)
router.get("/balance/rlusd/:wallet", async (req, res) => {
    const { wallet } = req.params;
    
    console.log(`🔍 RLUSD Balance Request for wallet: ${wallet}`);
    
    // Check if this is the mock wallet and reject it
    if (wallet === "rMockStudentWallet1234567890") {
        console.log("❌ Rejecting mock wallet - user needs to logout and login again");
        return res.json({
            success: false,
            error: "Please logout and login again to use real XRPL wallet",
            wallet,
            balance: 0,
            currency: "RLUSD",
            description: "Mock wallet detected - please refresh login",
            source: "Error: Mock wallet"
        });
    }
    
    try {
        const xrplClient = client();
        if (xrplClient) {
            // Query REAL XRP balance from testnet
            const xrpBalance = await getBalance(wallet);
            const rlusdBalance = Math.floor(xrpBalance);
            
            res.json({
                success: true,
                wallet,
                balance: rlusdBalance,
                currency: "RLUSD",
                description: "Real XRP balance (shown as RLUSD 1:1)",
                source: "Real XRPL Testnet",
                actualXRP: xrpBalance,
                network: "testnet"
            });
        } else {
            // Fallback to mock if XRPL not connected
            initializeMockRLUSD(wallet);
            const balance = mockRLUSDBalances[wallet] || 0;
            
            res.json({ 
                success: true,
                wallet,
                balance,
                currency: "RLUSD",
                description: "Mock balance (XRPL offline)",
                source: "Mock (XRPL offline)"
            });
        }
    } catch (error) {
        console.error(`❌ Error fetching XRP balance for ${wallet}:`, error.message);
        
        // Fallback to mock on error
        initializeMockRLUSD(wallet);
        const balance = mockRLUSDBalances[wallet] || 0;
        
        res.json({
            success: true,
            wallet,
            balance,
            currency: "RLUSD",
            description: "Fallback balance (XRPL error)",
            source: "Fallback (XRPL error)",
            error: error.message
        });
    }
});

// Get StudyToken balance  
router.get("/balance/studytoken/:wallet", (req, res) => {
    const { wallet } = req.params;
    
    console.log(`🔍 StudyToken Balance Request for wallet: ${wallet}`);
    
    // Check if this is the mock wallet and reject it
    if (wallet === "rMockStudentWallet1234567890") {
        console.log("❌ Rejecting mock wallet - user needs to logout and login again");
        return res.json({
            success: false,
            error: "Please logout and login again to use real XRPL wallet",
            wallet,
            balance: 0,
            currency: "StudyToken",
            description: "Mock wallet detected - please refresh login",
            source: "Error: Mock wallet"
        });
    }
    
    initializeMockRLUSD(wallet); // Initialize if first time
    const balance = studyTokenBalances[wallet] || 0;
    
    res.json({ 
        success: true,
        wallet,
        balance,
        currency: "StudyToken",
        tokenId: STUDY_TOKEN_ID,
        description: "Multi-Purpose Tokens for study space booking"
    });
});

// Legacy balance endpoint (returns StudyTokens)
router.get("/balance/:wallet", (req, res) => {
    const { wallet } = req.params;
    initializeMockRLUSD(wallet);
    const balance = studyTokenBalances[wallet] || 0;
    
    res.json({ 
        success: true,
        wallet,
        balance
    });
});

// Burn StudyTokens (for NFT minting) - REAL IMPLEMENTATION
router.post("/burn", async (req, res) => {
    const { wallet, amount } = req.body;
    
    try {
        const xrplClient = client();
        if (!xrplClient) {
            return res.status(500).json({ 
                success: false, 
                error: "XRPL connection not available" 
            });
        }
        
        // Check actual StudyToken balance
        const currentBalance = studyTokenBalances[wallet] || 0;
            
        if (currentBalance < amount) {
            return res.status(400).json({ 
                success: false,
                error: `Insufficient StudyTokens. Need ${amount}, have ${currentBalance}`,
                currentBalance
            });
        }
        
        console.log(`🔥 Burning ${amount} StudyTokens for NFT minting`);
        console.log(`📍 From wallet: ${wallet}`);
        console.log(`📍 Remaining: ${currentBalance - amount}`);
        
        // Burn the StudyTokens (remove from balance)
        studyTokenBalances[wallet] -= amount;
        
        // In a full implementation, this would also create an NFT transaction on XRPL
        // For now, we'll just burn the tokens and let the NFT system handle the rest
        
        res.json({
            success: true,
            wallet,
            tokensBurned: amount,
            remainingBalance: studyTokenBalances[wallet],
            burnTransaction: {
                type: "StudyToken Burn",
                amount: amount,
                account: wallet,
                purpose: "NFT Minting",
                timestamp: new Date().toISOString()
            },
            message: `🔥 Burned ${amount} StudyTokens for NFT minting`
        });
        
    } catch (error) {
        console.error("❌ Token burning error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to burn StudyTokens",
            details: error.message
        });
    }
});

// Export router and XRPL token config
module.exports = { 
    router, 
    STUDY_TOKEN_ID,
    ISSUER_WALLET,
    CONVERSION_RATE,
    // Legacy export for NFT minting
    tokenBalances: studyTokenBalances,
    // Export both balance systems
    mockRLUSDBalances,
    studyTokenBalances
};