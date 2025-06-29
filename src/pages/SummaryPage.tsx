import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Share2, 
  ArrowLeft, 
  Users, 
  Vote,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebateSummary } from '../hooks/useDebateSummary';

interface Room {
  id: string;
  topic: string;
  status: 'waiting' | 'active' | 'ended';
  organiser_id: string;
  anchor_limit: number;
  side_a_label: string;
  side_b_label: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

interface Summary {
  id: string;
  room_id: string;
  summary_type: string;
  content: string;
  vote_results: { side_a: number; side_b: number };
  total_messages: number;
  total_captions: number;
  debate_duration: string;
  generated_at: string;
}

export function SummaryPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [existingSummary, setExistingSummary] = useState<Summary | null>(null);
  const [newSummary, setNewSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const { generateSummary, loading: generating, error: generateError } = useDebateSummary();

  useEffect(() => {
    if (!roomId) return;
    
    fetchRoomData();
    fetchExistingSummary();
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch room data');
    }
  };

  const fetchExistingSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_summaries')
        .select('*')
        .eq('room_id', roomId)
        .eq('summary_type', 'final')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setExistingSummary(data);
      }
    } catch (err) {
      // No existing summary found
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    const result = await generateSummary(roomId!);
    if (result) {
      setNewSummary(result);
      // Refresh to get the saved summary
      await fetchExistingSummary();
    }
  };

  const handleDownload = (content: string) => {
    const summaryWithLink = `${content}\n\n---\nView this debate: ${window.location.origin}/room/${roomId}/summary`;
    
    const blob = new Blob([summaryWithLink], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-summary-${room?.topic?.replace(/[^a-zA-Z0-9]/g, '-') || roomId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async (content: string) => {
    const shareUrl = `${window.location.origin}/room/${roomId}/summary`;
    const shareTitle = `Debate Summary: ${room?.topic}`;
    const shareText = `${content}\n\n🔗 View full debate: ${shareUrl}`;

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

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/room/${roomId}/summary`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This debate room does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const summaryContent = newSummary || existingSummary?.content;
  const hasSummary = !!summaryContent;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/archive')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Archive</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{room.topic}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Created {formatDate(room.created_at)}</span>
                  </div>
                  {room.ended_at && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ended {formatDate(room.ended_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  title="Copy debate link"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  room.status === 'ended' 
                    ? 'bg-gray-100 text-gray-700'
                    : room.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {room.status === 'ended' ? 'Completed' : 
                   room.status === 'active' ? 'Live' : 'Waiting'}
                </span>
              </div>
            </div>

            {/* Success Message */}
            {shareSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Copied to clipboard!</span>
              </motion.div>
            )}

            {/* Debate Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{room.side_a_label}</div>
                <div className="text-sm text-gray-600">Side A</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{room.side_b_label}</div>
                <div className="text-sm text-gray-600">Side B</div>
              </div>
              {existingSummary && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{existingSummary.total_messages}</div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {(existingSummary.vote_results?.side_a || 0) + (existingSummary.vote_results?.side_b || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </div>
                </>
              )}
            </div>

            {/* Voting Results */}
            {existingSummary?.vote_results && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Vote className="w-5 h-5 mr-2" />
                  Final Voting Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {existingSummary.vote_results.side_a}
                      </div>
                      <div className="text-sm text-blue-700">{room.side_a_label} Votes</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {((existingSummary.vote_results.side_a / ((existingSummary.vote_results.side_a + existingSummary.vote_results.side_b) || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {existingSummary.vote_results.side_b}
                      </div>
                      <div className="text-sm text-orange-700">{room.side_b_label} Votes</div>
                      <div className="text-xs text-orange-600 mt-1">
                        {((existingSummary.vote_results.side_b / ((existingSummary.vote_results.side_a + existingSummary.vote_results.side_b) || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI-Generated Summary</h2>
                  {existingSummary && (
                    <p className="text-sm text-gray-600">
                      Generated {formatDate(existingSummary.generated_at)}
                    </p>
                  )}
                </div>
              </div>
              
              {hasSummary && (
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(summaryContent)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Download summary with link"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShare(summaryContent)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                    title="Share summary with link"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {!hasSummary ? (
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
                  disabled={generating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Summary...</span>
                    </div>
                  ) : (
                    'Generate Summary'
                  )}
                </motion.button>
                
                {generateError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
                    {generateError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {newSummary && (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Summary generated successfully!</span>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="prose prose-sm max-w-none">
                    {summaryContent.split('\n').map((paragraph, index) => {
                      if (paragraph.trim() === '') return <br key={index} />;
                      
                      // Handle markdown-style headers
                      if (paragraph.startsWith('# ')) {
                        return (
                          <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
                            {paragraph.substring(2)}
                          </h1>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2 key={index} className="text-xl font-semibold text-gray-800 mt-5 mb-3">
                            {paragraph.substring(3)}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={index} className="text-lg font-medium text-gray-800 mt-4 mb-2">
                            {paragraph.substring(4)}
                          </h3>
                        );
                      }
                      
                      // Handle bullet points
                      if (paragraph.startsWith('- ')) {
                        return (
                          <li key={index} className="ml-4 mb-2 text-gray-700 list-disc">
                            {paragraph.substring(2)}
                          </li>
                        );
                      }
                      
                      // Handle bold text
                      const boldText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      
                      return (
                        <p 
                          key={index} 
                          className="mb-4 text-gray-800 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: boldText }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Share Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Share this Summary</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        When you share this summary, it includes both the AI analysis and a link to view the full debate.
                      </p>
                      <div className="mt-2 text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
                        {window.location.origin}/room/{roomId}/summary
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}