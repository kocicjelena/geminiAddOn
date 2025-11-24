import React, { useState, useRef } from 'react';
import { HostProfile, SearchResult } from '../types';
import { searchGroundedQuery, generateSpeech } from '../services/gemini';
import AudioVisualizer from './AudioVisualizer';

interface SearchSessionProps {
  personalityId: string;
  profiles: Record<string, HostProfile>;
}

const SearchSession: React.FC<SearchSessionProps> = ({ personalityId, profiles }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const profile = profiles[personalityId];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Initialize Audio Context on user gesture
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setLoading(true);
    setResult(null);
    setIsSpeaking(false);

    // 1. Get Answer with Grounding
    const searchResult = await searchGroundedQuery(query, personalityId, profiles);
    setResult(searchResult);

    // 2. Generate Speech
    const audioBuffer = await generateSpeech(searchResult.text, personalityId, profiles, audioContextRef.current);
    setLoading(false);

    // 3. Play Audio
    if (audioBuffer && audioContextRef.current && analyserRef.current) {
      setIsSpeaking(true);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);
      source.start();
      source.onended = () => setIsSpeaking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-gray-800 rounded-3xl border border-gray-700 p-6 shadow-xl">
       <div className="flex items-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden ${profile.color}`}>
             {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
             ) : (
                "G"
             )}
          </div>
          <h2 className="text-xl font-bold text-white">Ask {profile.name} (Search Grounding)</h2>
       </div>

       <form onSubmit={handleSearch} className="flex gap-4 mb-6">
         <input 
           type="text" 
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="What's the latest news on...?" 
           className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
         <button 
           type="submit" 
           disabled={loading}
           className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
         >
           {loading ? 'Thinking...' : 'Search & Speak'}
         </button>
       </form>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
             {result && (
               <div className="bg-gray-900/50 p-4 rounded-xl animate-fade-in">
                  <p className="text-gray-200 leading-relaxed mb-4">{result.text}</p>
                  
                  {result.sources.length > 0 && (
                    <div className="border-t border-gray-700 pt-3">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Sources</p>
                      <ul className="space-y-1">
                        {result.sources.slice(0, 3).map((source, idx) => (
                          <li key={idx} className="truncate">
                             <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline flex items-center gap-2">
                               <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                               {source.title || source.uri}
                             </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
               </div>
             )}
          </div>

          <div className="flex flex-col gap-2">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audio Output</div>
             <AudioVisualizer 
                analyser={analyserRef.current} 
                active={isSpeaking} 
                color="rgb(96, 165, 250)" 
             />
          </div>
       </div>
    </div>
  );
};

export default SearchSession;