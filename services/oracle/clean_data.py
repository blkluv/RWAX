import re
import json
import hashlib
import os
from datetime import datetime

# --- CONFIGURATION ---
INPUT_FILE = "./data/raw_property.csv"
OUTPUT_FILE = "./output/rwa_assets.json"
CURRENT_YEAR = 2026
MIN_EC_AGE = 10  # Foreigners cannot buy ECs younger than 10 years

# --- SCORING WEIGHTS (For AI Insights) ---
# We penalize distance from CBD and MRT to create a "Connectivity Score"
WEIGHT_MRT = 0.6
WEIGHT_CBD = 0.4

def calculate_connectivity_score(mrt_m, cbd_km):
    """
    Generates a 0-100 Score for location quality.
    - MRT < 500m is excellent.
    - CBD < 5km is excellent.
    """
    try:
        if mrt_m is None or cbd_km is None: return 0
        
        # Normalize: 100 points - (deductions for distance)
        # Deduct 1 point for every 50m from MRT
        mrt_penalty = max(0, (mrt_m - 200) / 50) 
        # Deduct 2 points for every 1km from CBD
        cbd_penalty = max(0, (cbd_km * 2))
        
        score = 100 - (mrt_penalty * WEIGHT_MRT) - (cbd_penalty * WEIGHT_CBD)
        return round(max(0, min(100, score)), 1)
    except:
        return 0

def smart_parse_row(row):
    """
    Parses a 'smashed' row string into structured data using Regex Anchors.
    """
    data = {}
    text = row.strip()
    
    # ---------------------------------------------------------
    # ANCHOR 1: THE YIELD (%) - This is our 'Center Point'
    # ---------------------------------------------------------
    # We look for something like "1.97%" or "4.52%"
    # We split the string into LEFT (Identity) and RIGHT (Location/Tenure)
    yield_match = re.search(r"(\d{1,2}\.\d{1,2})%", text)
    
    if not yield_match:
        return None # Garbage row
        
    data['yield_apy'] = float(yield_match.group(1))
    
    # Split the text based on the yield
    split_index = yield_match.start()
    end_index = yield_match.end()
    
    left_side = text[:split_index]  # Name, Bed, Area, District...
    right_side = text[end_index:]   # Rented, Rent, MRT, Tenure...

    # ---------------------------------------------------------
    # PARSING LEFT SIDE (Identity & Valuation)
    # ---------------------------------------------------------
    # Structure: [Name] [Bed] [Area Range] [District] ...
    
    # 1. Project Name & Bed/Area
    # Logic: Look for the Area Range (e.g., 2000-2500) as the separator
    area_match = re.search(r"(\d{3,5}-\d{3,5}|>3000|<1000)", left_side)
    
    if area_match:
        data['area_sqft_range'] = area_match.group(1)
        # Name is everything before area, minus the 'BedRm' digit/n.a.
        raw_name_part = left_side[:area_match.start()]
        
        # Extract BedRm (last part of name section)
        if raw_name_part.endswith("n.a."):
            data['bedrooms'] = "N/A"
            data['project_name'] = raw_name_part[:-4].strip()
        elif raw_name_part[-1].isdigit():
            data['bedrooms'] = raw_name_part[-1]
            data['project_name'] = raw_name_part[:-1].strip()
        else:
            data['bedrooms'] = "?"
            data['project_name'] = raw_name_part.strip()
            
        # Extract District (Usually 1-2 digits right after Area)
        # We assume the digits immediately following area are [District][Sold]
        # This is fuzzy, but works for Insights
        remaining_left = left_side[area_match.end():]
        district_match = re.match(r"^(\d{1,2})", remaining_left)
        data['district'] = district_match.group(1) if district_match else "Unknown"
        
    else:
        # Fallback if area is weird
        data['project_name'] = left_side[:20] + "..."
        data['area_sqft_range'] = "Unknown"

    # ---------------------------------------------------------
    # PARSING RIGHT SIDE (Location & Tenure)
    # ---------------------------------------------------------
    # Structure: ... [MRT] [CBD] [Tenure Commencing...]
    
    # 1. Tenure (At the very end)
    tenure_match = re.search(r"(Freehold|999 yrs.*?|99 yrs.*?)(\d{4})?$", right_side, re.IGNORECASE)
    if tenure_match:
        data['tenure_raw'] = tenure_match.group(0).strip()
        data['tenure_type'] = "Freehold/999yr" if ("Freehold" in data['tenure_raw'] or "999" in data['tenure_raw']) else "Leasehold"
        # Year
        year_match = re.search(r"from (\d{4})", data['tenure_raw'])
        data['commence_year'] = int(year_match.group(1)) if year_match else 0
        
        # Remove Tenure from right_side to find MRT/CBD
        loc_text = right_side[:tenure_match.start()]
    else:
        data['tenure_type'] = "Unknown"
        loc_text = right_side

    # 2. MRT & CBD (Extract numbers from the end of the remaining string)
    # The last two numbers in 'loc_text' are likely CBD(km) and MRT(m)
    # Regex to find all floating point numbers
    floats = re.findall(r"(\d+\.?\d*)", loc_text)
    
    if len(floats) >= 2:
        # CBD is usually the last number (km, e.g. 10.8)
        # MRT is usually the second to last (m, e.g. 2201.0)
        try:
            data['cbd_dist_km'] = float(floats[-1])
            data['mrt_dist_m'] = float(floats[-2])
        except:
            data['cbd_dist_km'] = None
            data['mrt_dist_m'] = None
    else:
        data['cbd_dist_km'] = None
        data['mrt_dist_m'] = None

    # ---------------------------------------------------------
    # AI ENRICHMENT (The "Insightful" Part)
    # ---------------------------------------------------------
    data['connectivity_score'] = calculate_connectivity_score(data.get('mrt_dist_m'), data.get('cbd_dist_km'))
    data['data_hash'] = hashlib.sha256(row.encode()).hexdigest()
    
    return data

def check_compliance_and_risk(asset):
    """
    Determines if the asset is valid for RWAX and assigns a Risk Tier.
    """
    # 1. COMPLIANCE (Legal Gate)
    status = "REJECTED"
    reason = "Unknown"
    
    if asset['tenure_type'] == "Freehold/999yr":
        status = "APPROVED"
        reason = "Unrestricted (Freehold)"
    elif asset['tenure_type'] == "Leasehold":
        if asset['commence_year'] > 0:
            age = CURRENT_YEAR - asset['commence_year']
            if age >= MIN_EC_AGE:
                status = "APPROVED"
                reason = f"Safe Leasehold ({age} yrs old)"
            else:
                status = "REJECTED"
                reason = f"Restricted/New EC ({age} yrs old)"
        else:
            status = "FLAGGED"
            reason = "Unknown Lease Year"

    # 2. RISK SCORING (For Investors)
    # Start with base score 10
    risk_score = 10
    
    # Deduct for Leasehold
    if asset['tenure_type'] == "Leasehold": risk_score -= 2
    # Deduct for low connectivity
    if asset['connectivity_score'] < 50: risk_score -= 2
    # Deduct for very low yield
    if asset['yield_apy'] < 2.0: risk_score -= 1
    
    # Map to Tier
    risk_tier = "A (Low Risk)"
    if risk_score <= 7: risk_tier = "B (Medium Risk)"
    if risk_score <= 5: risk_tier = "C (High Risk)"

    return {
        "status": status,
        "reason": reason,
        "risk_tier": risk_tier,
        "score": risk_score
    }

def main():
    print(f"🏗️  RWAX Data Pipeline Initialized...")
    
    raw_rows = []
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_rows = f.readlines()
    except FileNotFoundError:
        print("❌ Error: No data file found.")
        return

    processed_assets = []
    
    print(f"📊 Analyzing {len(raw_rows)} properties using Anchor Parsing...")
    
    for row in raw_rows:
        if len(row) < 10: continue
        
        parsed = smart_parse_row(row)
        if parsed:
            compliance = check_compliance_and_risk(parsed)
            
            # Only include Approved assets in the Oracle Feed
            if compliance['status'] == "APPROVED":
                
                # FINAL ORACLE PAYLOAD (This goes to the Frontend/Chain)
                asset_record = {
                    "id": parsed['data_hash'][:12],
                    "identity": {
                        "project": parsed['project_name'],
                        "type": f"{parsed.get('bedrooms', '?')}-Bed | {parsed.get('area_sqft_range', '?')} sqft",
                        "district": f"D{parsed.get('district', '?')}"
                    },
                    "financials": {
                        "yield_apy": parsed['yield_apy'],
                        "est_valuation_sgd": "Dynamic (AMM)", 
                        "tokens": {
                            "pt_ticker": f"PT-{parsed['project_name'][:3].upper()}",
                            "yt_ticker": f"YT-{parsed['project_name'][:3].upper()}-28"
                        }
                    },
                    "insights": {
                        "connectivity_score": parsed['connectivity_score'],
                        "risk_rating": compliance['risk_tier'],
                        "compliance_note": compliance['reason'],
                        "mrt_distance": f"{int(parsed.get('mrt_dist_m', 0))}m"
                    },
                    "proof": {
                        "source": "URA_API_2026",
                        "data_hash": parsed['data_hash']
                    }
                }
                processed_assets.append(asset_record)

    # Export
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(processed_assets, f, indent=2)

    print(f"✅ Success! Generated {len(processed_assets)} RWA Assets with AI Insights.")
    print(f"💾 Output: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()