// apps/frontend/src/hooks/useIdentity.ts
import { useState, useEffect, useCallback } from 'react';
import { Client } from 'xrpl';
import { WalletManager } from 'xrpl-connect';

export function useIdentity(walletAddress: string | undefined, walletManager: WalletManager) {
  const [hasDID, setHasDID] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);

  // 1. Check for DID on-chain
  const checkDID = useCallback(async () => {
    if (!walletAddress) {
      setHasDID(false);
      return;
    }

    // Silent loading for background checks
    try {
      const client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();

      const response = await client.request({
        command: "account_objects",
        account: walletAddress,
        type: "did"
      });

      const found = response.result.account_objects.length > 0;
      setHasDID(found);
      console.log("🔍 DID Check:", found ? "Found" : "Not Found");

      await client.disconnect();
    } catch (error) {
      console.error("DID Check Failed:", error);
      setHasDID(false);
    }
  }, [walletAddress]);

  // Initial Check
  useEffect(() => {
    checkDID();
  }, [checkDID]);

  // 2. Mint DID Function (The Missing Feature)
  const mintDID = async () => {
    if (!walletAddress) return;
    setIsMinting(true);

    try {
      // Helper function to convert string to hex (uppercase, as required by XRPL)
      const toHex = (str: string): string => {
        return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
      };

      // Construct the XLS-40 DIDSet Transaction
      // CRITICAL: At least ONE of URI, Data, or DIDDocument must be provided
      // All fields must be hex-encoded strings
      const tx: any = {
        TransactionType: "DIDSet",
        // URI: Primary identifier (required if DIDDocument is empty)
        // Using a URL that represents the KYC verification endpoint
        URI: toHex("https://rwax.sg/kyc/investor"),
        // Data: Additional attestation data (optional)
        Data: toHex("Verified RWA Investor - KYC Level 1"),
        // DIDDocument: Can contain the actual DID identifier (optional)
        // Format: did:xrpl:1:{network}:{account}
        DIDDocument: toHex(`did:xrpl:1:testnet:${walletAddress}`)
      };

      console.log("📝 Minting DID on XRPL Testnet...");
      console.log("Account:", walletAddress);
      console.log("Transaction:", {
        ...tx,
        URI_decoded: "https://rwax.sg/kyc/investor",
        Data_decoded: "Verified RWA Investor - KYC Level 1",
        DIDDocument_decoded: `did:xrpl:1:testnet:${walletAddress}`
      });

      const result = await walletManager.sign(tx);
      console.log("✅ DID Transaction Submitted:", result);

      // Wait for ledger validation (5 seconds for testnet)
      setTimeout(async () => {
        await checkDID();
        setIsMinting(false);
        alert("🎉 Identity Verified!\n\nYour DID has been registered on XRPL Testnet.\nYou can now trade RWA assets.");
      }, 5000);

    } catch (error: any) {
      console.error("❌ DID Mint Failed:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      // Extract detailed error message
      let errorMsg = "Unknown error";
      let errorCode = "";

      if (error?.data?.error) {
        errorCode = error.data.error;
        errorMsg = error.data.error_message || errorCode;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      // Provide specific guidance based on error code
      let helpText = "\n\nTroubleshooting:";
      if (errorCode === "tecEMPTY_DID") {
        helpText += "\n❌ Transaction requires at least one DID field";
      } else if (errorCode === "tecUNFUNDED_PAYMENT" || errorCode === "terINSUF_FEE_B") {
        helpText += "\n💰 Get testnet XRP from: https://xrpl.org/xrp-testnet-faucet.html";
      } else if (errorCode === "temDISABLED") {
        helpText += "\n⚠️ DID amendment may not be enabled on this server";
      } else {
        helpText += "\n1. Ensure wallet has testnet XRP (use faucet)";
        helpText += "\n2. Check browser console for details";
        helpText += "\n3. Try disconnecting and reconnecting wallet";
      }

      alert(`❌ DID Verification Failed\n\nError: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}${helpText}`);
      setIsMinting(false);
    }
  };

  return { hasDID, isLoading, isMinting, mintDID, recheck: checkDID };
}
