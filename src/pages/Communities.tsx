import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Users, MapPin, Plus, Search, Globe, User, ArrowLeft, MessageSquare } from "lucide-react";
import type { Community } from "../../shared/schema";
import CommunityFeed from "@/components/CommunityFeed";
import CommunityChat from "@/components/CommunityChat";
import DirectMessaging from "@/components/DirectMessaging";

export default function Communities() {
  const { user, isVerifiedHost } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedCommunityForChat, setSelectedCommunityForChat] = useState<string | null>(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(null);
  const [selectedDmUserName, setSelectedDmUserName] = useState<string | null>(null);

  // Fetch communities
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Filter communities based on search and local mode
  const filteredCommunities = (communities as Community[]).filter((community: Community) => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // TODO: Implement actual location-based filtering for local mode
    // For now, we'll show all communities regardless of local mode
    return matchesSearch;
  });

  const handleOpenDM = (userId: string, userName?: string) => {
    setSelectedDmUser(userId);
    setSelectedDmUserName(userName || null);
    setDmOpen(true);
  };

  const handleJoinEvent = (eventId: string) => {
    console.log('Joining event:', eventId);
    // TODO: Implement event joining logic
  };

  const handleOpenCommunityChat = (communityId: string) => {
    setSelectedCommunityForChat(communityId);
    setActiveTab("chat");
  };

  const handleCloseCommunityChat = () => {
    setSelectedCommunityForChat(null);
    setActiveTab("feed");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/" data-testid="link-home">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Map
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                  <Users className="h-6 w-6" />
                  Communities
                </h1>
                <p className="text-gray-400" data-testid="text-page-description">
                  Connect with local groups and global conversations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDmOpen(true)}
                data-testid="button-open-messages"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
              
              {isVerifiedHost && (
                <Link to="/create-community" data-testid="link-create-community">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search and Global/Local Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                data-testid="input-search-communities"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Global</span>
              <Toggle
                pressed={isLocalMode}
                onPressedChange={setIsLocalMode}
                aria-label="Toggle local mode"
                className="data-[state=on]:bg-blue-600"
                data-testid="toggle-local-mode"
              >
                {isLocalMode ? <User className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </Toggle>
              <span className="text-sm text-gray-400">Local</span>
            </div>
          </div>

          {isLocalMode && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg" data-testid="text-local-mode-info">
              <p className="text-blue-400 text-sm">
                <MapPin className="h-4 w-4 inline mr-1" />
                Local mode: Showing communities and discussions from people in your geographic area
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="feed" data-testid="tab-feed">Feed</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">Chat</TabsTrigger>
            <TabsTrigger value="communities" data-testid="tab-all-communities">All Communities</TabsTrigger>
            <TabsTrigger value="joined" data-testid="tab-joined-communities">Joined</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <CommunityFeed 
              posts={[]} 
              onOpenDM={handleOpenDM}
              onJoinEvent={handleJoinEvent}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            {selectedCommunityForChat ? (
              <div className="h-[700px]">
                <CommunityChat
                  communityId={selectedCommunityForChat}
                  communityName={communities.find(c => c.id === selectedCommunityForChat)?.name || "Community Chat"}
                  currentUserId="current_user_123"
                  currentUserName="You"
                  onOpenDM={handleOpenDM}
                  onClose={handleCloseCommunityChat}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-12" data-testid="text-select-community">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Select a Community to Chat</h3>
                  <p className="text-gray-500 mb-6">Choose a community below to start chatting with members in different regions</p>
                </div>
                
                <div className="grid gap-4">
                  {filteredCommunities.slice(0, 6).map((community) => (
                    <Card key={community.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => handleOpenCommunityChat(community.id)} data-testid={`card-community-chat-${community.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-600 text-white">
                                {community.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white mb-1" data-testid={`text-community-name-${community.id}`}>
                                {community.name}
                              </h3>
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2" data-testid={`text-community-description-${community.id}`}>
                                {community.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {community.memberCount.toLocaleString()} members
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {community.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" data-testid={`button-join-chat-${community.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Join Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="communities" className="mt-6">
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-communities">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No communities found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Be the first to create a community!"}
                </p>
                {isVerifiedHost && !searchTerm && (
                  <Link to="/create-community" data-testid="link-create-first-community">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Community
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCommunities.map((community: Community) => (
                  <Card key={community.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors" data-testid={`card-community-${community.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`/api/placeholder/48/48`} />
                            <AvatarFallback className="bg-blue-600 text-white">
                              {community.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-white" data-testid={`text-community-name-${community.id}`}>
                              {community.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400" data-testid={`text-community-category-${community.id}`}>
                              {community.category}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-900 text-green-400" data-testid={`badge-public-${community.id}`}>
                            Public
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4" data-testid={`text-community-description-${community.id}`}>
                        {community.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="text-gray-400 border-gray-600" data-testid={`tag-neighborhood-${community.id}`}>
                          {community.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span data-testid={`text-member-count-${community.id}`}>
                            <Users className="h-4 w-4 inline mr-1" />
                            {Math.floor(Math.random() * 1000) + 50} members
                          </span>
                          <span data-testid={`text-created-date-${community.id}`}>
                            Created {new Date(community.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" data-testid={`button-join-${community.id}`}>
                          Join Community
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="joined" className="mt-6">
            <div className="text-center py-12" data-testid="text-joined-placeholder">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Your Communities</h3>
              <p className="text-gray-500">Communities you've joined will appear here</p>
            </div>
          </TabsContent>

        </Tabs>
      </div>
      
      {/* Direct Messaging */}
      <DirectMessaging
        isOpen={dmOpen}
        onClose={() => {
          setDmOpen(false);
          setSelectedDmUser(null);
          setSelectedDmUserName(null);
        }}
        currentUserId={user?.id || 'guest'}
        currentUserName={user?.name || 'Guest'}
        selectedUserId={selectedDmUser || undefined}
        selectedUserName={selectedDmUserName || undefined}
      />
    </div>
  );
}