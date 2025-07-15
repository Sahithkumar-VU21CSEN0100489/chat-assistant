import { Document } from './storage';

export const generateResponse = async (question: string, document: Document): Promise<string> => {
  const response = await fetch('http://localhost:8000/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ question, document_id: document.id }),
  });
  if (!response.ok) {
    return 'Error contacting AI service.';
  }
  const data = await response.json();
  return data.answer;
};

// Removed unused function extractKeywords

// Removed unused function findRelevantContent

// Removed unused function generateContextualResponse