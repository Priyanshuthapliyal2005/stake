import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Caption {
  id: string;
  room_id: string;
  user_id: string;
  participant_side?: 'side_a' | 'side_b';
  content: string;
  confidence: number;
  timestamp: string;
  is_final: boolean;
}

export function useCaptions(roomId: string) {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    // Fetch existing captions
    fetchCaptions();

    // Set up real-time subscription
    const subscription = supabase
      .channel('captions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'captions',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setCaptions(prev => [...prev, payload.new as Caption]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const fetchCaptions = async () => {
    try {
      const { data, error } = await supabase
        .from('captions')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_final', true)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setCaptions(data || []);
    } catch (err) {
      console.error('Failed to fetch captions:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    captions,
    loading
  };
}