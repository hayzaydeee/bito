import React, { useState, useEffect } from "react";
import { Button, Text, Tooltip } from "@radix-ui/themes";
import {
  RocketIcon,
  PlusIcon,
  PersonIcon,
  CheckCircledIcon,
  CalendarIcon,
  InfoCircledIcon,
  ClockIcon,
  Cross2Icon,
  CheckIcon,
  TargetIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../../services/api";
import ChallengeCreateModal from "../ui/ChallengeCreateModal";

const ChallengeWidget = ({ workspaceId, className = "" }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Fetch challenges on mount
  useEffect(() => {
    fetchChallenges();
  }, [workspaceId]);

  // Fetch challenges from API
  const fetchChallenges = async () => {
    if (!workspaceId) return;
    
    try {
      setLoading(true);
      const response = await groupsAPI.getChallenges(workspaceId);
      
      if (response.success) {
        setChallenges(response.challenges || []);
      } else {
        setError("Failed to load challenges");
      }
    } catch (err) {
      setError("Error loading challenges");
    } finally {
      setLoading(false);
    }
  };

  // Handle joining a challenge
  const handleJoin = async (challengeId) => {
    try {
      setJoinLoading(true);
      const response = await groupsAPI.joinChallenge(workspaceId, challengeId);
      
      if (response.success) {
        setChallenges(prevChallenges => 
          prevChallenges.map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, participantsCount: response.participantsCount, userJoined: true }
              : challenge
          )
        );
      }
    } catch (err) {
      setError("Failed to join challenge");
    } finally {
      setJoinLoading(false);
    }
  };

  // Handle leaving a challenge
  const handleLeave = async (challengeId) => {
    try {
      setJoinLoading(true);
      const response = await groupsAPI.leaveChallenge(workspaceId, challengeId);
      
      if (response.success) {
        setChallenges(prevChallenges => 
          prevChallenges.map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, participantsCount: response.participantsCount, userJoined: false }
              : challenge
          )
        );
      }
    } catch (err) {
      setError("Failed to leave challenge");
    } finally {
      setJoinLoading(false);
    }
  };

  // Handle challenge creation success
  const handleChallengeCreated = (newChallenge) => {
    setChallenges(prev => [newChallenge, ...prev]);
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-xl bg-[var(--color-surface-elevated)] ${className} min-h-[200px] flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-500)] rounded-full mx-auto mb-2"></div>
          <Text size="1" color="gray">Loading challenges...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl bg-[var(--color-surface-elevated)] ${className}`}>
        <div className="text-center text-[var(--color-danger)]">
          <Text size="2">{error}</Text>
          <Button variant="soft" onClick={fetchChallenges} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl bg-[var(--color-surface-elevated)] ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
            <RocketIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif">Group Challenges</h2>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Team up and complete habits together
            </p>
          </div>
        </div>
        <Button 
          variant="soft" 
          color="brand"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <PlusIcon />
          New Challenge
        </Button>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-12">
          {/* Main Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-brand-100)] to-[var(--color-brand-200)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <RocketIcon className="w-8 h-8 text-[var(--color-brand-600)]" />
          </div>
          
          {/* Heading */}
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 font-dmSerif">
            No challenges yet
          </h3>
          
          {/* Description */}
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-8 font-outfit leading-relaxed">
            Create your first group challenge to build team accountability and celebrate achievements together!
          </p>
          
          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)]/30 hover:border-[var(--color-brand-400)]/50 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 font-dmSerif">
                Streak Challenges
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Build consecutive habits together
              </p>
            </div>
            
            <div className="p-4 bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)]/30 hover:border-[var(--color-brand-400)]/50 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <PersonIcon className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 font-dmSerif">
                Team Goals
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Achieve collective milestones
              </p>
            </div>
            
            <div className="p-4 bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)]/30 hover:border-[var(--color-brand-400)]/50 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <StarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 font-dmSerif">
                Achievements
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Unlock rewards and badges
              </p>
            </div>
          </div>
          
          {/* CTA Button */}
          <Button 
            variant="soft" 
            color="brand" 
            size="3"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm"
          >
            <RocketIcon />
            Create First Challenge
          </Button>
          
          {/* Helper Text */}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-4 font-outfit">
            Start with a simple streak challenge or team goal
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(challenge => (
            <div key={challenge.id} className="p-4 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-elevated)] hover:shadow-md transition-shadow">
              {/* Challenge content would go here */}
              <div className="text-center py-4">
                <Text size="2">{challenge.title}</Text>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenge create modal */}
      {isCreateModalOpen && (
        <ChallengeCreateModal
          workspaceId={workspaceId}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleChallengeCreated}
        />
      )}
    </div>
  );
};

export default ChallengeWidget;
