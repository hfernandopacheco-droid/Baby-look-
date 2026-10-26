import React from 'react';

export const DiaperIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 inline-block" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6C4 5.44772 4.44772 5 5 5H19C19.5523 5 20 5.44772 20 6V8C20 8.55228 19.5523 9 19 9H5C4.44772 9 4 8.55228 4 8V6Z" fill="#3B82F6"/>
    <path d="M4 8H20V14C20 17.866 16.4183 21 12 21C7.58172 21 4 17.866 4 14V8Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.2"/>
    <path d="M6 11C7.5 13 9 14 12 14C15 14 16.5 13 18 11" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);
