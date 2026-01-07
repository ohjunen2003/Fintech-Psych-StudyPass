# Fintech-Psych-
# StudyPass — XRPL Study Space Economy

🎯 Short pitch
StudyPass is an XRPL-based seat reservation economy for university study spaces. It turns wasted library seats into a fair, auditable, tokenized marketplace: students mint StudyTokens (stable RLUSD-backed credits), use them to buy time-limited NFT seat passes, and the XRPL ledger enforces refunds, expiry and governance.

---

## 🎯 Problem
- NUS Central Library: ~2,000 seats; fully occupied early morning and almost always during peak hours.  
- Freshmen often cannot find seats; seniors camp overnight to secure spots.  
- No-show rate: 20–30% → 400+ wasted seats daily.  
- Current system: first-come-first-serve — opaque and unfair.

We solve fairness, no-shows, and dynamic pricing using XRPL-native features so students trust the system and NUS gains a transparent allocation & revenue stream.

---

## ✅ Core Solution (Hackathon MVP)
- DID-based student login (NUS matric → verifiable XRPL DID).
- Mint StudyTokens (1:1 RLUSD peg) to act as usage credits.
- Dynamic room pricing via an XRPL DEX/AMM price feed (simulated in MVP).
- Burn StudyTokens to mint time-limited, non-transferable NFT seat passes (1h/2h/4h).
- QR + wallet signature check at door for secure check-in.
- Escrow rules auto-refund or penalize no-shows; tokens recycle into shared treasury.

Live demo (testnet): https://studypass.nus.xrpl (demo/testnet link)

---

## 🛠️ XRPL Features Used (why judges like this)
- DID Auth — verifiable student identity with cryptographic proofs.
- RLUSD — XRPL stable token pegged to SGD for predictable payments.
- NFTs — time-locked, non-transferable seat passes.
- MPT (issuer-controlled tokens) — StudyTokens issued with `RequireAuth` and clawback to prevent speculation.
- DEX / AMM — automated dynamic pricing / price discovery, simulated for the demo.
- Escrows & Multi-sig — trustless refunds and governance control.

---

## 🧭 Technical Architecture (MVP scope)
Frontend (React Native, mobile-first)
- `DIDAuth.jsx` — wallet connect + DID sign-in (NUS matric → did:xrpl:...)
- `TokenMint.jsx` — mint StudyTokens using RLUSD
- `SeatMarket.jsx` — room list + dynamic prices from price oracle
- `SeatQR.jsx` — display NFT pass + QR for scanning
- `WalletConnect.jsx` — integrate Xaman / mobile wallet

Backend (Node.js, xrpl.js)
- `didResolver.js` — resolve & verify student DIDs
- `nftMinter.js` — mint time-locked NFT seat passes on XRPL
- `ammManager.js` — DEX/AMM simulation & pricing logic
- `escrowBurn.js` — escrow rules for refunds/no-shows
- `oracle.js` — occupancy feed (mocked in MVP)

XRPL-native smart features
- Multi-sig escrow for pooled funds (NUS + student reps)
- NFT time-locks & auto-expiry
- Payment channels (optional for micro-payments)
- DEX AMM for token-price discovery (simulated AMM in demo)

---

## Dynamic Pricing Engine (policy)
Room occupancy → token price mapping (example):
- 0–30% occupancy: 0.8 tokens (~S$0.40)
- 30–70% occupancy: 1.2 tokens (~S$0.60)
- 70–90% occupancy: 2.0 tokens (~S$1.00)
- 90%+: 3.5 tokens (~S$1.75) + surge multiplier

AMM concept: RLUSD <-> StudyTokens liquidity pool moves price based on pool balance. For hackathon, a deterministic pricing function or simulated AMM is acceptable.

---

## Tokenomics & Treasury Rules
- StudyTokens: MPT issuance, `RequireAuth=true`, `CanClawback=true` (no open-market trading).
- Booking flow: tokens move into escrow. On check-in/out, rules compute fee/refund.
- Sample policy:
  - Book: 2 tokens go into escrow.
  - Check-in and use: keep 1.5 tokens (fee), return 0.5 tokens (loyalty).
  - No-show: keep 1 token (penalty), return 1 token to shared pool.
- Treasury uses:
  - Fund show-up rebates / off-peak discounts.
  - Provide AMM liquidity or periodic revenue share to NUS.
  - Analytics & premium room partnerships.

Revenue model
- 2% transaction fee on mint/burn (approx S$0.01/seat)
- Premium rooms: NUSCoops partnership revenue split
- Analytics dashboard license (S$5k/semester)

Scale example (NUS pilot)
- 40k students × 5 seats/semester = 200k seat transactions → pilot revenue S$40k+

---

## Demo Flow (3-minute live demo script)
1. User scans QR, connects wallet → DID login (2s).
2. Selects "Central Lib L1" — occupancy shows 85% → price 1.8 StudyTokens.
3. Pay/mint → NFT seat pass minted (XRPL finality simulated/testnet, ~3s for demo).
4. Show QR at door → validator verifies wallet signature and NFT ownership → green light.
5. After session, NFT auto-expires; escrow rules apply and treasury/refund actions are executed.

Note: For the hackathon, we simulate occupancy via `oracle.js` and AMM via `ammManager.js`. XRPL testnet is used for token/NFT operations.

---

## Developer quickstart (local testnet Demo)
Prereqs: Node.js 18+, Yarn/npm, a testnet XRPL wallet (Xaman or similar).

1. Install
```bash
npm install

npm run start:backend

npm run start:frontend