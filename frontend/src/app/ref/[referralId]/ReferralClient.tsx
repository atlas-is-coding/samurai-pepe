'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Button } from '@/components/ui/Button';

// Import styles for wallet buttons
import '@solana/wallet-adapter-react-ui/styles.css';

// Configure RPC endpoint for Solana
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Get Solana network from environment variables
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

interface ReferralClientProps {
  inviteCode: string;
}

function ReferralContent({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Function to open wallet selection modal
  const handleConnectClick = () => {
    // Find wallet button and programmatically click on it
    const walletButton = document.querySelector('.wallet-adapter-button-trigger');
    if (walletButton instanceof HTMLElement) {
      walletButton.click();
    }
  };
  
  // Handle user referral link navigation
  useEffect(() => {
    // Save referral information in localStorage
    if (inviteCode) {
      localStorage.setItem('inviteCode', inviteCode);
    }
  }, [inviteCode]);
  
  // Register referral after wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      // If user navigated via referral link and connected wallet
      // send information about the referral to the server
      const trackReferral = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // This function should be called after NFT purchase, but for demonstration we do it immediately
          // In a real application this should happen after purchase confirmation
          const response = await fetch('/api/invite', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: publicKey.toString(),
              inviteCode
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'An error occurred during referral registration');
          }
          
          setSuccess(true);
          
          // Redirect user to home page after short delay
          setTimeout(() => {
            router.push('/');
          }, 3000);
          
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      
      // For demonstration we just launch it, in a real application it should be launched after NFT purchase
      trackReferral();
    }
  }, [connected, publicKey, inviteCode, router]);
  
  return (
    <div className="referral-page">
      <div className="referral-container">
        <h1>Welcome to Samurai Pepe</h1>
        <p>You were invited with code: <span className="invite-code">{inviteCode}</span></p>
        
        {!connected && (
          <div className="connect-wallet-section">
            <p>Connect your wallet to receive bonus points</p>
            {/* Our custom button */}
            <Button onClick={handleConnectClick}>
              CONNECT WALLET
            </Button>
            
            {/* Original wallet connection button (hidden) */}
            <div className="hidden-wallet-button">
              <WalletMultiButton />
            </div>
          </div>
        )}
        
        {connected && publicKey && (
          <div className="connected-info">
            <p>Wallet Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</p>
            <p>Now you can earn 5 points by purchasing an NFT!</p>
            <Button onClick={() => router.push('/mint')}>Go to Mint Page</Button>
          </div>
        )}
        
        {isLoading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {success && (
          <div className="success-message">
            <p>Referral successfully registered!</p>
            <p>You received 5 points, and the inviting user received 10 points.</p>
            <p>Redirecting to home page...</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .referral-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: var(--dark);
          padding: 20px;
        }
        
        .referral-container {
          max-width: 600px;
          padding: 30px;
          background: var(--dark-accent);
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);
          text-align: center;
        }
        
        h1 {
          color: var(--primary);
          margin-bottom: 20px;
          font-family: 'Orbitron', sans-serif;
        }
        
        p {
          margin-bottom: 20px;
          color: #fff;
        }
        
        .invite-code {
          color: var(--primary);
          font-weight: bold;
          font-size: 1.5em;
          letter-spacing: 2px;
        }
        
        .connect-wallet-section {
          margin: 30px 0;
          position: relative;
        }
        
        .hidden-wallet-button {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          overflow: hidden;
        }
        
        .connected-info {
          margin: 30px 0;
          padding: 20px;
          background: rgba(255, 215, 0, 0.05);
          border-radius: 10px;
        }
        
        .error-message {
          color: #ff5555;
          margin: 20px 0;
        }
        
        .success-message {
          color: #51ff00;
          margin: 20px 0;
          padding: 20px;
          background: rgba(81, 255, 0, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export function ReferralClient({ inviteCode }: ReferralClientProps) {
  // Настраиваем кошелек и сеть
  const network = NETWORK === 'mainnet-beta' 
    ? WalletAdapterNetwork.Mainnet 
    : NETWORK === 'testnet' 
      ? WalletAdapterNetwork.Testnet 
      : WalletAdapterNetwork.Devnet;
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ];
  
  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ReferralContent inviteCode={inviteCode} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 