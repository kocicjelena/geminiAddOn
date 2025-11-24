import { GoogleGenAI, Modality } from "@google/genai";
import { HOST_PROFILES, SearchResult } from "../types";
import { decodeAudioData, base64ToUint8Array } from "../utils/audioUtils";

// Initialize the client once if possible, or per call if key changes (though env is static here)
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs a search-grounded query using gemini-2.5-flash.
 */
export async function searchGroundedQuery(
  prompt: string,
  personalityId: string,
  profiles: typeof HOST_PROFILES
): Promise<SearchResult> {
  const client = getClient();
  const profile = profiles[personalityId];
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `${profile.systemInstruction} If you use Search, summarize the findings clearly.`,
      },
    });

    const text = response.text || "I couldn't find an answer to that.";
    
    // Extract grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((chunk) => chunk.web)
      .filter((web) => web !== undefined && web !== null)
      .map((web) => ({ uri: web!.uri, title: web!.title }));

    return { text, sources };
  } catch (error) {
    console.error("Search Query Error:", error);
    return { text: "I'm having trouble accessing my search tools right now.", sources: [] };
  }
}

/**
 * Generates speech from text using gemini-2.5-flash-preview-tts.
 */
export async function generateSpeech(
  text: string,
  personalityId: string,
  profiles: typeof HOST_PROFILES,
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  const client = getClient();
  const profile = profiles[personalityId];

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: profile.voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.warn("No audio data returned");
      return null;
    }

    const audioBytes = base64ToUint8Array(base64Audio);
    return await decodeAudioData(audioBytes, audioContext, 24000, 1);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

/**
 * Generates a personality avatar based on a short description.
 */
export async function generateHostImage(description: string): Promise<string | null> {
  const client = getClient();
  try {
    // Construct a specific prompt for a consistent style
    const prompt = `A high-quality, digital art portrait of a character described as: ${description}. The character is facing forward, suitable for a user profile avatar. Vivid colors, detailed.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}