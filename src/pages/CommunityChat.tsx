import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CommunityChat from '@/components/CommunityChat';
import DirectMessaging from '@/components/DirectMessaging';
import { useAuth } from '@/contexts/AuthContext';

const CommunityPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Direct messaging state
  const [dmOpen, setDmOpen] = useState(false);
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(null);
  const [selectedDmUserName, setSelectedDmUserName] = useState<string | null>(null);

  // Extract community info from URL parameters
  const communityId = searchParams.get('id') || 'unknown';
  const communityName = searchParams.get('name') || 'Unknown Community';
  const currentUserId = user?.id || 'guest';
  const currentUserName = user?.name || 'Guest';

  const handleClose = () => {
    navigate('/'); // Navigate back to main page
  };

  const handleOpenDM = (userId: string, userName: string) => {
    console.log('Opening DM with:', userId, userName);
    setSelectedDmUser(userId);
    setSelectedDmUserName(userName);
    setDmOpen(true);
  };

  return (
    <>
      <CommunityChat
        communityId={communityId}
        communityName={communityName}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={handleClose}
        onOpenDM={handleOpenDM}
      />
      
      {/* Direct Messaging Modal */}
      <DirectMessaging
        isOpen={dmOpen}
        onClose={() => {
          setDmOpen(false);
          setSelectedDmUser(null);
          setSelectedDmUserName(null);
        }}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        selectedUserId={selectedDmUser || undefined}
        selectedUserName={selectedDmUserName || undefined}
      />
    </>
  );
};

export default CommunityPage;