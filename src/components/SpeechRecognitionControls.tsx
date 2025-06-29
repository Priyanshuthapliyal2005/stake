import React from 'react';
import { motion } from 'framer-motion';
import { Subtitles, Volume2, VolumeX, AlertCircle, Mic, MicOff, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SpeechRecognitionControlsProps {
  roomId: string;
  userId: string;
  participantSide?: 'side_a' | 'side_b';
  isAnchor: boolean;
  isEnabled: boolean;
  onToggleEnabled: () => void;
}

export function SpeechRecognitionControls({
  roomId,
  userId,
  participantSide,
  isAnchor,
  isEnabled,
  onToggleEnabled
}: SpeechRecognitionControlsProps) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    autoRestartCount
  } = useSpeechRecognition({
    roomId,
    userId,
    participantSide,
    isAnchor,
    autoStart: true // Always auto-start for anchors
  });

  // For anchors: Show automatic caption status (no manual controls)
  if (isAnchor) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Automatic Speech Captions</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              participantSide === 'side_a' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {participantSide === 'side_a' ? 'For Side' : 'Against Side'}
            </span>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            {isListening && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Auto-Recording</span>
              </div>
            )}
            {autoRestartCount > 0 && (
              <div className="flex items-center space-x-1 text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">Auto-restarting...</span>
              </div>
            )}
          </div>
        </div>

        {!isSupported && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Speech recognition not supported in this browser</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {isSupported && (
          <div className="space-y-3">
            {/* Status Display */}
            <div className={`p-3 rounded-lg border-2 ${
              isListening 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isListening ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">
                        🎙️ Automatically capturing your speech...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm font-medium text-yellow-700">
                        ⏸️ Auto-captions paused (will restart automatically)
                      </span>
                    </>
                  )}
                </div>
                {autoRestartCount > 0 && (
                  <span className="text-xs text-blue-600">
                    Restart #{autoRestartCount}
                  </span>
                )}
              </div>
            </div>

            {/* Live transcript preview */}
            {transcript && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Live transcript preview:</div>
                <div className="text-sm text-gray-800 italic">"{transcript}"</div>
              </div>
            )}

            {/* Information */}
            <div className="text-xs text-blue-600 space-y-1 bg-blue-100 p-3 rounded-lg">
              <p><strong>✨ Fully Automatic:</strong> Your speech is automatically converted to captions</p>
              <p><strong>🎯 Side Attribution:</strong> All your captions are correctly tagged to your debate side</p>
              <p><strong>🔄 Auto-Restart:</strong> If recognition stops, it automatically restarts</p>
              <p><strong>👥 Audience Benefit:</strong> Everyone can follow along with real-time captions</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For audience: Show caption viewing controls only
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Subtitles className="w-5 h-5 text-green-600" />
          <h4 className="font-medium text-green-900">Live Captions</h4>
        </div>
        <button
          onClick={onToggleEnabled}
          className={`p-2 rounded-md transition-colors ${
            isEnabled 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isEnabled ? "Hide captions" : "Show captions"}
        >
          {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="text-sm text-green-700">
        <p className="mb-2">
          {isEnabled 
            ? "✓ Live captions are enabled - you'll see real-time speech from anchors"
            : "Live captions are disabled - enable to see speech-to-text from anchors"
          }
        </p>
        <div className="text-xs text-green-600 space-y-1 bg-green-100 p-3 rounded-lg">
          <p><strong>🤖 Fully Automatic:</strong> Captions are generated automatically from anchor speech</p>
          <p><strong>🎯 Side Attribution:</strong> Each anchor's speech is correctly attributed to their side</p>
          <p><strong>🔄 Always On:</strong> Anchors can't forget to turn on captions - they're always active</p>
          <p><strong>♿ Accessibility:</strong> Perfect for following along without audio</p>
        </div>
      </div>
    </div>
  );
}