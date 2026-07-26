import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Plus,
  Hash,
  Megaphone,
  User,
  Loader2,
  Search,
  Pin,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

function MessengerChannel({
  channelId,
  userId,
}: {
  channelId: string;
  userId: string;
}) {
  const messages = useQuery(api.messenger.listMessages, { channelId: channelId as any });
  const members = useQuery(api.messenger.getChannelMembers, { channelId: channelId as any });
  const users = useQuery(api.users.listUsers);
  const sendMessage = useMutation(api.messenger.sendMessage);
  const markChannelRead = useMutation(api.messenger.markChannelRead);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    markChannelRead({ channelId: channelId as any, userId: userId as any });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage({
      channelId: channelId as any,
      senderId: userId as any,
      content: newMessage,
    });
    setNewMessage("");
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const channelInfo = useQuery(api.messenger.listChannels, { userId: userId as any });
  const channel = channelInfo?.find((c) => c._id === channelId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e8eaed]">
        <div className="flex items-center gap-2">
          {channel?.type === "announcement" ? (
            <Megaphone className="h-4 w-4 text-[#ea4335]" />
          ) : (
            <Hash className="h-4 w-4 text-[#5f6368]" />
          )}
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{channel?.name || "Channel"}</h3>
          {channel?.type === "announcement" && (
            <Badge className="text-[9px] px-1 py-0 h-3.5 bg-[#ea4335]">Announcements</Badge>
          )}
        </div>
        <p className="text-[11px] text-[#9aa0a6] mt-0.5">{channel?.description}</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {!messages?.length ? (
          <div className="text-center py-8">
            <MessageSquare className="h-6 w-6 text-[#dadce0] mx-auto mb-2" />
            <p className="text-[12px] text-[#9aa0a6]">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const sender = users?.find((u) => u._id === msg.senderId);
              const isPinned = msg.isPinned;
              return (
                <div key={msg._id} className={`flex gap-2 ${isPinned ? "bg-[#fef7e0] rounded-lg p-2 -mx-2" : ""}`}>
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                      {getInitials(sender?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#1a1a2e]">{sender?.name || "Unknown"}</span>
                      <span className="text-[10px] text-[#9aa0a6]">
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {isPinned && <Pin className="h-3 w-3 text-[#fbbc04]" />}
                    </div>
                    <p className="text-[12px] text-[#5f6368] mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#e8eaed]">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="h-9 text-[13px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessengerDM({
  userId1,
  userId2,
}: {
  userId1: string;
  userId2: string;
}) {
  const messages = useQuery(api.messenger.getDirectMessages, { userId1: userId1 as any, userId2: userId2 as any });
  const users = useQuery(api.users.listUsers);
  const sendDM = useMutation(api.messenger.sendDirectMessage);
  const markRead = useMutation(api.messenger.markDirectMessagesRead);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    markRead({ senderId: userId2 as any, receiverId: userId1 as any });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendDM({
      senderId: userId1 as any,
      receiverId: userId2 as any,
      content: newMessage,
    });
    setNewMessage("");
  };

  const otherUser = users?.find((u) => u._id === userId2);
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#e8eaed]">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
              {getInitials(otherUser?.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{otherUser?.name || "User"}</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {!messages?.length ? (
          <div className="text-center py-8">
            <MessageSquare className="h-6 w-6 text-[#dadce0] mx-auto mb-2" />
            <p className="text-[12px] text-[#9aa0a6]">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const sender = users?.find((u) => u._id === msg.senderId);
              const isMine = msg.senderId === userId1;
              return (
                <div key={msg._id} className={`flex gap-2 ${isMine ? "justify-end" : ""}`}>
                  {!isMine && (
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                      <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                        {getInitials(sender?.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${isMine ? "order-1" : ""}`}>
                    <div className={`rounded-lg px-3 py-2 ${isMine ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#1a1a2e]"}`}>
                      <p className="text-[12px]">{msg.content}</p>
                    </div>
                    <p className="text-[9px] text-[#9aa0a6] mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-[#e8eaed]">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="h-9 text-[13px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" className="h-9 w-9 bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MessengerPage() {
  const { user, isDemoMode } = useAuth();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [showNewChannelDialog, setShowNewChannelDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const skipDb = !user || isDemoMode;
  const channels = useQuery(api.messenger.listChannels, skipDb ? "skip" : { userId: user._id });
  const allUsers = useQuery(api.users.listUsers);
  const unreadCounts = useQuery(api.messenger.getUnreadChannelCounts, skipDb ? "skip" : { userId: user._id });
  const dmMessages = useQuery(api.messenger.getUnreadDirectMessageCount, skipDb ? "skip" : { userId: user._id });

  const createChannel = useMutation(api.messenger.createChannel);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  const handleCreateChannel = async () => {
    if (!newChannelName || !user) return;
    await createChannel({
      name: newChannelName,
      description: newChannelDesc || undefined,
      type: "channel",
      createdBy: user._id,
    });
    setNewChannelName("");
    setNewChannelDesc("");
    setShowNewChannelDialog(false);
  };

  if (!user) return null;

  const otherUsers = allUsers?.filter((u) => u._id !== user._id && !u.isDisabled) || [];
  const filteredUsers = searchQuery
    ? otherUsers.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : otherUsers;

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-0 h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-0">
        {/* Sidebar */}
        <Card className="w-[280px] shrink-0 border-[#e8eaed] shadow-sm bg-white mr-0 rounded-r-none">
          <div className="p-3 border-b border-[#e8eaed]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#1a1a2e]">Messenger</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowNewChannelDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-[12px]"
              />
            </div>
          </div>

          <Tabs defaultValue="channels" className="flex flex-col h-full">
            <TabsList className="bg-[#f1f3f4] p-0.5 mx-3 mt-2">
              <TabsTrigger value="channels" className="text-[11px] data-[state=active]:bg-white flex-1">Channels</TabsTrigger>
              <TabsTrigger value="dms" className="text-[11px] data-[state=active]:bg-white flex-1">Direct</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="flex-1 p-0 m-0">
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="p-2 space-y-0.5">
                  {channels?.map((ch) => {
                    const unread = unreadCounts?.[ch._id] || 0;
                    return (
                      <button
                        key={ch._id}
                        onClick={() => { setActiveChannel(ch._id); setActiveDM(null); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                          activeChannel === ch._id ? "bg-[#f1f3f4] text-[#1a1a2e]" : "text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e]"
                        }`}
                      >
                        {ch.type === "announcement" ? (
                          <Megaphone className="h-3.5 w-3.5 shrink-0 text-[#ea4335]" />
                        ) : (
                          <Hash className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="text-[12px] font-medium truncate flex-1">{ch.name}</span>
                        {unread > 0 && (
                          <Badge className="h-4 min-w-[18px] px-1 text-[9px] bg-[#1a73e8] rounded-full">{unread}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dms" className="flex-1 p-0 m-0">
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="p-2 space-y-0.5">
                  {filteredUsers.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => { setActiveDM(u._id); setActiveChannel(null); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                        activeDM === u._id ? "bg-[#f1f3f4] text-[#1a1a2e]" : "text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e]"
                      }`}
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[12px] font-medium truncate flex-1">{u.name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 border-[#e8eaed] shadow-sm bg-white border-l-0 rounded-l-none overflow-hidden">
          {activeChannel ? (
            <MessengerChannel channelId={activeChannel} userId={user._id} />
          ) : activeDM ? (
            <MessengerDM userId1={user._id} userId2={activeDM} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-10 w-10 text-[#dadce0] mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Select a conversation</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1">Choose a channel or DM to start messaging</p>
            </div>
          )}
        </Card>
      </div>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannelDialog} onOpenChange={setShowNewChannelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Channel Name</Label>
              <Input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. design" />
            </div>
            <div>
              <Label className="text-[12px]">Description</Label>
              <Input value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} className="h-9 text-[13px]" placeholder="Optional description" />
            </div>
            <Button onClick={handleCreateChannel} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create Channel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
