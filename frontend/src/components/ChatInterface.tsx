import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Trash2, FileText, MessageSquare, Volume2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, ChatMessage, getChatHistory, createChatMessage, saveChatMessage } from '../utils/storage';
import { generateResponse } from '../utils/chatAssistant';

interface ChatInterfaceProps {
  document: Document;
  onBack: () => void;
  onDelete: () => void;
  documents: Document[];
  onDocumentSwitch: (doc: Document) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  document,
  onBack,
  onDelete,
  documents,
  onDocumentSwitch
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    loadChatHistory();
  }, [document.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handlePopState = () => {
      window.location.href = "/";
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const loadChatHistory = () => {
    const history = getChatHistory(document.id);
    setMessages(history);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate response based on document content
      const response = await generateResponse(userMessage, document);
      
      // Create and save chat message
      const chatMessage = createChatMessage(document.id, userMessage, response);
      saveChatMessage(chatMessage);
      setMessages(prev => [...prev, chatMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileIcon = (fileType: string) => {
    switch ((fileType ?? '').toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📄';
    
      default:
        return '📄';
    }
  };

  const speak = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const exportChat = () => {
    const docPdf = new jsPDF();
    let y = 20;
    messages.forEach((msg, idx) => {
      // Calculate height for user and assistant messages
      const userLines = docPdf.splitTextToSize(msg.message, 150);
      const assistantResponse = typeof msg.response === 'string' ? msg.response : JSON.stringify(msg.response);
      const assistantLines = docPdf.splitTextToSize(assistantResponse, 120); // narrower for side-by-side
      const boxHeight = userLines.length * 8 + Math.max(assistantLines.length * 8, 16) + 32;
      // Draw background box
      docPdf.setFillColor(240, 240, 240);
      docPdf.rect(8, y - 8, 194, boxHeight, 'F');
      // User label
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(13);
      docPdf.setTextColor(33, 37, 41);
      docPdf.text('User:', 12, y);
      // User message
      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(12);
      docPdf.setTextColor(33, 37, 41);
      docPdf.text(userLines, 32, y);
      y += userLines.length * 8 + 4;
      // Assistant label and answer side by side
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(13);
      docPdf.setTextColor(0, 102, 204);
      docPdf.text('Assistant:', 12, y);
      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(12);
      docPdf.setTextColor(0, 102, 204);
      docPdf.text(assistantLines, 45, y); // answer starts at x=45
      y += Math.max(assistantLines.length * 8, 16) + 16;
      // Extra space after each message pair
      y += 8;
      if (y > 270 && idx < messages.length - 1) {
        docPdf.addPage();
        y = 20;
      }
    });
    docPdf.save(`${(document as any).filename || (document as any).fileName || 'chat'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onBack();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {/* Document Switcher Dropdown */}
            <select
              value={document.id}
              onChange={e => {
                const doc = documents.find(d => d.id === e.target.value);
                if (doc) onDocumentSwitch(doc);
              }}
              className="ml-2 px-2 py-1 rounded border border-gray-300 bg-white text-gray-900"
            >
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {(doc as any).filename || (doc as any).fileName || 'Untitled'}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getFileIcon(document.fileType)}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{(document as any).filename || (document as any).fileName || "Untitled"}</h1>
                <p className="text-sm text-gray-600">
                  Uploaded {((document as any).uploaded_at || (document as any).uploadedAt) ? new Date((document as any).uploaded_at || (document as any).uploadedAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportChat}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Export chat as .txt"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600">
                Ask questions about the content of "{document.fileName}"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-md p-4">
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs text-blue-100 mt-2">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="max-w-3xl bg-white/80 backdrop-blur-md rounded-2xl rounded-tl-md p-4 border border-white/20 flex items-center gap-2">
                    <p className="text-sm text-gray-900 flex-1">{typeof message.response === 'string' ? message.response : JSON.stringify(message.response)}</p>
                    <button
                      onClick={() => speak(typeof message.response === 'string' ? message.response : JSON.stringify(message.response), message.id)}
                      className={`p-2 rounded-full focus:outline-none ${speakingId === message.id && window.speechSynthesis.speaking ? 'bg-blue-100 text-blue-700' : 'text-blue-500 hover:text-blue-700'}`}
                      title={speakingId === message.id && window.speechSynthesis.speaking ? 'Stop voice' : 'Play response'}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl bg-white/80 backdrop-blur-md rounded-2xl rounded-tl-md p-4 border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Assistant is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-md border-t border-white/20 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about this document..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleMicClick}
              className={`px-3 py-3 rounded-xl border ${isListening ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'} transition-colors`}
              title={isListening ? 'Listening...' : 'Speak your question'}
              disabled={isLoading}
              style={{ outline: isListening ? '2px solid #3b82f6' : undefined }}
            >
              {isListening ? (
                <svg className="w-5 h-5 animate-pulse text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0 0a3 3 0 01-3-3h6a3 3 0 01-3 3zm0-3V5a3 3 0 016 0v7a3 3 0 01-6 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0 0a3 3 0 01-3-3h6a3 3 0 01-3 3zm0-3V5a3 3 0 016 0v7a3 3 0 01-6 0z" /></svg>
              )}
            </button>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};