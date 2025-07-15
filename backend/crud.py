from sqlalchemy.orm import Session
from models import User, Document, Chat, DocumentChunk
from auth import get_password_hash

def create_user(db: Session, username: str, email: str, password: str):
    hashed_password = get_password_hash(password)
    user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_document(db: Session, filename: str, content: str, owner_id: int):
    doc = Document(filename=filename, content=content, owner_id=owner_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def create_chat(db: Session, document_id: int):
    chat = Chat(document_id=document_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

def get_document_by_id(db: Session, doc_id: int):
    return db.query(Document).filter(Document.id == doc_id).first()

def get_chat_by_id(db: Session, chat_id: int):
    return db.query(Chat).filter(Chat.id == chat_id).first()

def get_documents_by_user(db: Session, user_id: int):
    return db.query(Document).filter(Document.owner_id == user_id).all()

def delete_document(db: Session, document_id: int):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc:
        db.delete(doc)
        db.commit()

def create_document_chunk(db: Session, document_id: int, chunk_text: str, embedding: bytes):
    chunk = DocumentChunk(document_id=document_id, chunk_text=chunk_text, embedding=embedding)
    db.add(chunk)
    db.commit()
    db.refresh(chunk)
    return chunk

def get_chunks_by_document(db: Session, document_id: int):
    return db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all() 