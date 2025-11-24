import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { HostProfile } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import AudioVisualizer from './AudioVisualizer';

interface LiveSessionProps {
  personalityId: string;
  profiles: Record<string, HostProfile>;
  onError: (msg: string) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ personalityId, profiles, onError }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Session Refs
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const profile = profiles[personalityId];

  // Initialize Audio Contexts
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Create analysers for visualization
    if (!outputAnalyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      outputAnalyserRef.current = analyser;
    }
  }, []);

  const stopSession = useCallback(() => {
    // Clean up audio sources
    sourceNodesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourceNodesRef.current.clear();

    // Close mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    sessionRef.current = null;
    setIsConnected(false);
    setIsTalking(false);
    nextStartTimeRef.current = 0;
  }, []);

  const startSession = async () => {
    try {
      initAudio();
      const ctx = audioContextRef.current!;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Input Analyser
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      inputAnalyserRef.current = analyser;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Define the session
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voiceName } }
          },
          systemInstruction: profile.systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log('Live Session Opened');
            setIsConnected(true);

            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent } = msg;

            // Handle Audio Output
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               setIsTalking(true);
               const audioBuffer = await decodeAudioData(
                 base64ToUint8Array(base64Audio),
                 ctx,
                 24000
               );
               
               // Schedule Playback
               const sourceNode = ctx.createBufferSource();
               sourceNode.buffer = audioBuffer;
               sourceNode.connect(outputAnalyserRef.current!);
               outputAnalyserRef.current!.connect(ctx.destination);
               
               // Ensure gapless playback
               const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
               sourceNode.start(startTime);
               nextStartTimeRef.current = startTime + audioBuffer.duration;
               
               sourceNodesRef.current.add(sourceNode);
               sourceNode.onended = () => {
                 sourceNodesRef.current.delete(sourceNode);
                 if (sourceNodesRef.current.size === 0) {
                    setTimeout(() => setIsTalking(false), 200);
                 }
               };
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
              console.log('Interrupted');
              sourceNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              sourceNodesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
             console.log('Session Closed');
             setIsConnected(false);
          },
          onerror: (err) => {
             console.error('Session Error', err);
             onError("Connection error occurred.");
             stopSession();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      onError(e.message || "Failed to start live session");
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);


  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-6 bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
           {profile.imageUrl ? (
              <img src={profile.imageUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
           ) : (
              <span className={`${profile.color.replace('bg-', 'text-')} text-3xl`}>●</span>
           )}
           Live Conversation with {profile.name}
        </h2>
        <p className="text-gray-400">Speak naturally. Interrupt at any time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
        {/* User Input Visualizer */}
        <div className="relative">
             <div className="absolute top-2 left-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Microphone Input</div>
             <AudioVisualizer 
                analyser={inputAnalyserRef.current} 
                active={isConnected} 
                color="rgb(255, 255, 255)" 
             />
        </div>

        {/* AI Output Visualizer */}
        <div className="relative">
             <div className="absolute top-2 left-4 text-xs font-bold text-gray-500 uppercase tracking-wider">AI Voice Output</div>
             <AudioVisualizer 
                analyser={outputAnalyserRef.current} 
                active={isTalking} 
                color={
                   profile.imageUrl ? 'rgb(236, 72, 153)' : // Pink for custom
                   'rgb(59, 130, 246)'
                } 
             />
        </div>
      </div>

      <div className="flex justify-center">
        {!isConnected ? (
          <button
            onClick={startSession}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-green-600 font-lg rounded-full hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/50 focus:outline-none ring-offset-2 focus:ring-2 ring-green-500"
          >
            <span>Start Live Chat</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 font-lg rounded-full hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/50"
          >
            <span>End Session</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveSession;