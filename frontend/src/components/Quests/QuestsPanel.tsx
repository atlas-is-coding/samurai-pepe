'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { QuestItem } from './QuestItem';
import { useQuests } from './QuestsProvider';

export function QuestsPanel() {
  const { connected } = useWallet();
  const [isVisible, setIsVisible] = useState(false);
  const { quests, completeQuest, isQuestActive, isQuestCompleted } = useQuests();

  // Переключение видимости панели
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="quests-container">
      <button 
        className="quests-toggle-btn"
        onClick={toggleVisibility}
        title="Quests"
      >
        🏆
      </button>
      
      {isVisible && (
        <div className="quests-panel">
          <div className="quests-header">
            <h3>Quests</h3>
            <button className="close-btn" onClick={toggleVisibility}>&times;</button>
          </div>
          
          <div className="quests-list">
            {quests.map(quest => (
              <QuestItem 
                key={quest.id}
                id={quest.id}
                title={quest.title}
                points={quest.points}
                icon={quest.icon}
                isActive={isQuestActive(quest.id)}
                isCompleted={isQuestCompleted(quest.id)}
                onComplete={completeQuest}
              />
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .quests-container {
          position: fixed;
          right: 20px;
          top: 70px;
          z-index: 99;
        }
        
        .quests-toggle-btn {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid var(--primary, #FFD700);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .quests-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
        }
        
        .quests-panel {
          position: absolute;
          top: 50px;
          right: 0;
          width: 300px;
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid var(--primary, #FFD700);
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }
        
        .quests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }
        
        .quests-header h3 {
          margin: 0;
          color: var(--primary, #FFD700);
          font-family: 'Orbitron', sans-serif;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: var(--primary, #FFD700);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          width: 24px;
          height: 24px;
          line-height: 1;
        }
        
        .quests-list {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
} 