# services/oracle/mint_assets.py
import json
import time
import sys
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.models.transactions import AccountSet
from xrpl.utils import str_to_hex
from xrpl.transaction import submit_and_wait

XRPL_RPC = "https://s.altnet.rippletest.net:51234"
DATA_FILE = "./output/rwa_assets.json"
client = JsonRpcClient(XRPL_RPC)

def get_free_issuer_wallet():
    print("⏳ Requesting FREE 1000 XRP from Testnet Faucet...")
    wallet = generate_faucet_wallet(client, debug=False)
    print(f"✅ ISSUER: {wallet.classic_address}")
    return wallet

def configure_issuer(wallet):
    print("⚙️  Configuring Issuer (Default Ripple)...")
    tx = AccountSet(account=wallet.classic_address, set_flag=8)
    submit_and_wait(tx, client, wallet)

def mint_asset_on_chain(issuer_wallet, asset_data):
    ticker = asset_data['financials']['tokens']['yt_ticker']
    currency_code = str_to_hex(ticker).ljust(40, '0')
    print(f"💎 Registered: {ticker}")
    return {
        "issuer": issuer_wallet.classic_address,
        "currency": currency_code,
        "ticker": ticker,
        "human_name": asset_data['identity']['project']
    }

def main():
    print("🦁 RWAX: SAFE MINTING PROTOCOL")
    issuer_wallet = get_free_issuer_wallet()
    configure_issuer(issuer_wallet)

    try:
        with open(DATA_FILE, 'r') as f:
            assets = json.load(f)
    except:
        return print("❌ Run clean_data.py first!")

    updated_assets = []
    print("\n🚀 Registering Assets...")
    for i, asset in enumerate(assets):
        if i < 3:
            asset['chain_info'] = mint_asset_on_chain(issuer_wallet, asset)
        updated_assets.append(asset)

    with open(DATA_FILE, 'w') as f:
        json.dump(updated_assets, f, indent=2)
    print("\n✅ DONE. Run 'yarn sync-data'.")

if __name__ == "__main__":
    main()
