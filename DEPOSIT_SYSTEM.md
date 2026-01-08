# 💰 StudyPass Deposit System

## Overview

The deposit system enforces a **0.5 StudyToken refundable deposit** for seat bookings to reduce no-shows. Users who check in get their deposit back; no-shows forfeit their deposit to the admin.

## Why Not XRPL Escrows?

**XRPL conditional escrows cannot implement this logic** because:

1. ❌ **No conditional routing**: Escrows can only release to the original destination or cancel back to sender
2. ❌ **No real-world triggers**: Conditions are cryptographic (preimage hashes), not event-based
3. ❌ **Anyone can fulfill**: Any account with the fulfillment code can claim the escrow
4. ❌ **Canceled escrows always return to sender**: You cannot forfeit an escrow to a third party

**Our solution**: Backend-controlled deposit tracking using StudyTokens.

---

## How It Works

### 1️⃣ Booking with Deposit

When a user books a seat:

```javascript
POST /api/nft/mint
{
  "wallet": "rUserWallet123",
  "roomId": "centralLib",
  "durationMinutes": 120,
  "tokensToSpend": 2.0,
  "includeDeposit": true  // Default: true
}
```

**Backend process:**
- ✅ Deducts `2.0 + 0.5 = 2.5` tokens from user
- ✅ Burns `2.0` tokens (booking fee)
- ✅ Transfers `0.5` tokens to admin wallet (held as deposit)
- ✅ Creates deposit record with status `"held"`
- ✅ Mints NFT seat pass with `depositHeld: true`

**Response:**
```json
{
  "success": true,
  "nft": { "nftId": "nft_1234567890", ... },
  "tokensBurned": 2.0,
  "depositHeld": true,
  "depositAmount": 0.5,
  "remainingBalance": 7.5
}
```

---

### 2️⃣ User Shows Up (Deposit Released)

When the user scans their NFT at library entrance:

```javascript
POST /api/nft/scan/nft_1234567890
```

**Backend process:**
- ✅ Verifies NFT is valid and not expired
- ✅ Marks NFT as used
- ✅ **Automatically releases deposit**: Transfers `0.5` tokens from admin back to user
- ✅ Updates deposit status to `"released"`

**Response:**
```json
{
  "success": true,
  "message": "🎉 Access Granted!",
  "depositRefunded": true,
  "details": {
    "room": "Central Library Level 2",
    "student": "rUserWalle...",
    "validUntil": "2:30:00 PM",
    "scannedAt": "12:30:00 PM",
    "depositReturned": 0.5
  }
}
```

---

### 3️⃣ User No-Shows (Deposit Forfeited)

If the user never scans their NFT (no-show):

**Option A - Manual forfeit by admin:**
```javascript
POST /api/deposits/forfeit
{
  "bookingId": "nft_1234567890"
}
```

**Option B - Automatic forfeit after expiry (recommended):**
- Add a cron job to check expired NFTs daily
- Auto-forfeit deposits for unscanned NFTs past their expiry time

**Backend process:**
- ✅ Keeps the `0.5` tokens in admin wallet (already there)
- ✅ Updates deposit status to `"forfeited"`

**Response:**
```json
{
  "success": true,
  "message": "Deposit forfeited (user no-showed)",
  "deposit": {
    "wallet": "rUserWallet123",
    "amount": 0.5,
    "status": "forfeited",
    "forfeitedAt": 1736336926000
  }
}
```

---

## API Endpoints

### 📊 Get Deposit Status

```bash
GET /api/deposits/:bookingId
```

Returns deposit info for a specific booking (NFT ID).

---

### 👤 Get User's Deposits

```bash
GET /api/deposits/wallet/rUserWallet123
```

Returns all deposits for a wallet (held, released, forfeited).

---

### 🔧 Admin Stats

```bash
GET /api/deposits/admin/stats
```

Returns system-wide deposit statistics:

```json
{
  "success": true,
  "adminWallet": "rAdminWalletAddress123",
  "adminBalance": 15.5,
  "depositAmount": 0.5,
  "stats": {
    "total": 45,
    "held": 8,
    "released": 32,
    "forfeited": 5,
    "totalHeldValue": 4.0,
    "totalForfeitedValue": 2.5
  }
}
```

---

## Configuration

### Set Admin Wallet

In `/backend/.env`:
```bash
ADMIN_WALLET=rYourActualAdminWalletAddress
```

Or it defaults to `rAdminWalletAddress123`.

### Change Deposit Amount

Edit `/backend/routes/deposits.js`:
```javascript
const DEPOSIT_AMOUNT = 0.5; // Change to 1.0, 0.25, etc.
```

---

## Frontend Integration

### Update Booking Component

```javascript
// In BookingPage.jsx or similar
const bookSeat = async () => {
  const response = await fetch('/api/nft/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: userWallet,
      roomId: selectedRoom,
      durationMinutes: 120,
      tokensToSpend: 2.0,
      includeDeposit: true  // ⚠️ Important!
    })
  });
  
  const data = await response.json();
  
  if (data.depositHeld) {
    alert(`Booking confirmed! ${data.depositAmount} token deposit held. 
           Show up and scan your NFT to get it back!`);
  }
};
```

### Show Deposit Info

Display deposit status in user's booking history:

```javascript
const DepositBadge = ({ nft }) => {
  const [deposit, setDeposit] = useState(null);
  
  useEffect(() => {
    fetch(`/api/deposits/${nft.nftId}`)
      .then(r => r.json())
      .then(data => setDeposit(data.deposit));
  }, [nft.nftId]);
  
  if (!deposit) return null;
  
  return (
    <div className={`badge ${deposit.status}`}>
      {deposit.status === 'held' && '💰 Deposit Held'}
      {deposit.status === 'released' && '✅ Deposit Refunded'}
      {deposit.status === 'forfeited' && '❌ Deposit Forfeited'}
    </div>
  );
};
```

---

## Advantages Over XRPL Escrows

| Feature | XRPL Escrow | Our System |
|---------|-------------|------------|
| Conditional routing (user vs admin) | ❌ Impossible | ✅ Yes |
| Real-world event triggers | ❌ No | ✅ Yes |
| Transaction fees | 💸 3 transactions (create, finish/cancel, claim) | 💸 1 transaction (transfer) |
| Complexity | 🔴 High (five-bells-condition, crypto hashes) | 🟢 Simple (if/else) |
| Refund to sender | ✅ Automatic | ✅ Backend-controlled |
| Forfeit to third party | ❌ Impossible | ✅ Yes |

---

## Testing

### Test Flow 1: Deposit Released (Happy Path)

```bash
# 1. Mint tokens
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"wallet": "rUserTest123", "amount": 10}'

# 2. Book seat with deposit
curl -X POST http://localhost:3001/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "rUserTest123",
    "roomId": "centralLib",
    "durationMinutes": 120,
    "tokensToSpend": 2.0,
    "includeDeposit": true
  }'
# Save the nftId from response

# 3. Check balance (should be 10 - 2.0 - 0.5 = 7.5)
curl http://localhost:3001/api/tokens/balance/rUserTest123

# 4. User scans NFT (checks in)
curl -X POST http://localhost:3001/api/nft/scan/NFT_ID_HERE

# 5. Check balance (should be 7.5 + 0.5 = 8.0)
curl http://localhost:3001/api/tokens/balance/rUserTest123
```

### Test Flow 2: Deposit Forfeited (No-Show)

```bash
# 1-3. Same as above

# 4. User never shows up, admin forfeits
curl -X POST http://localhost:3001/api/deposits/forfeit \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "NFT_ID_HERE"}'

# 5. Check user balance (still 7.5, deposit not returned)
curl http://localhost:3001/api/tokens/balance/rUserTest123

# 6. Check admin stats
curl http://localhost:3001/api/deposits/admin/stats
```

---

## Future Enhancements

### 1. Automatic Forfeit Cron Job

```javascript
// Add to backend/jobs/forfeit-checker.js
const cron = require('node-cron');

// Run every hour
cron.schedule('0 * * * *', async () => {
  const { deposits } = require('../routes/deposits');
  const { mintedNFTs } = require('../utils/nftMinter');
  
  Object.values(deposits).forEach(deposit => {
    if (deposit.status === 'held') {
      const nft = mintedNFTs[deposit.bookingId];
      
      // If NFT expired and not scanned, forfeit
      if (nft && Date.now() > nft.expiresAt && nft.status !== 'used') {
        console.log(`Auto-forfeiting deposit for ${deposit.bookingId}`);
        // Call forfeit logic here
      }
    }
  });
});
```

### 2. Grace Period

Allow 15-minute grace period after booking starts before forfeit:

```javascript
const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes
if (Date.now() > nft.expiresAt + GRACE_PERIOD_MS) {
  // Forfeit
}
```

### 3. Partial Refunds

- Full refund if scanned within first hour
- 50% refund if scanned late
- 0% refund if never scanned

---

## Summary

✅ **No need for `five-bells-condition`**  
✅ **No XRPL escrows required**  
✅ **Simple, reliable, cost-effective**  
✅ **Full control over deposit logic**  
✅ **Works with existing StudyToken system**

This backend-managed approach gives you exactly what you need: deposits that refund to users who show up, and forfeit to admin for no-shows.
