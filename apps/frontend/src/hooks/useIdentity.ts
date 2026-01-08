// apps/frontend/src/hooks/useIdentity.ts
import { useState, useEffect, useCallback } from 'react';
import { Client } from 'xrpl';
import { WalletManager } from 'xrpl-connect';
import type { ParsedDocumentData } from '../utils/documentParser';
import { Logger, logAction } from '../utils/logger';

export function useIdentity(walletAddress: string | undefined, walletManager: WalletManager) {
  const [hasDID, setHasDID] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [dryRunMode, setDryRunMode] = useState<boolean>(false); // For testing without submitting

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
  // [XLS-40 Implementation] DID Minting
  // Creates a Decentralized Identifier on XRPL for identity verification
  const mintDID = async (parsedData?: ParsedDocumentData, didPayload?: string) => {
    if (!walletAddress) return;
    
    logAction("DID Minting Initiated", {
      hasDocumentData: !!parsedData,
      hasPayload: !!didPayload,
      account: walletAddress
    });
    
    setIsMinting(true);

    let client: Client | null = null;

    try {
      // Helper function to convert string to hex (uppercase, as required by XRPL)
      // Browser-compatible version using TextEncoder
      const toHex = (str: string): string => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        return Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      };

      // Connect to XRPL Testnet
      Logger.info("Connecting to XRPL Testnet...");
      client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();
      Logger.success("Connected to XRPL Testnet");

      // Use structured DID payload if provided, otherwise use default
      let dataPayload: string;
      let uriPayload: string;

      if (didPayload && parsedData) {
        // Use the parsed document data and generated DID payload
        console.log("═══════════════════════════════════════");
        console.log("📝 USING STRUCTURED DID PAYLOAD");
        console.log("═══════════════════════════════════════");
        console.log("Document Type:", parsedData.documentType);
        console.log("Valid:", parsedData.isValid);
        console.log("Hash:", parsedData.hash);
        console.log("Payload JSON:", didPayload);
        console.log("═══════════════════════════════════════");
        
        // Use the compact JSON payload as Data field (hex-encoded)
        dataPayload = toHex(didPayload);
        // URI can reference the document hash or verification endpoint
        uriPayload = toHex(`https://rwax.sg/v/${parsedData.hash.substring(0, 16)}`);
      } else {
        // Fallback for direct minting (dev mode)
        console.log("⚠️  Using default DID payload (no document data)");
        dataPayload = toHex("Verified RWA Investor - KYC Level 1");
        uriPayload = toHex("https://rwax.sg/kyc/investor");
      }

      // Construct the XLS-40 DIDSet Transaction
      // CRITICAL: At least ONE of URI, Data, or DIDDocument must be provided
      // All fields must be hex-encoded strings
      const txBase: any = {
        TransactionType: "DIDSet",
        Account: walletAddress,
        // URI: Reference to verification endpoint or document hash
        URI: uriPayload,
        // Data: Compact JSON payload with verified information (hex-encoded)
        Data: dataPayload,
        // DIDDocument: Standard DID identifier (hex-encoded)
        // Format: did:xrpl:1:{network}:{account}
        DIDDocument: toHex(`did:xrpl:1:testnet:${walletAddress}`)
      };

      Logger.transaction("DIDSet", {
        account: walletAddress,
        hasDocumentData: !!parsedData,
        payloadSize: didPayload?.length || 0
      });
      
      // Decode for logging purposes (browser-compatible hex decode)
      const hexToBytes = (hex: string): Uint8Array => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
      };
      const decoder = new TextDecoder();
      console.log("Transaction (decoded):", {
        URI: decoder.decode(hexToBytes(uriPayload)),
        Data: decoder.decode(hexToBytes(dataPayload)),
        DIDDocument: `did:xrpl:1:testnet:${walletAddress}`
      });

      // CRITICAL: Prepare the transaction (autofills Fee, Sequence, LastLedgerSequence)
      const prepared = await client.autofill(txBase);
      console.log("✅ Transaction prepared:", prepared);
      console.log("📋 Transaction details:", {
        TransactionType: prepared.TransactionType,
        Account: prepared.Account,
        Fee: prepared.Fee,
        Sequence: prepared.Sequence,
        URI: prepared.URI,
        Data: prepared.Data,
        DIDDocument: prepared.DIDDocument
      });

      // IMPORTANT: Check if wallet is connected before attempting to sign
      if (!walletManager.connected) {
        throw new Error("Wallet is not connected. Please connect your wallet first.");
      }

      // Calculate transaction fee for user info
      const feeInXRP = prepared.Fee ? (parseInt(prepared.Fee) / 1000000).toFixed(6) : "~0.00001";
      
      Logger.transaction("DIDSet - Transaction Summary", {
        type: "Create Decentralized Identifier",
        network: "XRPL Testnet",
        account: walletAddress,
        fee: `${feeInXRP} XRP`,
        note: "XLS-40 Implementation"
      });
      
      // DRY RUN MODE: Just show the transaction without submitting
      if (dryRunMode) {
        Logger.info("DRY RUN MODE: Transaction prepared but NOT submitted", {
          fee: `${feeInXRP} XRP`,
          transaction: prepared
        });
        alert(`🔍 DRY RUN MODE\n\nTransaction prepared successfully!\n\nFee: ${feeInXRP} XRP\n\nTo actually submit, disable dry run mode.`);
        setIsMinting(false);
        if (client) {
          await client.disconnect();
          client = null;
        }
        return;
      }

      // [XLS-40 Implementation] Sign & Submit via walletManager.signAndSubmit()
      // This will prompt the user to approve the transaction in their wallet
      Logger.wallet("Requesting wallet signature...", {
        account: walletAddress,
        fee: `${feeInXRP} XRP`,
        note: "Please approve transaction in wallet popup"
      });
      
      // Use signAndSubmit method (correct API from xrpl-connect)
      // First parameter: transaction object
      // Second parameter: submit to ledger (true = submit, false = sign only)
      const result = await walletManager.signAndSubmit(prepared, true);
      
      Logger.didMint("DID Transaction Submitted Successfully", {
        hash: result?.hash,
        account: walletAddress
      });
      
      if (!result || !result.hash) {
        throw new Error("Transaction was signed but no hash returned. It may have been rejected or failed to submit.");
      }
      
      Logger.info("Transaction Details", {
        hash: result.hash,
        xrpscan: `https://testnet.xrpscan.com/tx/${result.hash}`
      });

      // Disconnect client after signing
      if (client) {
        await client.disconnect();
        client = null;
      }

      // Wait a moment for transaction to be included in ledger
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Force a re-check loop with multiple attempts
      let attempts = 0;
      const maxAttempts = 10;
      let found = false;
      
      const interval = setInterval(async () => {
        attempts++;
        
        // Check DID status
        if (!walletAddress) {
          clearInterval(interval);
          setIsMinting(false);
          return;
        }

        try {
          const checkClient = new Client("wss://s.altnet.rippletest.net:51233");
          await checkClient.connect();

          const response = await checkClient.request({
            command: "account_objects",
            account: walletAddress,
            type: "did"
          });

          found = response.result.account_objects.length > 0;
          setHasDID(found);
          
          await checkClient.disconnect();
          
          if (found) {
            clearInterval(interval);
            setIsMinting(false);
            alert("🎉 Identity Verified!\n\nYour DID has been registered on XRPL Testnet.\nYou can now trade RWA assets.");
            return;
          }
        } catch (error) {
          console.error("DID Check Failed:", error);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsMinting(false);
          if (!found) {
            // Transaction might be pending - suggest checking later
            alert("✅ DID Transaction Submitted!\n\nVerification may take a few moments. Please refresh the page to check status.");
          }
        }
      }, 2000); // Check every 2s

      // Fallback timeout if interval doesn't complete
      setTimeout(() => {
        clearInterval(interval);
        setIsMinting(false);
      }, 25000);

    } catch (error: any) {
      console.error("❌ DID Mint Failed:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      // Clean up client connection
      if (client) {
        try {
          await client.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        client = null;
      }

      // Extract detailed error message
      let errorMsg = "Unknown error";
      let errorCode = "";
      let errorDetails = "";

      // Handle different error formats
      if (error?.data) {
        errorCode = error.data.error || error.data.error_code || "";
        errorMsg = error.data.error_message || error.data.message || errorCode || "Transaction failed";
        errorDetails = error.data.error_exception || "";
      } else if (error?.result) {
        errorCode = error.result.error || error.result.error_code || "";
        errorMsg = error.result.error_message || error.result.message || errorCode || "Transaction failed";
      } else if (error?.error) {
        errorCode = error.error.error || error.error.error_code || "";
        errorMsg = error.error.error_message || error.error.message || errorCode || "Transaction failed";
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      // Provide specific guidance based on error code
      let helpText = "\n\nTroubleshooting:";
      if (errorCode === "tecEMPTY_DID" || errorMsg.includes("EMPTY_DID")) {
        helpText += "\n❌ Transaction requires at least one DID field (URI, Data, or DIDDocument)";
      } else if (errorCode === "tecUNFUNDED_PAYMENT" || errorCode === "terINSUF_FEE_B" || errorMsg.includes("unfunded") || errorMsg.includes("insufficient")) {
        helpText += "\n💰 Insufficient XRP: Get testnet XRP from faucet";
        helpText += "\n   https://xrpl.org/xrp-testnet-faucet.html";
        helpText += "\n   (Need ~10-15 XRP for account reserve + transaction fee)";
      } else if (errorCode === "temDISABLED" || errorMsg.includes("DISABLED")) {
        helpText += "\n⚠️ DID amendment may not be enabled on this server";
      } else if (errorMsg.includes("rejected") || errorMsg.includes("denied")) {
        helpText += "\n❌ Transaction was rejected by wallet";
        helpText += "\n   Please approve the transaction in your wallet popup";
      } else if (errorMsg.includes("network") || errorMsg.includes("connection")) {
        helpText += "\n🌐 Network connection issue";
        helpText += "\n   Check your internet connection and try again";
      } else {
        helpText += "\n1. Ensure wallet has testnet XRP (10-15 XRP minimum)";
        helpText += "\n2. Check browser console for detailed logs";
        helpText += "\n3. Try disconnecting and reconnecting wallet";
        helpText += "\n4. Ensure you approve the transaction in wallet popup";
      }

      if (errorDetails) {
        console.error("Error Details:", errorDetails);
      }

      alert(`❌ DID Verification Failed\n\nError: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}${helpText}`);
      setIsMinting(false);
    }
  };

  return { 
    hasDID, 
    isLoading, 
    isMinting, 
    mintDID, 
    recheck: checkDID,
    dryRunMode,
    setDryRunMode
  };
}
