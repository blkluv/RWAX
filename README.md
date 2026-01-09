# RWAX

Real World Asset Exchange on XRP Ledger. Tokenizing Singapore real estate with compliance-first architecture.

## Overview

RWAX enables fractional ownership of Singapore real estate through XRPL-native tokens. The platform processes 3,200+ properties from URA (Urban Redevelopment Authority) data, applies MAS compliance rules, and creates tradeable yield tokens via AMM pools.

## XRPL Standards

| Standard | Implementation |
|----------|----------------|
| XLS-40 | DID-based identity verification with OCR pipeline |
| XLS-30 | AMM pools for instant XRP/YT swaps |
| XLS-39 | Clawback compliance for regulatory enforcement |
| XLS-47 | On-chain price oracles for property valuation |
| XLS-33 | Issued currency tokens (PT/YT) |

## Architecture

```
Frontend (React)          Oracle (Python)           XRPL Testnet
     │                         │                         │
     ├─ Wallet Connect         ├─ Data Processing        ├─ DID Registry
     ├─ DID Verification       ├─ Compliance Filter      ├─ Token Issuance
     ├─ Asset Browser          ├─ Asset Minting          ├─ AMM Pools
     └─ Swap Interface         └─ Oracle Pricing         └─ Payment Routing
```

## Quick Start

```bash
# Install
yarn install
cd services/oracle && pip install -r requirements.txt

# Run
yarn frontend:dev     # http://localhost:5173
```

## Project Structure

```
rwax/
├── apps/frontend/        # React + Vite + xrpl-connect
│   ├── components/       # UI components
│   ├── hooks/            # useIdentity (DID management)
│   └── data/             # Processed asset data
├── services/oracle/      # Python data pipeline
│   ├── clean_data.py     # URA processing + compliance
│   ├── mint_assets.py    # On-chain minting
│   └── output/           # rwa_assets.json
└── package.json
```

## Key Features

- **Identity**: Document OCR (Tesseract.js) → DIDSet transaction
- **Trading**: Payment transactions routed through AMM
- **Compliance**: MAS rules enforced (10-year EC restriction, clawback)
- **Data**: 3,214 compliant assets from 3,685 input properties

## Scripts

```bash
yarn frontend:dev      # Start frontend
yarn oracle:run        # Process property data
yarn oracle:mint       # Mint assets on XRPL
yarn sync-data         # Sync oracle → frontend
```

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, Tailwind, xrpl 4.5, xrpl-connect
**Backend**: Python, xrpl-py, pandas, Flask

## Data Source

Singapore Urban Redevelopment Authority (URA) Private Residential Property API

## License

MIT
