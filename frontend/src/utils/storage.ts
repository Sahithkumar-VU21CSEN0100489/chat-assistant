import { v4 as uuidv4 } from 'uuid';

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  content: string;
  uploadedAt: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  message: string;
  response: string;
  timestamp: string;
}

const DOCUMENTS_KEY = 'document_chat_documents';
const CHAT_HISTORY_KEY = 'document_chat_history';

export const getDocuments = (userId: string): Document[] => {
  const documents = localStorage.getItem(DOCUMENTS_KEY);
  const allDocuments = documents ? JSON.parse(documents) : [];
  return allDocuments.filter((doc: Document) => doc.userId === userId);
};

export const saveDocument = (document: Document): void => {
  const documents = localStorage.getItem(DOCUMENTS_KEY);
  const allDocuments = documents ? JSON.parse(documents) : [];
  allDocuments.push(document);
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(allDocuments));
};

export const deleteDocument = (documentId: string, userId: string): void => {
  const documents = localStorage.getItem(DOCUMENTS_KEY);
  const allDocuments = documents ? JSON.parse(documents) : [];
  const filteredDocuments = allDocuments.filter(
    (doc: Document) => !(doc.id === documentId && doc.userId === userId)
  );
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filteredDocuments));
  
  // Also delete associated chat history
  deleteChatHistory(documentId);
};

export const getChatHistory = (documentId: string): ChatMessage[] => {
  const chatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
  const allChats = chatHistory ? JSON.parse(chatHistory) : [];
  return allChats.filter((chat: ChatMessage) => chat.documentId === documentId);
};

export const saveChatMessage = (chatMessage: ChatMessage): void => {
  const chatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
  const allChats = chatHistory ? JSON.parse(chatHistory) : [];
  allChats.push(chatMessage);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
};

export const deleteChatHistory = (documentId: string): void => {
  const chatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
  const allChats = chatHistory ? JSON.parse(chatHistory) : [];
  const filteredChats = allChats.filter(
    (chat: ChatMessage) => chat.documentId !== documentId
  );
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filteredChats));
};

export const createDocument = (
  userId: string,
  fileName: string,
  fileType: string,
  content: string,
  size: number
): Document => {
  return {
    id: uuidv4(),
    userId,
    fileName,
    fileType,
    content,
    uploadedAt: new Date().toISOString(),
    size
  };
};

export const createChatMessage = (
  documentId: string,
  message: string,
  response: string
): ChatMessage => {
  return {
    id: uuidv4(),
    documentId,
    message,
    response,
    timestamp: new Date().toISOString()
  };
};