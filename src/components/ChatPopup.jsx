import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';

function ChatPopup() {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const isInitialLoad = useRef(true);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return '';
    }
    const date = timestamp.toDate();

    const time = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const day = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    return `${time} - ${day}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isOpen && change.doc.data().uid !== userProfile.id) {
          setUnreadCount(prevCount => prevCount + 1);
        }
      });
    });

    return () => unsubscribe();
  }, [isOpen, userProfile]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !userProfile) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: userProfile.id,
        userName: userProfile.name,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erro ao enviar mensagem: ", error);
    }
  };

  if (!userProfile) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110"
        aria-label="Abrir chat"
      >
        <MessageSquare size={28} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
      <header className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-xl">
        <h3 className="font-bold text-lg">Chat Geral</h3>
        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full">
          <X size={20} />
        </button>
      </header>

      <main className="flex-grow p-3 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex my-2 ${msg.uid === userProfile.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`py-2 px-3 rounded-lg max-w-xs ${msg.uid === userProfile.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <span className="text-xs font-bold block opacity-80">{msg.userName}</span>
              <p className="text-sm break-words">{msg.text}</p>
              <p className="text-right text-xs opacity-70 mt-1">
                {formatTimestamp(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}

export default ChatPopup;