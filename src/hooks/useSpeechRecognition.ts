import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSpeechRecognitionProps {
  roomId: string;
  userId: string;
  participantSide?: 'side_a' | 'side_b';
  isAnchor: boolean;
  autoStart?: boolean; // New prop for automatic starting
}

export function useSpeechRecognition({ 
  roomId, 
  userId, 
  participantSide, 
  isAnchor,
  autoStart = true // Default to auto-start
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);
  const [autoRestartCount, setAutoRestartCount] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoStartedRef = useRef(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      setAutoRestartCount(0);
      console.log(`🎙️ Auto-captions started for ${participantSide} side`);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎙️ Speech recognition ended');
      
      // Auto-restart if this is an anchor and we should auto-start
      if (isAnchor && autoStart && participantSide && autoRestartCount < 10) {
        console.log(`🔄 Auto-restarting captions for ${participantSide} (attempt ${autoRestartCount + 1})`);
        setAutoRestartCount(prev => prev + 1);
        
        // Restart after a short delay
        autoRestartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Auto-restart failed:', err);
              // Try again after longer delay
              setTimeout(() => {
                if (recognitionRef.current && !isListening) {
                  try {
                    recognitionRef.current.start();
                  } catch (retryErr) {
                    console.error('Auto-restart retry failed:', retryErr);
                  }
                }
              }, 5000);
            }
          }
        }, 1000 + (autoRestartCount * 500)); // Increasing delay
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Handle different error types
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access for automatic captions.');
      } else if (event.error === 'no-speech') {
        // This is normal, just restart
        console.log('No speech detected, will auto-restart...');
      } else if (event.error === 'network') {
        setError('Network error. Captions will retry automatically.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = async (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the display transcript
      setTranscript(finalTranscriptRef.current + finalTranscript + interimTranscript);

      // Save final results to database with correct side attribution
      if (finalTranscript.trim() && participantSide && isAnchor) {
        finalTranscriptRef.current += finalTranscript;
        
        try {
          console.log(`💾 Auto-saving caption for ${participantSide}: "${finalTranscript.trim()}"`);
          
          const { error: insertError } = await supabase.from('captions').insert({
            room_id: roomId,
            user_id: userId,
            participant_side: participantSide, // Correct side attribution
            content: finalTranscript.trim(),
            confidence: event.results[event.resultIndex]?.[0]?.confidence || 0.9,
            is_final: true
          });

          if (insertError) {
            console.error('Failed to save auto-caption:', insertError);
          } else {
            console.log(`✅ Auto-caption saved for ${participantSide} side`);
          }
        } catch (err) {
          console.error('Failed to save auto-caption:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [roomId, userId, participantSide, isAnchor, autoStart, autoRestartCount]);

  // Auto-start for anchors when component mounts
  useEffect(() => {
    if (isAnchor && autoStart && participantSide && isSupported && !isAutoStartedRef.current) {
      console.log(`🚀 Auto-starting captions for ${participantSide} anchor`);
      isAutoStartedRef.current = true;
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  }, [isAnchor, autoStart, participantSide, isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || !participantSide) {
      if (!participantSide) {
        setError('Cannot start recording: participant side not determined');
      }
      return;
    }

    try {
      finalTranscriptRef.current = '';
      setTranscript('');
      setError('');
      setAutoRestartCount(0);
      recognitionRef.current.start();
      console.log(`🎙️ Starting speech recognition for ${participantSide} side`);
    } catch (err) {
      setError('Failed to start speech recognition');
      console.error('Failed to start speech recognition:', err);
    }
  }, [isSupported, participantSide]);

  const stopListening = useCallback(() => {
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      console.log('🛑 Manually stopping speech recognition');
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    autoRestartCount
  };
}