import React from 'react';
import { HostProfile } from '../types';

interface PersonalitySelectorProps {
  currentPersonalityId: string;
  profiles: Record<string, HostProfile>;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({ currentPersonalityId, profiles, onSelect, onCreateNew }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      {(Object.values(profiles) as HostProfile[]).map((profile) => {
        const isSelected = currentPersonalityId === profile.id;
        return (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300 text-left
              flex flex-col gap-2 h-full
              ${isSelected 
                ? `border-${profile.color.replace('bg-', '')} bg-gray-800 shadow-lg shadow-${profile.color.replace('bg-', '')}/20` 
                : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-600'}
            `}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden
              ${profile.color}
            `}>
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{profile.name[0]}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{profile.name}</h3>
              <p className="text-gray-400 text-xs line-clamp-2">{profile.description}</p>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <span className="flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${profile.color}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${profile.color}`}></span>
                </span>
              </div>
            )}
          </button>
        );
      })}
      
      {/* Create New Button */}
      <button
        onClick={onCreateNew}
        className="
          p-4 rounded-xl border-2 border-dashed border-gray-600 bg-gray-800/30 
          hover:bg-gray-800 hover:border-gray-500 transition-all duration-300
          flex flex-col items-center justify-center gap-2 h-full text-gray-400 hover:text-white
        "
      >
        <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="font-bold text-sm">Create Host</span>
      </button>
    </div>
  );
};

export default PersonalitySelector;