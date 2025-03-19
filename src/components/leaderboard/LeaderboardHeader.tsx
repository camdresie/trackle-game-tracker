
import React from 'react';

interface LeaderboardHeaderProps {
  title: string;
  subtitle: string;
  extraText?: string; // Added extraText as an optional prop
}

const LeaderboardHeader = ({ title, subtitle, extraText }: LeaderboardHeaderProps) => {
  return (
    <div className="mb-8 animate-slide-up">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
      {extraText && <p className="text-sm text-muted-foreground mt-1">{extraText}</p>}
    </div>
  );
};

export default LeaderboardHeader;
