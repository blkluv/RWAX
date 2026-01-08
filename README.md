# RWAX - Real World Asset Exchange on XRPL

A professional monorepo protocol for tokenizing Singapore real estate using XRPL (XRP Ledger), featuring an AI-powered compliance oracle and React-based trading interface.

## 🏗️ Project Structure

```
RWAX/
├── apps/
│   └── frontend/              # React + Vite + XRPL UI
│       ├── src/
│       │   ├── components/    # React components
│       │   └── data/          # Synced RWA data (from oracle)
│       ├── package.json
│       └── vite.config.ts
│
├── services/
│   └── oracle/                # Python Data Pipeline
│       ├── clean_data.py      # AI compliance & valuation engine
│       ├── data/              # Raw URA property data
│       ├── output/            # Processed RWA assets (JSON)
│       └── README.md          # Oracle documentation
│
├── package.json               # Root scripts (sync-data, etc.)
└── README.md                  # This file
```

## 🚀 Quick Start

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

### 2. Run the Oracle Pipeline

Process Singapore property data and generate RWA assets:

```bash
cd services/oracle
python3 clean_data.py
```

**Output:** 3,214 compliant RWA assets in `output/rwa_assets.json`

### 3. Sync Data to Frontend

From the root directory:

```bash
yarn sync-data
```

This copies `services/oracle/output/rwa_assets.json` → `apps/frontend/src/data/rwa_assets.json`

### 4. Start Development Server

```bash
cd apps/frontend
yarn dev
```

Visit: `http://localhost:5173`

## 📦 Available Scripts

**From Root:**
- `yarn sync-data` - Sync oracle output to frontend
- `yarn oracle:run` - Run the oracle pipeline
- `yarn frontend:dev` - Start frontend dev server
- `yarn frontend:build` - Build frontend for production
- `yarn frontend:preview` - Preview production build

**From apps/frontend:**
- `yarn dev` - Start Vite dev server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

**From services/oracle:**
- `python3 clean_data.py` - Process property data

## 🧠 What Does This Do?

### The Oracle Service (Python)

Transforms raw Singapore property data into **investable, compliant RWA assets**:

1. **Regulatory Shield (Compliance)**
   - Automatically rejects 470+ illegal properties
   - Enforces 10-year rule for foreign ownership
   - Only approves compliant Freehold/Leasehold properties

2. **Alpha Generator (Profit)**
   - Identifies high-yield opportunities (0.85% - 10.45% APY)
   - Calculates connectivity scores (MRT + CBD proximity)
   - Assigns risk tiers (A, B, C)

3. **Trust Anchor (Verification)**
   - Generates SHA-256 hashes for each property
   - Provides cryptographic proof linking tokens to government data
   - Creates on-chain verifiable asset records

**Key Metrics:**
- **Input:** 3,685 properties
- **Output:** 3,214 approved assets (87%)
- **Average Yield:** 3.27% APY
- **Yield Range:** 0.85% - 10.45%

### The Frontend (React + XRPL)

- **Tech Stack:** React, TypeScript, Vite, Tailwind CSS
- **XRPL Integration:** `xrpl` + `xrpl-connect` for wallet connectivity
- **Data Visualization:** Recharts for yield analytics
- **UI Components:** Lucide React icons

## 🔗 Data Flow

```
URA Dataset (Excel)
      ↓
services/oracle/clean_data.py
      ↓
services/oracle/output/rwa_assets.json
      ↓ (yarn sync-data)
apps/frontend/src/data/rwa_assets.json
      ↓
React Components (import & display)
```

## 📄 Asset Structure

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
    "est_valuation_sgd": "Dynamic (AMM)",
    "tokens": {
      "pt_ticker": "PT-SUN",
      "yt_ticker": "YT-SUN-28"
    }
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

## 🛡️ Compliance & Legal

- **Data Source:** Singapore Urban Redevelopment Authority (URA)
- **Foreign Ownership Rule:** Properties < 10 years old are automatically rejected
- **Tenure Types:** Freehold (always approved), Leasehold (approved if ≥10 years old)
- **Regulatory Body:** Designed for MAS (Monetary Authority of Singapore) compliance

## 🏦 Token Economics

- **PT (Principal Token):** Represents ownership stake in the property
- **YT (Yield Token):** Represents the right to rental yield income
- **Valuation:** Dynamic pricing via AMM (Automated Market Maker)

## 🔧 Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- XRPL 4.5.0
- Recharts 3.6.0

**Backend (Oracle):**
- Python 3
- Pandas (data processing)
- SHA-256 (cryptographic hashing)

## 📚 Documentation

- **Oracle Details:** See `services/oracle/README.md`
- **Frontend Setup:** See `apps/frontend/package.json`

## 🤝 Development Workflow

1. **Update Property Data:**
   - Place new URA data in `services/oracle/data/raw_property.csv`

2. **Run Oracle:**
   ```bash
   cd services/oracle
   python3 clean_data.py
   ```

3. **Sync Data:**
   ```bash
   cd ../..
   yarn sync-data
   ```

4. **Develop Frontend:**
   ```bash
   cd apps/frontend
   yarn dev
   ```

5. **Build for Production:**
   ```bash
   yarn build
   ```

## 🐛 Troubleshooting

**Oracle Issues:**
- Ensure Python virtual environment is activated
- Check that `data/raw_property.csv` exists
- Run `pip install -r requirements.txt`

**Frontend Issues:**
- Run `yarn install` in `apps/frontend/`
- Clear `node_modules` and reinstall if needed
- Check that data is synced: `ls apps/frontend/src/data/rwa_assets.json`

**Data Sync Issues:**
- Ensure oracle has been run first
- Check that `services/oracle/output/rwa_assets.json` exists
- Run `yarn sync-data` from root directory

## 📄 License

ISC

## 🔗 Repository

https://github.com/LingSiewWin/RWAX.git

---

**Built with the vision of making real estate investment accessible, transparent, and globally liquid through blockchain technology.**
