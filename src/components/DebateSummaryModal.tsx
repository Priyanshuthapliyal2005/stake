import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Share2, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useDebateSummary } from '../hooks/useDebateSummary';

interface DebateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTopic: string;
}

export function DebateSummaryModal({ 
  isOpen, 
  onClose, 
  roomId, 
  roomTopic 
}: DebateSummaryModalProps) {
  const [summary, setSummary] = useState<string>('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const { generateSummary, loading, error } = useDebateSummary();

  const handleGenerateSummary = async () => {
    const result = await generateSummary(roomId);
    if (result) {
      setSummary(result);
      setHasGenerated(true);
    }
  };

  const handleDownload = () => {
    const shareUrl = `${window.location.origin}/room/${roomId}/summary`;
    const summaryWithLink = `${summary}\n\n---\nView this debate: ${shareUrl}`;
    
    const blob = new Blob([summaryWithLink], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-summary-${roomTopic?.replace(/[^a-zA-Z0-9]/g, '-') || roomId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/room/${roomId}/summary`;
    const shareTitle = `Debate Summary: ${roomTopic}`;
    const shareText = `${summary}\n\n🔗 View full debate: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      // If sharing fails, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (clipboardErr) {
        console.error('Failed to copy to clipboard:', clipboardErr);
        alert('Unable to share. Please copy the link manually.');
      }
    }
  };

  const handleViewFullSummary = () => {
    window.open(`/room/${roomId}/summary`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Debate Summary</h2>
                  <p className="text-sm text-gray-600">{roomTopic}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!hasGenerated ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Generate AI Summary
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create a comprehensive summary of this debate including key arguments, 
                    voting results, and insights from the discussion.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateSummary}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Summary...</span>
                      </div>
                    ) : (
                      'Generate Summary'
                    )}
                  </motion.button>
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Summary generated successfully!</span>
                  </div>

                  {/* Share Success Message */}
                  {shareSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Summary and link copied to clipboard!</span>
                    </motion.div>
                  )}

                  {/* Summary Content - Truncated for modal */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="prose prose-sm max-w-none">
                      {summary.split('\n').slice(0, 10).map((paragraph, index) => {
                        if (paragraph.trim() === '') return <br key={index} />;
                        
                        // Handle markdown-style headers
                        if (paragraph.startsWith('# ')) {
                          return (
                            <h1 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-3">
                              {paragraph.substring(2)}
                            </h1>
                          );
                        }
                        if (paragraph.startsWith('## ')) {
                          return (
                            <h2 key={index} className="text-lg font-semibold text-gray-800 mt-3 mb-2">
                              {paragraph.substring(3)}
                            </h2>
                          );
                        }
                        
                        // Handle bullet points
                        if (paragraph.startsWith('- ')) {
                          return (
                            <li key={index} className="ml-4 mb-1 text-gray-700 list-disc text-sm">
                              {paragraph.substring(2)}
                            </li>
                          );
                        }
                        
                        return (
                          <p key={index} className="mb-3 text-gray-800 leading-relaxed text-sm">
                            {paragraph}
                          </p>
                        );
                      })}
                      
                      {summary.split('\n').length > 10 && (
                        <div className="text-center mt-4 pt-4 border-t border-gray-200">
                          <p className="text-gray-500 text-sm mb-3">Summary truncated for preview...</p>
                          <button
                            onClick={handleViewFullSummary}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Full Summary</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShare}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Summary + Link</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleViewFullSummary}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Full Page</span>
                    </motion.button>
                  </div>

                  {/* Share Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Share includes:</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>• Complete AI-generated summary</li>
                          <li>• Direct link to view the full debate</li>
                          <li>• Voting results and key insights</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}