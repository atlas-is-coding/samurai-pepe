'use client';

import './TeamSection.css';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

export function TeamSection() {
  const teamMembers: TeamMember[] = [
    {
      name: "Hirotaka Takeuchi",
      role: "Project Founder",
      image: "/hirotaka-takeuchi.jpg",
      description: "Co-founder of MaiCoin, a leading Taiwanese-Japanese crypto company. Hirotaka brings extensive experience in managing mining pools and farms, driving Samurai Pepe's technological innovation."
    },
    {
      name: "Shogo Onoe",
      role: "Project Designer",
      image: "/shogo-onoe.jpg",
      description: "Creative Director at Oasys, the Japanese blockchain for gaming. Shogo's expertise in NFT collections and gamified crypto projects brings a unique flair to Samurai Pepe's visual identity and user experience."
    },
    {
      name: "Takafumi Horie",
      role: "Strategic Investor",
      image: "/takafumi-horie.jpg",
      description: "Founder of Internet Initiative Japan (IIJ) and former CEO of Livedoor. A seasoned entrepreneur and crypto enthusiast, Takafumi's insights and connections are invaluable to Samurai Pepe's growth strategy."
    }
  ];

  return (
    <section className="team-section">
      <h2>Meet Our Visionary Team</h2>
      
      <div className="team-container">
        {teamMembers.map((member, index) => (
          <div key={index} className="team-member">
            <div className="member-image">
              <img src={member.image} alt={member.name} />
            </div>
            <h3>{member.name}</h3>
            <p className="member-role">{member.role}</p>
            <p className="member-description">{member.description}</p>
          </div>
        ))}
      </div>
      
      <p className="join-text">Join us on this extraordinary journey where ancient traditions meet the technology of the future!</p>
    </section>
  );
}