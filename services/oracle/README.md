# RWAX Oracle Service

## Overview
The Oracle Service is the **data brain** of RWAX. It processes raw Singapore property data from the Urban Redevelopment Authority (URA) and transforms it into **investable, compliant RWA assets**.

## What It Does

### 1. Regulatory Shield (Compliance)
- Automatically **rejects 470+ illegal properties** that foreigners cannot buy
- Enforces the **10-year rule** for Executive Condominiums
- Only approves Freehold or Leasehold properties meeting legal requirements

### 2. Alpha Generator (Profit)
- Identifies **high-yield opportunities** (yields range from 0.85% to 10.45%)
- Calculates **connectivity scores** based on MRT and CBD proximity
- Assigns **risk tiers** (A, B, C) for investor decision-making

### 3. Trust Anchor (Verification)
- Generates **SHA-256 hashes** for each property record
- Provides **cryptographic proof** linking tokens to government data
- Creates **on-chain verifiable** asset records

## Directory Structure

```
services/oracle/
├── clean_data.py           # Main data processing script
├── requirements.txt        # Python dependencies
├── data/
│   └── raw_property.csv   # Input: Raw URA data (3,685 properties)
└── output/
    └── rwa_assets.json    # Output: Processed RWA assets (3,214 approved)
```

## Setup

### 1. Create Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

## Usage

### Run the Oracle Pipeline
```bash
python3 clean_data.py
```

**Expected Output:**
```
🏗️  RWAX Data Pipeline Initialized...
📊 Analyzing 3684 properties using Anchor Parsing...
✅ Success! Generated 3214 RWA Assets with AI Insights.
💾 Output: ./output/rwa_assets.json
```

### Sync Data to Frontend
After running the oracle, sync the processed data to the frontend:
```bash
cd ../..  # Return to root
yarn sync-data
```

This copies `output/rwa_assets.json` → `apps/frontend/src/data/rwa_assets.json`

## Output Format

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

## Key Metrics

- **Total Input:** 3,685 properties
- **Approved Assets:** 3,214 (87%)
- **Rejected Assets:** 470 (13% - illegal/restricted)
- **Average Yield:** 3.27% APY
- **Yield Range:** 0.85% - 10.45%
- **Average Connectivity:** 85.4/100

## Configuration

Edit `clean_data.py` to adjust:

```python
CURRENT_YEAR = 2026              # Current year for age calculation
MIN_EC_AGE = 10                  # Minimum EC age for foreign ownership
WEIGHT_MRT = 0.6                 # MRT proximity weight (60%)
WEIGHT_CBD = 0.4                 # CBD proximity weight (40%)
```

## Compliance Logic

### Approval Criteria
✅ **Freehold/999yr:** Always approved
✅ **Leasehold ≥10 years old:** Approved
❌ **Leasehold <10 years old:** Rejected (likely EC)

### Risk Scoring
- **Base Score:** 10 points
- **Deductions:**
  - Leasehold: -2 points
  - Low connectivity (<50): -2 points
  - Low yield (<2%): -1 point

**Risk Tiers:**
- **A (Low Risk):** Score 8-10
- **B (Medium Risk):** Score 6-7
- **C (High Risk):** Score ≤5

## Troubleshooting

### No output file generated
- Check that `./data/raw_property.csv` exists
- Ensure Python dependencies are installed
- Verify file permissions

### Import errors
```bash
pip install -r requirements.txt
```

### Path issues
The script uses relative paths (`./data/`, `./output/`). Always run from the `services/oracle/` directory.

## Next Steps

1. **Run Oracle:** `python3 clean_data.py`
2. **Sync Data:** `yarn sync-data` (from root)
3. **Start Frontend:** `cd apps/frontend && yarn dev`
4. **Integrate:** Import assets in React: `import assets from './data/rwa_assets.json'`

---

**For questions about the Oracle logic, see the comments in `clean_data.py`**
