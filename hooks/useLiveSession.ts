import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed non-exported type `LiveSession`.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SessionState, TranscriptionPart } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { API_KEY } from '../config';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const useLiveSession = (systemInstruction: string) => {
    const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
    const [transcription, setTranscription] = useState<TranscriptionPart[]>([]);
    const [streamingInputText, setStreamingInputText] = useState('');
    const [streamingOutputText, setStreamingOutputText] = useState('');
    const [error, setError] = useState<string | null>(null);

    // FIX: Replaced `LiveSession` with `any` as the type is not exported from the library.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const sessionRef = useRef<any | null>(null); // To hold the resolved session object for performance
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const activeAudioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef<number>(0);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const isEndingRef = useRef(false);

    const stopAudioProcessing = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
            inputAudioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    const stopPlayback = useCallback(() => {
        activeAudioSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors if source already stopped
            }
        });
        activeAudioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
            outputAudioContextRef.current = null;
        }
    }, []);

    const fullCleanup = useCallback(() => {
        console.log("Running full cleanup of session resources.");
        stopAudioProcessing();
        stopPlayback();
        sessionPromiseRef.current = null;
        sessionRef.current = null; // Also clear the session ref
    }, [stopAudioProcessing, stopPlayback]);

    const endSession = useCallback(async () => {
        if (isEndingRef.current || !sessionPromiseRef.current) {
            return;
        }
        console.log("Attempting to end session gracefully.");
        isEndingRef.current = true;
        stopAudioProcessing();

        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (err) {
            console.warn("Could not get session to close it; forcing cleanup.", err);
            // Don't set state here. The onclose callback is the source of truth for the final state.
            // Just ensure resources are released if closing fails.
            fullCleanup();
        }
    }, [fullCleanup, stopAudioProcessing]);

    useEffect(() => {
        return () => {
            endSession();
        };
    }, [endSession]);

    const startSession = useCallback(async () => {
        isEndingRef.current = false;
        setSessionState(SessionState.CONNECTING);
        setError(null);
        setTranscription([]);
        setStreamingInputText('');
        setStreamingOutputText('');
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        if (!API_KEY) {
            setError("API key is not configured in config.ts. Please add it to continue.");
            setSessionState(SessionState.ERROR);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setSessionState(SessionState.LISTENING);
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        sourceNodeRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            // Send audio data using the resolved session object for better performance and stability.
                            if (sessionRef.current && !isEndingRef.current) {
                                try {
                                    sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                                } catch (err) {
                                    console.error("Error sending audio data to Gemini:", err);
                                    // If the WebSocket is closed, stop processing to avoid further errors
                                    stopAudioProcessing();
                                }
                            }
                        };
                        
                        // To prevent an audio feedback loop while ensuring the script processor runs,
                        // we connect it to a muted GainNode, which is then connected to the destination.
                        const gainNode = inputAudioContextRef.current.createGain();
                        gainNode.gain.value = 0; // Mute the node

                        source.connect(scriptProcessor);
                        scriptProcessor.connect(gainNode);
                        gainNode.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        try {
                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                setSessionState(SessionState.THINKING);

                                const outputContext = outputAudioContextRef.current;
                                if (outputContext) {
                                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, OUTPUT_SAMPLE_RATE, 1);
                                    const source = outputContext.createBufferSource();
                                    source.buffer = audioBuffer;
                                    source.connect(outputContext.destination);
                                    source.addEventListener('ended', () => {
                                        activeAudioSourcesRef.current.delete(source);
                                        if(activeAudioSourcesRef.current.size === 0) {
                                            setSessionState(SessionState.LISTENING);
                                        }
                                    });
                                    source.start(nextStartTimeRef.current);
                                    nextStartTimeRef.current += audioBuffer.duration;
                                    activeAudioSourcesRef.current.add(source);
                                }
                            }

                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                                setStreamingInputText(currentInputTranscriptionRef.current);
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                                setStreamingOutputText(currentOutputTranscriptionRef.current);
                            }
                            
                            if (message.serverContent?.turnComplete) {
                                const userInput = currentInputTranscriptionRef.current.trim();
                                const aiOutput = currentOutputTranscriptionRef.current.trim();
                                
                                setTranscription(prev => {
                                    const newTranscription = [...prev];
                                    if(userInput) newTranscription.push({ speaker: 'user', text: userInput });
                                    if(aiOutput) newTranscription.push({ speaker: 'ai', text: aiOutput });
                                    return newTranscription;
                                });

                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                                setStreamingInputText('');
                                setStreamingOutputText('');
                            }
                        } catch (err) {
                            console.error("Error processing message:", err);
                            setError("An error occurred while processing the AI's response.");
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        // Log the transport-level error, but delegate state changes to onclose
                        // for a single, reliable source of truth on connection status.
                        console.error("Live session error event:", e);
                    },
                    onclose: (e: CloseEvent) => {
                        console.log(`Session closed. Code: ${e.code}, Reason: '${e.reason}', Was clean: ${e.wasClean}`);

                        if (isEndingRef.current) {
                            // Session ended intentionally by the user.
                            setSessionState(SessionState.FINISHED);
                        } else if (e.wasClean === false) {
                            // Session closed unexpectedly (e.g., network loss).
                            setError("The connection was lost unexpectedly. Please check your network and try again.");
                            setSessionState(SessionState.ERROR);
                        } else {
                            // Session closed cleanly but unexpectedly. Treat as finished.
                            setSessionState(SessionState.FINISHED);
                        }
                        fullCleanup();
                    },
                },
            });
            
            sessionPromiseRef.current = sessionPromise;
            // Store the resolved session for use in `onaudioprocess`
            sessionPromise.then(session => {
                sessionRef.current = session;
            }).catch(() => { /* Main catch block will handle UI */ });
            
            await sessionPromise;

        } catch (err) {
            console.error('Failed to start session:', err);
            let errorMessage = 'An unknown error occurred while starting the session.';
            if (err instanceof Error) {
                 if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
                    errorMessage = 'Microphone access denied. Please enable permissions in your browser settings and refresh.';
                } else if (err.message.toLowerCase().includes('network')) {
                    errorMessage = 'Network error on connection. Please check your internet and try again.';
                } else {
                    errorMessage = `Failed to start session: ${err.message}`;
                }
            }
            setError(errorMessage);
            setSessionState(SessionState.ERROR);
            fullCleanup();
        }
    }, [systemInstruction, fullCleanup]);

    return { sessionState, transcription, streamingInputText, streamingOutputText, error, startSession, endSession };
};