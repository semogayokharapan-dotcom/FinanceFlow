
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';

interface ChatTabProps {
  userId: string;
}

interface Contact {
  id: string;
  contactName: string;
  contactWeyId: string;
  fullName: string;
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  messageType: 'text' | 'ping';
  isRead: boolean;
  createdAt: string;
  fromUserId: string;
  toWeyId?: string;
  senderName: string;
  senderWeyId?: string;
  isFromMe: boolean;
}

// Audio for Wey sound
const playWeySound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

// Vibration
const vibrate = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    await Notification.requestPermission();
  }
};

// Show notification
const showNotification = (title: string, body: string, isWey = false) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: isWey ? 'wey-ping' : 'wey-message',
      requireInteraction: isWey,
    });
    
    if (isWey) {
      playWeySound();
      vibrate();
    }
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

export default function ChatTab({ userId }: ChatTabProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactWeyId, setNewContactWeyId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [activeTab, setActiveTab] = useState('private');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const globalMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesRef = useRef<Message[]>([]);
  const prevGlobalMessagesRef = useRef<Message[]>([]);
  
  const queryClient = useQueryClient();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch user data for Wey ID
  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', userId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/contacts/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch messages for selected contact
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', userId, selectedContact?.contactWeyId],
    queryFn: async () => {
      if (!selectedContact) return [];
      const response = await fetch(`/api/chat/messages/${userId}/${selectedContact.contactWeyId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedContact,
    refetchInterval: 2000,
  });

  // Fetch global chat messages
  const { data: globalMessages = [] } = useQuery({
    queryKey: ['globalMessages'],
    queryFn: async () => {
      const response = await fetch('/api/chat/global');
      if (!response.ok) throw new Error('Failed to fetch global messages');
      return response.json();
    },
    refetchInterval: 3000,
  });

  // Check for new messages and show notifications
  useEffect(() => {
    if (messages.length > prevMessagesRef.current.length && prevMessagesRef.current.length > 0) {
      const newMessages = messages.slice(prevMessagesRef.current.length);
      newMessages.forEach((msg: Message) => {
        if (!msg.isFromMe) {
          if (msg.messageType === 'ping') {
            showNotification(
              `📲 Wey dari ${msg.senderName}!`,
              'Seseorang mengirim Wey kepada Anda!',
              true
            );
          } else {
            showNotification(
              `💬 Pesan dari ${msg.senderName}`,
              msg.content
            );
          }
        }
      });
    }
    prevMessagesRef.current = messages;
  }, [messages]);

  // Check for new global messages
  useEffect(() => {
    if (globalMessages.length > prevGlobalMessagesRef.current.length && prevGlobalMessagesRef.current.length > 0) {
      const newMessages = globalMessages.slice(prevGlobalMessagesRef.current.length);
      newMessages.forEach((msg: Message) => {
        if (msg.fromUserId !== userId) {
          if (msg.messageType === 'ping') {
            showNotification(
              `🌍 Global Wey dari ${msg.senderName}!`,
              'Ada Wey di Global Chat!',
              true
            );
          } else {
            showNotification(
              `🌍 Global Chat - ${msg.senderName}`,
              msg.content
            );
          }
        }
      });
    }
    prevGlobalMessagesRef.current = globalMessages;
  }, [globalMessages]);

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: { contactWeyId: string; contactName: string }) => {
      const response = await fetch(`/api/chat/contacts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', userId] });
      setNewContactWeyId('');
      setNewContactName('');
      setIsAddContactOpen(false);
    },
  });

  // Send private message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toWeyId: string; content: string; messageType: string }) => {
      const response = await fetch(`/api/chat/messages/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId, selectedContact?.contactWeyId] });
      setNewMessage('');
    },
  });

  // Send global message mutation
  const sendGlobalMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType: string }) => {
      const response = await fetch(`/api/chat/global/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalMessages'] });
      setGlobalMessage('');
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (contactWeyId: string) => {
      const response = await fetch(`/api/chat/messages/${userId}/${contactWeyId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    globalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages]);

  // Mark messages as read when contact is selected
  useEffect(() => {
    if (selectedContact) {
      markAsReadMutation.mutate(selectedContact.contactWeyId);
    }
  }, [selectedContact, messages]);

  const handleSendMessage = (messageType: 'text' | 'ping' = 'text') => {
    if (!selectedContact) return;
    
    const content = messageType === 'ping' ? 'Wey!' : newMessage.trim();
    if (!content) return;

    sendMessageMutation.mutate({
      toWeyId: selectedContact.contactWeyId,
      content,
      messageType,
    });
  };

  const handleSendGlobalMessage = (messageType: 'text' | 'ping' = 'text') => {
    const content = messageType === 'ping' ? 'Wey!' : globalMessage.trim();
    if (!content) return;

    sendGlobalMessageMutation.mutate({
      content,
      messageType,
    });
  };

  const handleAddContact = () => {
    if (!newContactWeyId.trim() || !newContactName.trim()) return;
    
    addContactMutation.mutate({
      contactWeyId: newContactWeyId.trim().toUpperCase(),
      contactName: newContactName.trim(),
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Wey ID */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">💬 Wey Chat!</CardTitle>
            <div className="text-center">
              <div className="text-xs text-gray-600">Wey ID Anda</div>
              <Badge variant="secondary" className="font-mono text-sm">
                {userData?.weyId || 'Loading...'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private">💬 Private Chat</TabsTrigger>
          <TabsTrigger value="global">🌍 Global Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
            {/* Contacts List */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">👥 Kontak</CardTitle>
                  <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">➕</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tambah Kontak</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="weyId">Wey ID</Label>
                          <Input
                            id="weyId"
                            placeholder="Masukkan Wey ID (8 karakter)"
                            value={newContactWeyId}
                            onChange={(e) => setNewContactWeyId(e.target.value.toUpperCase())}
                            maxLength={8}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactName">Nama Kontak</Label>
                          <Input
                            id="contactName"
                            placeholder="Masukkan nama kontak"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleAddContact}
                          disabled={addContactMutation.isPending}
                          className="w-full"
                        >
                          {addContactMutation.isPending ? 'Menambahkan...' : 'Tambah Kontak'}
                        </Button>
                        {addContactMutation.error && (
                          <p className="text-red-500 text-sm">
                            {addContactMutation.error.message}
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {contacts.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">{contact.contactName}</div>
                      <div className="text-xs text-gray-500 font-mono">{contact.contactWeyId}</div>
                      <div className="text-xs text-gray-400">{contact.fullName}</div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-2xl mb-2">📱</div>
                      <div className="text-sm">Belum ada kontak</div>
                      <div className="text-xs">Tambah teman dengan Wey ID</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Private Chat Area */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedContact ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedContact.contactName}</div>
                        <div className="text-xs text-gray-500 font-mono">{selectedContact.contactWeyId}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendMessage('ping')}
                        disabled={sendMessageMutation.isPending}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                      >
                        📲 Wey!
                      </Button>
                    </div>
                  ) : (
                    'Pilih kontak untuk mulai chat'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {selectedContact ? (
                  <div className="flex flex-col h-[350px]">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-2 p-2">
                      {messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-2 rounded-lg ${
                              message.isFromMe
                                ? 'bg-blue-500 text-white'
                                : message.messageType === 'ping'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                                : 'bg-gray-100'
                            }`}
                          >
                            {message.messageType === 'ping' ? (
                              <div className="text-center">
                                <div className="text-2xl">📲</div>
                                <div className="font-bold text-lg">Wey!</div>
                                <div className="text-xs">
                                  {message.isFromMe ? 'Anda mengirim Wey!' : `${message.senderName} mengirim Wey!`}
                                </div>
                              </div>
                            ) : (
                              <div>{message.content}</div>
                            )}
                            <div className={`text-xs mt-1 ${
                              message.isFromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <Separator />

                    {/* Message Input */}
                    <div className="p-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Ketik pesan..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage('text');
                            }
                          }}
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button 
                          onClick={() => handleSendMessage('text')}
                          disabled={sendMessageMutation.isPending || !newMessage.trim()}
                          size="sm"
                        >
                          ➤
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <div className="text-lg font-medium">Wey Chat!</div>
                      <div className="text-sm">Pilih kontak untuk mulai percakapan</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card className="h-[500px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">🌍 Global Chat - Semua User Wey!</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendGlobalMessage('ping')}
                  disabled={sendGlobalMessageMutation.isPending}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                >
                  📲 Global Wey!
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col h-[400px]">
                {/* Global Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 p-2">
                  {globalMessages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromUserId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-2 rounded-lg ${
                          message.fromUserId === userId
                            ? 'bg-blue-500 text-white'
                            : message.messageType === 'ping'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                            : 'bg-gray-100'
                        }`}
                      >
                        {message.messageType === 'ping' ? (
                          <div className="text-center">
                            <div className="text-2xl">🌍📲</div>
                            <div className="font-bold text-lg">Global Wey!</div>
                            <div className="text-xs">
                              {message.fromUserId === userId ? 'Anda' : message.senderName} ({message.senderWeyId})
                            </div>
                          </div>
                        ) : (
                          <div>
                            {message.fromUserId !== userId && (
                              <div className="text-xs font-medium mb-1">
                                {message.senderName} ({message.senderWeyId})
                              </div>
                            )}
                            <div>{message.content}</div>
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${
                          message.fromUserId === userId ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={globalMessagesEndRef} />
                </div>

                <Separator />

                {/* Global Message Input */}
                <div className="p-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ketik pesan global..."
                      value={globalMessage}
                      onChange={(e) => setGlobalMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendGlobalMessage('text');
                        }
                      }}
                      disabled={sendGlobalMessageMutation.isPending}
                    />
                    <Button 
                      onClick={() => handleSendGlobalMessage('text')}
                      disabled={sendGlobalMessageMutation.isPending || !globalMessage.trim()}
                      size="sm"
                    >
                      🌍
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
