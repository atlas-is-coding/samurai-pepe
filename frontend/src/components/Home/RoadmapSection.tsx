'use client';

import './RoadmapSection.css';

export function RoadmapSection() {
  const roadmapSteps = [
    {
      phase: 'Step 1: Preparation Phase',
      items: [
        "Smart Contract Audit: Ensure Samurai Pepe's smart contract is fully audited and secure",
        'Presale Launch: Initiate presale across all social channels with major marketing campaigns',
        'Community Building: Engage crypto influencers and host NFT giveaways to grow our Samurai army',
      ],
      status: 'completed'
    },
    {
      phase: 'Step 2: Expansion Phase',
      items: [
        'Global Outreach: Launch viral social media contests on platforms like TikTok and Instagram',
        'NFT Marketplace: Develop and launch our exclusive Samurai Pepe NFT marketplace',
        'Partnerships: Collaborate with Japanese crypto projects and cultural institutions',
      ],
      status: 'in-progress'
    },
    {
      phase: 'Step 3: Domination Phase',
      items: [
        'Exchange Listings: List $SPPE on major global exchanges with various trading pairs',
        'Samurai Pepe DEX: Launch our decentralized exchange for seamless $SPPE trading',
        'Real-world Integration: Explore partnerships with Japanese businesses for $SPPE adoption',
      ],
      status: 'upcoming'
    },
    {
      phase: 'Step 4: Legacy Phase',
      items: [
        'Blockchain Innovation: Develop Samurai-themed blockchain solutions',
        'Global Samurai Summit: Host an international crypto conference in Japan',
        'Charitable Initiatives: Launch programs to support traditional Japanese arts and culture',
      ],
      status: 'upcoming'
    }
  ];

  return (
    <section id="roadmap" className="roadmap">
      <h2>Roadmap</h2>
      <div className="roadmap-container">
        {roadmapSteps.map((step, index) => (
          <div key={index} className={`roadmap-step ${step.status}`}>
            <h3>{step.phase}</h3>
            <ul>
              {step.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
            <div className="status-badge">{step.status}</div>
          </div>
        ))}
      </div>
    </section>
  );
} 