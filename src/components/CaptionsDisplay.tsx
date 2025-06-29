import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subtitles, Volume2, Eye, EyeOff } from 'lucide-react';
import { useCaptions } from '../hooks/useCaptions';

interface CaptionsDisplayProps {
  roomId: string;
  sideALabel: string;
  sideBLabel: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function CaptionsDisplay({ 
  roomId, 
  sideALabel, 
  sideBLabel, 
  isVisible, 
  onToggle 
}: CaptionsDisplayProps) {
  const { captions, loading } = useCaptions(roomId);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSideLabel = (side?: 'side_a' | 'side_b') => {
    if (!side) return 'Unknown Speaker';
    return side === 'side_a' ? sideALabel : sideBLabel;
  };

  const getSideColor = (side?: 'side_a' | 'side_b') => {
    if (!side) return 'text-gray-600';
    return side === 'side_a' ? 'text-blue-600' : 'text-orange-600';
  };

  const getSideBorderColor = (side?: 'side_a' | 'side_b') => {
    if (!side) return '#6b7280';
    return side === 'side_a' ? '#2563eb' : '#ea580c';
  };

  const getSideBackground = (side?: 'side_a' | 'side_b') => {
    if (!side) return 'bg-gray-50';
    return side === 'side_a' ? 'bg-blue-50' : 'bg-orange-50';
  };

  // Sort captions by timestamp (most recent first for display)
  const sortedCaptions = [...captions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 20); // Show only last 20 captions

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Subtitles className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Live Captions</h3>
          <span className="text-xs text-gray-500">({captions.length} total)</span>
          {loading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex items-center space-x-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title={isVisible ? "Hide captions" : "Show captions"}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-xs">{isVisible ? 'Hide' : 'Show'}</span>
        </button>
      </div>

      {/* Captions Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {sortedCaptions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Subtitles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No captions yet</p>
                  <p className="text-xs mt-1">Captions will appear when anchors speak</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Side Legend */}
                  <div className="flex items-center justify-center space-x-6 pb-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-600">{sideALabel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-xs font-medium text-orange-600">{sideBLabel}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {sortedCaptions.map((caption) => (
                      <motion.div
                        key={caption.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`border-l-4 pl-3 py-2 rounded-r-lg ${getSideBackground(caption.participant_side)}`}
                        style={{
                          borderLeftColor: getSideBorderColor(caption.participant_side)
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${getSideColor(caption.participant_side)}`}>
                              🎙️ {getSideLabel(caption.participant_side)}
                            </span>
                            {caption.confidence < 0.8 && (
                              <span className="text-xs text-amber-600 bg-amber-100 px-1 rounded">
                                Low confidence
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(caption.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {caption.content}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}