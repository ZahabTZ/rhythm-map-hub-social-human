import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CommunityChat from '@/components/CommunityChat';

const CommunityPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract community info from URL parameters
  const communityId = searchParams.get('id') || 'unknown';
  const communityName = searchParams.get('name') || 'Unknown Community';
  const currentUserId = 'user-1'; // This would normally come from auth context
  const currentUserName = 'Demo User'; // This would normally come from auth context

  const handleClose = () => {
    navigate('/'); // Navigate back to main page
  };

  const handleOpenDM = (userId: string, userName: string) => {
    console.log('Opening DM with:', userId, userName);
    // TODO: Implement DM functionality
  };

  return (
    <CommunityChat
      communityId={communityId}
      communityName={communityName}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      onClose={handleClose}
      onOpenDM={handleOpenDM}
    />
  );
};

export default CommunityPage;