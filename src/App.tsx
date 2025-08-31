import React, { useState } from 'react';
import LinkedInInput from './components/LinkedInInput';
import CoachingInterface from './components/CoachingInterface';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'input' | 'coaching'>('input');
  const [profileData, setProfileData] = useState<{
    name: string;
    title: string;
    company: string;
    linkedinUrl: string;
    profileImage?: string;
    companyDetails?: {
      industry: string;
      size: string;
      location: string;
    };
    personality?: {
      keyCharacteristics: string[];
      personalityTypes: string[];
    };
  } | null>(null);

  const handleProfileSubmit = (data: any) => {
    setProfileData(data);
    setCurrentPage('coaching');
  };

  const handleBackToInput = () => {
    setCurrentPage('input');
    setProfileData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentPage === 'input' ? (
        <LinkedInInput onSubmit={handleProfileSubmit} />
      ) : (
        <CoachingInterface 
          profileData={profileData} 
          onBack={handleBackToInput}
        />
      )}
    </div>
  );
}