// apps/frontend/src/hooks/useIdentity.ts
import { useState, useEffect } from 'react';
import { Client } from 'xrpl';

export function useIdentity(walletAddress: string | undefined) {
  const [hasDID, setHasDID] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!walletAddress) {
      setHasDID(false);
      return;
    }

    const checkDID = async () => {
      setIsLoading(true);
      try {
        const client = new Client("wss://s.altnet.rippletest.net:51233");
        await client.connect();
        const response = await client.request({
          command: "account_objects",
          account: walletAddress,
          type: "did"
        });
        setHasDID(response.result.account_objects.length > 0);
        await client.disconnect();
      } catch (e) {
        console.error("DID check failed:", e);
        setHasDID(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDID();
  }, [walletAddress]);

  return { hasDID, isLoading };
}
