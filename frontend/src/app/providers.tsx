'use client';

import { ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { QuestsProvider } from '@/components/Quests/QuestsProvider';
import { SolanaNftProvider } from '@/context/SolanaNftProvider';

// Import styles for wallet buttons
import '@solana/wallet-adapter-react-ui/styles.css';

// Configure custom RPC endpoint with higher request limits
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Get Solana network from environment variables
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

interface ProvidersProps {
  children: ReactNode;
}

// Function to clear all cookies
function clearAllCookies() {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
}

// Function to clear localStorage
function clearLocalStorage() {
  try {
    // Save only certain items that shouldn't be cleared
    const itemsToKeep: string[] = [
      // Add any localStorage items you want to keep here
    ];
    
    // Create a backup of items to keep
    const backup: Record<string, string> = {};
    itemsToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore saved items
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

// Wallet change watcher component
function WalletChangeWatcher() {
  const { publicKey } = useWallet();
  
  useEffect(() => {
    // When wallet changes (publicKey changes), clear all cookies and localStorage
    clearAllCookies();
    clearLocalStorage();
    console.log("Wallet changed, cookies and localStorage cleared");
  }, [publicKey]);
  
  return null;
}

export function Providers({ children }: ProvidersProps) {
  // Define Solana network (using devnet instead of mainnet for testing)
  const network = NETWORK === 'mainnet-beta' 
    ? WalletAdapterNetwork.Mainnet 
    : NETWORK === 'testnet' 
      ? WalletAdapterNetwork.Testnet 
      : WalletAdapterNetwork.Devnet;
  
  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletChangeWatcher />
          <QuestsProvider>
            <SolanaNftProvider>
              {children}
            </SolanaNftProvider>
          </QuestsProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 