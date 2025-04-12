import { NFTStore } from '@/components/NFT/NFTStore';

export default function NFTPage() {
  return (
    <main className="main-container">
      <div className="nft-section">
        <NFTStore />
      </div>
    </main>
  );
}

export const metadata = {
  title: 'NFT Collection | Samurai Pepe',
  description: 'Коллекция NFT Samurai Pepe - уникальные цифровые активы на блокчейне Solana'
}; 