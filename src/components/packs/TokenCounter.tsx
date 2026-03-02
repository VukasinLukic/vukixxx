import React from 'react';

interface TokenCounterProps {
  originalTokens: number;
  toonTokens: number;
  markdownTokens: number;
  promptCount: number;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export const TokenCounter: React.FC<TokenCounterProps> = ({
  originalTokens,
  toonTokens,
  markdownTokens,
  promptCount,
}) => {
  const savingsPercent = originalTokens > 0
    ? ((1 - toonTokens / originalTokens) * 100).toFixed(0)
    : '0';

  return (
    <div className="token-stats-bar">
      <div className="token-stat">
        <span className="stat-value">{promptCount}</span>
        <span className="stat-label">Prompts</span>
      </div>
      <div className="token-stat">
        <span className="stat-value">{formatNumber(originalTokens)}</span>
        <span className="stat-label">Original</span>
      </div>
      <div className="token-stat">
        <span className="stat-value">{formatNumber(toonTokens)}</span>
        <span className="stat-label">TOON</span>
      </div>
      <div className="token-stat">
        <span className="stat-value">{formatNumber(markdownTokens)}</span>
        <span className="stat-label">Markdown</span>
      </div>
      <div className="token-stat savings">
        <span className="stat-value">{savingsPercent}%</span>
        <span className="stat-label">Savings</span>
      </div>
    </div>
  );
};
