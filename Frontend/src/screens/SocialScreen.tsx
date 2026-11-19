import React, { useState } from 'react';
import SquadTab from '../components/SquadTab';
import SocialFeedTab from '../components/SocialFeedTab';
import { Screen, Segmented } from '../ui';

// Social: Following and Discover feeds (SocialFeedTab) and Groups (SquadTab).
// Each tab loads its own data from Supabase and shows demo data when signed out.

interface SocialScreenProps {
  onNavigate: (screen: string) => void;
  initialTab?: number;
}

export default function SocialScreen({ onNavigate, initialTab = 0 }: SocialScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <Screen tab="Social" onSelectTab={onNavigate}>
      <Segmented items={['Following', 'Discover', 'Groups']} active={activeTab} onSelect={setActiveTab} />

      {activeTab === 0 && <SocialFeedTab key="following" tab="following" />}
      {activeTab === 1 && <SocialFeedTab key="discover" tab="discover" />}
      {activeTab === 2 && <SquadTab />}
    </Screen>
  );
}
