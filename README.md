# RWAX - Real World Asset Exchange on XRPL

Monorepo protocol for tokenizing Singapore real estate on XRPL (XRP Ledger) with compliance-focused oracle and React trading interface.

## System Architecture

```
                                  RWAX SYSTEM ARCHITECTURE
                                  ========================

      [ LAYER 1: CLIENT ]              [ LAYER 2: ORACLE ]                   [ LAYER 3: LEDGER ]
   (apps/frontend - React/Vite)    (services/oracle - Python)               (XRPL Testnet)

   +-----------------------+       +--------------------------+          +-------------------------+
   |   App.tsx (UI)        |       |   clean_data.py (AI)     |          |    The Trust Layer      |
   |                       |       |                          |          |                         |
   |  [ Wallet Connect ]   |       |  [1. Ingest Data ]       |          |  1. IDENTITY (XLS-40)   |
   |  (xrpl-connect lib)   |       |   <raw_property.csv>     |          |     [ DID Registry ]    |
   |          |            |       |           |              |          |            ^            |
   |          v            |       |           v              |          |            |            |
   |  [ Dashboard UI ]     |       |  [2. Compliance Filter]  |          |   (Gatekeeper Check)    |
   |  - View Asset         |       |   * Reject EC < 10yrs    |          |            |            |
   |  - Buy PT (Principal) |       |           |              |          |  2. ASSETS (XLS-80)     |
   |  - Buy YT (Yield)     |       |           v              |          |     [ Faucet Issuer ]   |
   |          |            |       |  [3. Calculate Value ]   |          |     |                 |
   |          v            |       |   * Yield % + Risk       |          |     +-> [Mint PT]     |
   |    [ Sign Txn ]       |       |           |              |          |   (Ownership Token)     |
   | (walletManager.sign)  |       |           v              |          |     |                 |
   |          |            |       |  [4. On-Chain Minting ]  |          |     +-> [Mint YT]     |
   +----------+------------+       |   (mint_assets.py)       |          |   (Yield Rights IOU)    |
              |                    |           |              |          |                       |
              |                    |           v              |          |  3. MARKET (XLS-30)   |
              +------------------->|  [5. Sync Data Bridge ]--+--------->|     [ AMM Pool ]      |
                                   |   (rwa_assets.json)      |          |     |                 |
                                   +--------------------------+          |     +-> [Swap Pair]   |
                                                                         |         XRP / YT      |
                                                                         |                       |
                                                                         |  4. ORACLE (XLS-47)  |
                                                                         |     [ Price Feed ]   |
                                                                         |                       |
                                                                         |  5. COMPLIANCE (XLS-39)|
                                                                         |     [ Clawback Flag ] |
                                                                         +-------------------------+
```

## XRPL Feature Implementation

### 1. DID-Integrated Fintech Identity Flows ✅

**Implementation:** XLS-40 DIDSet transactions with OCR-based KYC pipeline

- **Location:** `apps/frontend/src/hooks/useIdentity.ts`
- **Flow:**
  1. User uploads identity document (NRIC/Passport/Property Deed)
  2. Client-side OCR extracts personal data (Tesseract.js for images, PDF.js for documents)
  3. Document parser validates NRIC, passport, property ID patterns
  4. SHA-256 hash generated for verification
  5. Compact JSON payload (<256 bytes) encoded: `{"v":1,"p":"URA-123","a":true,"k":true,"h":"abc123..."}`
  6. DIDSet transaction submitted to XRPL with payload in `Data` field
- **Components:**
  - `VerificationModal.tsx` - OCR document scanning UI
  - `documentParser.ts` - Data extraction and validation
  - `useIdentity.ts` - DID minting hook with XRPL Client integration
- **Standards:** XLS-40 (Decentralized Identifiers)

### 2. RLUSD-Based Apps ⚠️

**Status:** Not implemented in current version

- **Note:** RWAX uses native XRP for swaps via AMM pools, not RLUSD (Regulated USD stablecoin)
- **Potential Integration:** Can be added by configuring RLUSD trustlines for MAS-compliant stablecoin settlements

### 3. SDKs for Developer Integration ✅

**Implementation:** Reusable React hooks and utility functions

- **Location:** `apps/frontend/src/hooks/` and `apps/frontend/src/utils/`
- **Available SDKs:**
  - `useIdentity.ts` - DID management hook
    - `checkDID()` - Verify on-chain DID existence
    - `mintDID(parsedData, didPayload)` - Mint new DID with document hash
  - `logger.ts` - Event logging utility
    - Structured logging with backend API integration
    - Event types: wallet, transaction, DID, OCR, AMM
  - `documentParser.ts` - Document processing utilities
    - `parseDocumentText()` - Extract NRIC, passport, property ID
    - `createDIDPayload()` - Generate compact JSON for XLS-40
- **Integration Pattern:**
  ```typescript
  import { useIdentity } from './hooks/useIdentity';
  import { Logger } from './utils/logger';
  
  const { hasDID, mintDID } = useIdentity(walletAddress, walletManager);
  Logger.action("Custom Event", { data: "value" });
  ```

### 4. Payment Apps ✅

**Implementation:** Payment transactions with AMM routing

- **Location:** `apps/frontend/src/App.tsx` (handleBuy function)
- **Flow:**
  1. User initiates swap (XRP → Yield Token)
  2. Payment transaction prepared with `Destination`, `Amount`, `SendMax`
  3. XRPL Client autofills `Fee`, `Sequence`, `LastLedgerSequence`
  4. Transaction signed via `walletManager.signAndSubmit()`
  5. XRPL automatically routes through AMM if best path
- **Components:**
  - `SwapModal.tsx` - User interface for swap input
  - Payment transaction type with issued currency amounts
- **Standards:** XRPL Payment transactions, XLS-30 (AMM)

### 5. Microfinance ⚠️

**Status:** Not explicitly implemented as microfinance platform

- **Related Features:**
  - Fractional ownership via tokenization (PT/YT split)
  - Yield rights (YT) enable income streaming without full ownership
  - Low barrier entry through AMM liquidity pools
- **Potential Application:** YT tokens can function as micro-investment instruments for rental yield exposure

### 6. Real-World Asset (RWA) Tokenization ✅

**Implementation:** Multi-tier tokenization with compliance enforcement

- **Location:** `services/oracle/mint_assets.py`
- **Standards Implemented:**
  - **XLS-39 (Clawback):** Compliance enforcement via `AccountSet` flag `ASF_ALLOW_TRUSTLINE_CLAWBACK`
  - **XLS-47 (Price Oracles):** On-chain property valuation via `OracleSet` transactions
  - **XLS-30 (AMM):** Instant liquidity via `AMMCreate` with XRP/token pools
  - **XLS-33 (MPT):** Multi-purpose tokens using Issued Currency standard
  - **XLS-40 (DID):** Investor identity verification (frontend)
- **Token Structure:**
  - **PT (Principal Token):** Property ownership stake
  - **YT (Yield Token):** Rental yield rights (IOU)
- **Data Pipeline:**
  1. `clean_data.py` - Processes URA property data (3,685 → 3,214 compliant assets)
  2. Compliance filter enforces MAS regulations (10-year EC rule)
  3. `mint_assets.py` - On-chains assets with issuer wallet
  4. Oracle prices published per asset
  5. AMM pools seeded with initial liquidity
- **Output:** `services/oracle/output/rwa_assets.json` (synced to frontend via `yarn sync-data`)

## Project Structure

```
RWAX/
├── apps/
│   └── frontend/              # React + Vite + XRPL UI
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── hooks/         # useIdentity, custom hooks
│       │   ├── utils/         # logger, documentParser
│       │   └── data/          # Synced RWA data (from oracle)
│       ├── package.json
│       └── vite.config.ts
│
├── services/
│   └── oracle/                # Python Data Pipeline
│       ├── clean_data.py      # AI compliance & valuation engine
│       ├── mint_assets.py     # On-chain asset minting (5 XLS standards)
│       ├── event_logger.py    # Backend event streaming server
│       ├── data/              # Raw URA property data
│       ├── output/            # Processed RWA assets (JSON)
│       └── requirements.txt
│
├── package.json               # Root scripts
└── README.md                  # This file
```

## Quick Start

### 1. Install Dependencies

**Frontend:**
```bash
cd apps/frontend
yarn install
```

**Oracle:**
```bash
cd services/oracle
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Process Property Data

```bash
cd services/oracle
python3 clean_data.py
```

**Output:** 3,214 compliant RWA assets in `output/rwa_assets.json`

### 3. Mint Assets on XRPL

```bash
python3 mint_assets.py
```

**Output:** On-chain assets with Oracle prices, AMM pools, and Clawback enabled

### 4. Sync Data to Frontend

```bash
cd ../..
yarn sync-data
```

### 5. Start Development

**Backend Event Logger (Terminal 1):**
```bash
yarn backend:events
```

**Frontend (Terminal 2):**
```bash
yarn frontend:dev
```

Visit: `http://localhost:5173`

## Available Scripts

**From Root:**
- `yarn sync-data` - Sync oracle output to frontend
- `yarn oracle:run` - Run data processing pipeline
- `yarn oracle:mint` - Mint assets on XRPL
- `yarn backend:events` - Start event logger server
- `yarn frontend:dev` - Start frontend dev server
- `yarn frontend:build` - Build frontend for production

## Data Flow

```
URA Dataset (CSV)
      ↓
services/oracle/clean_data.py
      ↓
services/oracle/output/rwa_assets.json
      ↓
services/oracle/mint_assets.py (on-chain minting)
      ↓
services/oracle/output/rwa_assets.json (with chain_info)
      ↓ (yarn sync-data)
apps/frontend/src/data/rwa_assets.json
      ↓
React Components (display & interact)
```

## Asset Structure

Each processed asset includes:

```json
{
  "id": "ff414eb90673",
  "identity": {
    "project": "Sungrove",
    "type": "N/A-Bed | >8000 sqft",
    "district": "D5"
  },
  "financials": {
    "yield_apy": 7.69,
    "est_valuation_sgd": 1115500,
    "tokens": {
      "pt_ticker": "PT-SUN",
      "yt_ticker": "YT-SUN-28"
    }
  },
  "chain_info": {
    "issuer": "rw4aEbzdPXLYYEMAFfCNAGVuv994nGkgWL",
    "currency": "59542D53554E2D32380000000000000000000000",
    "ticker": "YT-SUN-28",
    "oracle": {
      "document_id": "abc123",
      "asset_class": "RWA",
      "price_set": true
    },
    "amm": {
      "exists": true,
      "trading_fee": 0.5,
      "liquidity_provided": true
    },
    "token_standard": "XLS-33 (Issued Currency)"
  },
  "insights": {
    "connectivity_score": 80.7,
    "risk_rating": "A (Low Risk)",
    "compliance_note": "Safe Leasehold (32 yrs old)",
    "mrt_distance": "1007m"
  },
  "proof": {
    "source": "URA_API_2026",
    "data_hash": "ff414eb9067371d7..."
  }
}
```

## Tech Stack

**Frontend:**
- React 19, TypeScript, Vite 7
- Tailwind CSS 4
- XRPL 4.5.0, xrpl-connect 0.4.0
- Tesseract.js (OCR), PDF.js (document parsing)
- Recharts 3.6.0

**Backend (Oracle):**
- Python 3.14
- xrpl-py 2.0.0, pandas 2.0.0
- Rich 14.2.0 (terminal formatting)
- Flask 3.1.2 (event logger API)

## Compliance & Regulatory

- **Data Source:** Singapore Urban Redevelopment Authority (URA)
- **Regulatory Body:** MAS (Monetary Authority of Singapore)
- **Foreign Ownership Rule:** Properties < 10 years old automatically rejected
- **Tenure Types:** Freehold (always approved), Leasehold (approved if ≥10 years old)
- **Compliance Enforcement:** XLS-39 Clawback enabled on issuer accounts

## Key Metrics

- **Input Properties:** 3,685
- **Approved Assets:** 3,214 (87%)
- **Rejected Assets:** 470 (13% - illegal/restricted)
- **Average Yield:** 3.27% APY
- **Yield Range:** 0.85% - 10.45%

## Repository

https://github.com/LingSiewWin/RWAX.git
