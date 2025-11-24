import React, { useState } from 'react';
import { Personality, HOST_PROFILES, HostProfile } from './types';
import PersonalitySelector from './components/PersonalitySelector';
import LiveSession from './components/LiveSession';
import SearchSession from './components/SearchSession';
import PersonalityCreator from './components/PersonalityCreator';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Record<string, HostProfile>>(HOST_PROFILES);
  const [currentPersonalityId, setCurrentPersonalityId] = useState<string>(Personality.HELPFUL);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProfile = (newProfile: HostProfile) => {
    setProfiles(prev => ({
      ...prev,
      [newProfile.id]: newProfile
    }));
    setCurrentPersonalityId(newProfile.id);
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Gemini Host Studio
            </h1>
            <p className="text-gray-400 mt-2">
              Choose your AI host or create a new one to start a conversation.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">System Ready</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 flex justify-between items-center">
             <span>{error}</span>
             <button onClick={() => setError(null)} className="text-white hover:text-gray-200">&times;</button>
          </div>
        )}

        <section className="mb-8">
           <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Select Host Personality
          </h2>
          
          {isCreating ? (
            <PersonalityCreator 
              onCreated={handleCreateProfile} 
              onCancel={() => setIsCreating(false)} 
            />
          ) : (
            <PersonalitySelector 
              currentPersonalityId={currentPersonalityId} 
              profiles={profiles}
              onSelect={setCurrentPersonalityId}
              onCreateNew={() => setIsCreating(true)}
            />
          )}
        </section>

        <main className="space-y-12">
          {/* Live Section */}
          <section>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                 </svg>
                 Real-time Voice Chat (Live API)
               </h2>
               <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">Low Latency</span>
             </div>
             <LiveSession 
               personalityId={currentPersonalityId} 
               profiles={profiles}
               onError={setError} 
             />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800"></div>

          {/* Search Section */}
          <section>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                 </svg>
                 Information Desk (Search Grounding + TTS)
               </h2>
               <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">High Accuracy</span>
             </div>
             <SearchSession 
                personalityId={currentPersonalityId} 
                profiles={profiles}
             />
          </section>
        </main>

        <footer className="mt-20 py-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Powered by Gemini 2.5 Flash, Live API & Search Grounding</p>
        </footer>
      </div>
    </div>
  );
};

export default App;