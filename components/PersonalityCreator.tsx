import React, { useState } from 'react';
import { HostProfile } from '../types';
import { generateHostImage } from '../services/gemini';

interface PersonalityCreatorProps {
  onCreated: (profile: HostProfile) => void;
  onCancel: () => void;
}

const VOICES = ['Zephyr', 'Charon', 'Puck', 'Kore', 'Fenrir'];

const PersonalityCreator: React.FC<PersonalityCreatorProps> = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // The "3 words"
  const [systemInstruction, setSystemInstruction] = useState('');
  const [voice, setVoice] = useState('Zephyr');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !systemInstruction) return;

    setLoading(true);

    try {
      const imageUrl = await generateHostImage(description);
      
      const newProfile: HostProfile = {
        id: `custom-${Date.now()}`,
        name,
        description,
        systemInstruction,
        voiceName: voice,
        color: 'bg-pink-500', // Default color for custom
        imageUrl: imageUrl || undefined
      };

      onCreated(newProfile);
    } catch (err) {
      console.error("Failed to create profile", err);
      // Fallback if image generation fails, still create the profile
      const newProfile: HostProfile = {
        id: `custom-${Date.now()}`,
        name,
        description,
        systemInstruction,
        voiceName: voice,
        color: 'bg-pink-500',
      };
      onCreated(newProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Create Custom Host</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">&times;</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Orion"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Voice</label>
            <select 
              value={voice} 
              onChange={(e) => setVoice(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visual Description (3 Words)</label>
          <input
            required
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Cyberpunk, Neon, Rebel"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">This will be used to generate the avatar.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Personality Instructions</label>
          <textarea
            required
            rows={3}
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="e.g., You are a rebellious AI living in the year 3000. You use slang like 'nova' and 'glitch'. You are skeptical but ultimately helpful."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Avatar & Profile...
            </>
          ) : 'Create Host'}
        </button>
      </form>
    </div>
  );
};

export default PersonalityCreator;