
import React from 'react';

interface LeaderboardHeaderProps {
  title: string;
  subtitle: string;
}

const LeaderboardHeader = ({ title, subtitle }: LeaderboardHeaderProps) => {
  return (
    <div className="mb-8 animate-slide-up">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
};

export default LeaderboardHeader;
