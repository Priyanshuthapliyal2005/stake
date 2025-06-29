const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateDebateSummary(
  topic: string,
  messages: Array<{ content: string; side?: 'side_a' | 'side_b'; timestamp: string; user_id?: string }>,
  votes: { side_a: number; side_b: number },
  captions: Array<{ content: string; participant_side?: 'side_a' | 'side_b'; timestamp: string; confidence?: number }> = [],
  sideALabel: string = 'Side A',
  sideBLabel: string = 'Side B'
) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Combine messages and captions chronologically
  const allContent = [
    ...messages.map(m => ({
      content: m.content,
      side: m.side,
      timestamp: m.timestamp,
      type: 'message' as const,
      user_id: m.user_id
    })),
    ...captions.map(c => ({
      content: c.content,
      side: c.participant_side,
      timestamp: c.timestamp,
      type: 'caption' as const,
      confidence: c.confidence
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sideAContent = allContent.filter(c => c.side === 'side_a');
  const sideBContent = allContent.filter(c => c.side === 'side_b');
  const totalVotes = votes.side_a + votes.side_b;
  const sideAPercentage = totalVotes > 0 ? ((votes.side_a / totalVotes) * 100).toFixed(1) : '0';
  const sideBPercentage = totalVotes > 0 ? ((votes.side_b / totalVotes) * 100).toFixed(1) : '0';

  const formatContent = (items: typeof allContent) => {
    return items.map(item => {
      const time = new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const typeIndicator = item.type === 'caption' ? '[SPEECH]' : '[CHAT]';
      const confidenceNote = item.type === 'caption' && item.confidence && item.confidence < 0.8 ? ' (low confidence)' : '';
      return `${time} ${typeIndicator}: ${item.content}${confidenceNote}`;
    }).join('\n');
  };
  
  const prompt = `
Generate a comprehensive and engaging summary of this debate on the topic: "${topic}"

## Debate Information:
**Topic:** ${topic}
**Sides:** ${sideALabel} vs ${sideBLabel}
**Total Messages:** ${messages.length}
**Total Speech Captions:** ${captions.length}
**Total Participants:** ${totalVotes}

## Voting Results:
- **${sideALabel}:** ${votes.side_a} votes (${sideAPercentage}%)
- **${sideBLabel}:** ${votes.side_b} votes (${sideBPercentage}%)

## ${sideALabel} Content (${sideAContent.length} contributions):
${sideAContent.length > 0 ? formatContent(sideAContent) : 'No contributions recorded'}

## ${sideBLabel} Content (${sideBContent.length} contributions):
${sideBContent.length > 0 ? formatContent(sideBContent) : 'No contributions recorded'}

## Instructions:
Please provide a structured, comprehensive summary with the following sections:

### 1. Executive Summary
A compelling 2-3 sentence overview of the debate topic, key dynamics, and outcome.

### 2. Debate Overview
- Brief description of the debate format and participation
- Timeline and key moments
- Overall engagement level and quality

### 3. Key Arguments Analysis

**${sideALabel} Position:**
- Main arguments and supporting points
- Strongest rhetorical moments
- Strategic approach and messaging

**${sideBLabel} Position:**
- Main arguments and supporting points
- Strongest rhetorical moments
- Strategic approach and messaging

### 4. Discussion Highlights
- Most compelling exchanges
- Areas of agreement or common ground
- Points of strongest disagreement
- Notable quotes or moments (if any)

### 5. Audience Response & Voting Analysis
- Final vote breakdown and what it suggests
- Possible factors influencing voting patterns
- Alignment between argument strength and popular support

### 6. Key Takeaways
- Main insights from the debate
- Unresolved questions or areas for further discussion
- Broader implications of the topic

### 7. Conclusion
A balanced assessment that acknowledges the merits of both sides while highlighting the value of the democratic discourse process.

## Style Guidelines:
- Write in an engaging, journalistic style
- Remain objective and balanced
- Focus on substance over personal attacks
- Make it accessible to readers unfamiliar with the topic
- Include specific examples from the discussion when relevant
- Acknowledge both chat messages and live speech contributions
- Note when speech recognition may have affected caption accuracy

Generate a summary that would be valuable for someone who wants to understand this debate without reading through all the individual contributions.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated by Gemini API');
    }
    
    return generatedText;
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Provide a comprehensive fallback summary
    const fallbackSummary = `# Debate Summary: ${topic}

## Executive Summary
This debate on "${topic}" generated ${messages.length} chat messages and ${captions.length} speech contributions, with ${totalVotes} participants casting votes. The discussion concluded with ${sideALabel} receiving ${votes.side_a} votes (${sideAPercentage}%) and ${sideBLabel} receiving ${votes.side_b} votes (${sideBPercentage}%).

## Debate Overview
The debate featured structured discussion between ${sideALabel} and ${sideBLabel} positions, with participants contributing through both text chat and live speech. The format allowed for real-time audience engagement and voting.

## Key Arguments

### ${sideALabel} Position (${sideAContent.length} contributions):
${sideAContent.slice(0, 5).map(item => `- ${item.content}`).join('\n') || '- No arguments recorded'}

### ${sideBLabel} Position (${sideBContent.length} contributions):
${sideBContent.slice(0, 5).map(item => `- ${item.content}`).join('\n') || '- No arguments recorded'}

## Voting Results
- **${sideALabel}:** ${votes.side_a} votes (${sideAPercentage}%)
- **${sideBLabel}:** ${votes.side_b} votes (${sideBPercentage}%)

## Discussion Timeline
The debate included:
- ${messages.length} text messages from participants
- ${captions.length} speech-to-text captions from anchors
- Real-time voting by ${totalVotes} participants

## Conclusion
This debate provided valuable insights into different perspectives on ${topic}. The voting results reflect the audience's response to the arguments presented by both sides.

*Note: This is a basic summary. AI-powered analysis is temporarily unavailable due to: ${error instanceof Error ? error.message : 'Unknown error'}*`;

    return fallbackSummary;
  }
}