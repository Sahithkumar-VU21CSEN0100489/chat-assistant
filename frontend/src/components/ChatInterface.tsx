import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Trash2, FileText, MessageSquare } from 'lucide-react';
import { Document, ChatMessage, getChatHistory, createChatMessage, saveChatMessage } from '../utils/storage';
import { generateResponse } from '../utils/chatAssistant';

interface ChatInterfaceProps {
  document: Document;
  onBack: () => void;
  onDelete: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  document,
  onBack,
  onDelete
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // Ensure chat is saved (already handled on each message)
                onBack(); // Navigate back to dashboard
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
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
                  <div className="max-w-3xl bg-white/80 backdrop-blur-md rounded-2xl rounded-tl-md p-4 border border-white/20">
                    <p className="text-sm text-gray-900">{typeof message.response === 'string' ? message.response : JSON.stringify(message.response)}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTimestamp(message.timestamp)}
                    </p>
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