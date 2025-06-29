import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateDebateSummary } from '../lib/gemini';

interface SummaryData {
  topic: string;
  sideALabel: string;
  sideBLabel: string;
  messages: Array<{ content: string; side?: 'side_a' | 'side_b'; timestamp: string; user_id?: string }>;
  votes: { side_a: number; side_b: number };
  captions: Array<{ content: string; participant_side?: 'side_a' | 'side_b'; timestamp: string; confidence?: number }>;
  duration: number; // in minutes
  participants: number;
}

export function useDebateSummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateSummary = async (roomId: string): Promise<string | null> => {
    setLoading(true);
    setError('');

    try {
      // Fetch room data
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomId);

      if (votesError) throw votesError;

      // Fetch captions
      const { data: captions, error: captionsError } = await supabase
        .from('captions')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_final', true)
        .order('timestamp', { ascending: true });

      if (captionsError) throw captionsError;

      // Fetch participants count
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id')
        .eq('room_id', roomId);

      if (participantsError) throw participantsError;

      // Calculate debate duration
      const startTime = room.started_at ? new Date(room.started_at) : new Date(room.created_at);
      const endTime = room.ended_at ? new Date(room.ended_at) : new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Count votes by side
      const sideAVotes = votes?.filter(v => v.voted_side === 'side_a').length || 0;
      const sideBVotes = votes?.filter(v => v.voted_side === 'side_b').length || 0;

      // Prepare data for AI summary
      const summaryData: SummaryData = {
        topic: room.topic,
        sideALabel: room.side_a_label,
        sideBLabel: room.side_b_label,
        messages: messages || [],
        votes: { side_a: sideAVotes, side_b: sideBVotes },
        captions: captions || [],
        duration,
        participants: participants?.length || 0
      };

      // Generate AI summary with captions
      const summary = await generateDebateSummary(
        summaryData.topic,
        summaryData.messages,
        summaryData.votes,
        summaryData.captions,
        summaryData.sideALabel,
        summaryData.sideBLabel
      );

      // Save comprehensive summary to database
      const { error: summaryError } = await supabase
        .from('discussion_summaries')
        .insert({
          room_id: roomId,
          summary_type: 'final',
          content: summary,
          vote_results: summaryData.votes,
          key_points: extractKeyPoints(summaryData),
          side_a_arguments: extractSideArguments(summaryData, 'side_a'),
          side_b_arguments: extractSideArguments(summaryData, 'side_b'),
          total_messages: summaryData.messages.length,
          total_captions: summaryData.captions.length,
          debate_duration: `${duration} minutes`
        });

      if (summaryError) {
        console.error('Failed to save summary to database:', summaryError);
        // Don't throw error here, still return the generated summary
      }

      return summary;
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const extractKeyPoints = (data: SummaryData): string[] => {
    // Extract key points from messages and captions
    const allContent = [
      ...data.messages.map(m => m.content),
      ...data.captions.map(c => c.content)
    ];
    
    // Simple keyword extraction (could be enhanced with NLP)
    const keyWords = allContent
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(keyWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  };

  const extractSideArguments = (data: SummaryData, side: 'side_a' | 'side_b'): string[] => {
    const sideContent = [
      ...data.messages.filter(m => m.side === side).map(m => m.content),
      ...data.captions.filter(c => c.participant_side === side).map(c => c.content)
    ];

    return sideContent.slice(0, 10); // Top 10 arguments/points
  };

  return {
    generateSummary,
    loading,
    error
  };
}