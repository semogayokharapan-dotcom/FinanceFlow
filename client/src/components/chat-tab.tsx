import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Send, Plus, ArrowLeft, UserPlus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ChatTabProps {
  userId: string;
  userWeyId: string;
  userName: string;
}

interface Contact {
  id: string;
  contactName: string;
  contactWeyId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  messageType: 'text' | 'ping';
  isRead: boolean;
  createdAt: string;
  fromUserId: string;
  isFromCurrentUser: boolean;
}

interface GlobalMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    weyId: string;
  };
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return formatTime(dateString);
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
};

export default function ChatTab({ userId, userWeyId, userName }: ChatTabProps) {
  const [activeChat, setActiveChat] = useState<'contacts' | 'global' | string>('contacts');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newContactWeyId, setNewContactWeyId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedContact]);

  // Fetch contacts
  const { data: contacts = [], refetch: refetchContacts } = useQuery<Contact[]>({
    queryKey: ['/api/chat/contacts', userId],
    enabled: !!userId,
    refetchInterval: 3000,
  });

  // Fetch private messages
  const { data: privateMessages = [], refetch: refetchPrivateMessages } = useQuery<Message[]>({
    queryKey: ['/api/chat/messages', userId, selectedContact?.contactWeyId],
    enabled: !!userId && !!selectedContact?.contactWeyId,
    refetchInterval: 2000,
  });

  // Fetch global messages
  const { data: globalMessages = [], refetch: refetchGlobalMessages } = useQuery<GlobalMessage[]>({
    queryKey: ['/api/chat/global'],
    refetchInterval: 3000,
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: { contactWeyId: string; contactName: string }) => {
      const response = await apiRequest('POST', `/api/chat/contacts/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchContacts();
      setNewContactWeyId('');
      setNewContactName('');
      setIsAddContactOpen(false);
      toast({
        title: '✅ Berhasil',
        description: 'Kontak berhasil ditambahkan',
      });
    },
    onError: () => {
      toast({
        title: '❌ Gagal',
        description: 'Wey ID tidak ditemukan atau sudah ada',
      });
    },
  });

  // Send private message mutation
  const sendPrivateMessageMutation = useMutation({
    mutationFn: async (data: { toWeyId: string; content: string; messageType: 'text' | 'ping' }) => {
      const response = await apiRequest('POST', `/api/chat/messages/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchPrivateMessages();
      refetchContacts();
      setMessageInput('');
    },
  });

  // Send global message mutation
  const sendGlobalMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await apiRequest('POST', `/api/chat/global/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchGlobalMessages();
      setMessageInput('');
    },
  });

  const handleSendMessage = (messageType: 'text' | 'ping' = 'text') => {
    if (!messageInput.trim() && messageType === 'text') return;

    if (activeChat === 'global') {
      sendGlobalMessageMutation.mutate({
        content: messageType === 'ping' ? '⚡ WEY!' : messageInput,
      });
    } else if (selectedContact) {
      sendPrivateMessageMutation.mutate({
        toWeyId: selectedContact.contactWeyId,
        content: messageType === 'ping' ? '⚡ WEY!' : messageInput,
        messageType,
      });
    }
  };

  const handleAddContact = () => {
    if (!newContactWeyId.trim() || !newContactName.trim()) return;
    
    addContactMutation.mutate({
      contactWeyId: newContactWeyId.toUpperCase(),
      contactName: newContactName,
    });
  };

  // Chat List View
  if (activeChat === 'contacts' && !selectedContact) {
    return (
      <div className="h-[600px] flex flex-col bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 border-b bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-green-800">💬 Wey Chat</h2>
              <p className="text-sm text-green-600">Wey ID Anda: <span className="font-mono font-bold">{userWeyId}</span></p>
            </div>
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Kontak Baru</DialogTitle>
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
                      className="font-mono"
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
                    className="w-full"
                    disabled={addContactMutation.isPending}
                  >
                    {addContactMutation.isPending ? 'Menambahkan...' : 'Tambah Kontak'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeChat} onValueChange={setActiveChat} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kontak
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Global Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="flex-1 p-4">
            {contacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada kontak</p>
                <p className="text-sm">Tambah kontak dengan Wey ID untuk mulai chat</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
                    >
                      <Avatar className="h-12 w-12 mr-3 bg-green-100">
                        <AvatarFallback className="text-green-700 font-semibold">
                          {contact.contactName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{contact.contactName}</h3>
                          <span className="text-xs text-gray-500">{formatDate(contact.lastMessageTime)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate font-mono">{contact.contactWeyId}</p>
                          {contact.unreadCount > 0 && (
                            <Badge className="bg-green-600 text-white">{contact.unreadCount}</Badge>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Global Chat View
  if (activeChat === 'global') {
    return (
      <div className="h-[600px] flex flex-col bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setActiveChat('contacts')} className="mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-blue-800">🌍 Global Chat</h2>
            <p className="text-sm text-blue-600">Chat dengan semua pengguna</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {globalMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user?.id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.user?.id === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.user?.id !== userId && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.user?.fullName} ({message.user?.weyId})
                    </div>
                  )}
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">{formatTime(message.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Ketik pesan..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage('ping')} variant="outline" size="sm">
              <Zap className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleSendMessage()} size="sm" disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Private Chat View
  if (selectedContact) {
    return (
      <div className="h-[600px] flex flex-col bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 border-b bg-green-50 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 mr-3 bg-green-100">
            <AvatarFallback className="text-green-700 font-semibold">
              {selectedContact.contactName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold text-green-800">{selectedContact.contactName}</h2>
            <p className="text-sm text-green-600 font-mono">{selectedContact.contactWeyId}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {privateMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isFromCurrentUser
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">{formatTime(message.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Ketik pesan..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage('ping')} variant="outline" size="sm">
              <Zap className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleSendMessage()} size="sm" disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}