'use client';

interface NftCardProps {
  type: 'common' | 'rare' | 'legendary';
  title: string;
  videoSrc: string;
  price?: number;
}

export function NftCard({ type, title, videoSrc, price }: NftCardProps) {
  return (
    <div className={`nft-card ds ${type} ds`}>
      <video 
        src={videoSrc} 
        style={{ 
          width: '110px', 
          height: 'auto', 
          position: 'absolute', 
          top: '60%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        }} 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        Your browser does not support the video tag.
      </video>                   
      <h3>{title}</h3>
      {price !== undefined && (
        <div className="nft-price">
          <span>{price} SOL</span>
        </div>
      )}
    </div>
  );
} 