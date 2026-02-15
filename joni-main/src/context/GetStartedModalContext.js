import React, { createContext, useContext, useState, useCallback } from 'react';
import GetStartedModal from '@/components/GetStartedModal';
import { useAuth } from '@/context/AuthContext';

const GetStartedModalContext = createContext(null);

export function GetStartedModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(1);
  const [initialDeploymentData, setInitialDeploymentData] = useState(null);
  const { refreshInstance } = useAuth();

  const openModal = useCallback((step = 1, deploymentData = null) => {
    setInitialStep(step);
    setInitialDeploymentData(deploymentData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const saveInstance = useCallback(async (data) => {
    try {
      await fetch('/api/user/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instanceId: data?.instanceId,
          ip: data?.ip,
          token: data?.token,
          status: 'ready',
        }),
      });
      refreshInstance?.();
    } catch (e) {
      console.error('Failed to save instance', e);
    }
  }, [refreshInstance]);

  const markChannelCompleted = useCallback(async () => {
    try {
      await fetch('/api/user/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channelCompleted: true }),
      });
      refreshInstance?.();
    } catch (e) {
      console.error('Failed to mark channel completed', e);
    }
  }, [refreshInstance]);

  const startDeploy = useCallback(async () => {
    try {
      await fetch('/api/user/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'creating' }),
      });
      refreshInstance?.();
    } catch (e) {
      console.error('Failed to save deploy start', e);
    }
  }, [refreshInstance]);

  return (
    <GetStartedModalContext.Provider value={{ openModal, closeModal, saveInstance, markChannelCompleted, startDeploy }}>
      {children}
      <GetStartedModal
        isOpen={isOpen}
        onClose={closeModal}
        initialStep={initialStep}
        initialDeploymentData={initialDeploymentData}
        onSaveInstance={saveInstance}
        onMarkChannelCompleted={markChannelCompleted}
        onStartDeploy={startDeploy}
      />
    </GetStartedModalContext.Provider>
  );
}

export function useGetStartedModal() {
  const ctx = useContext(GetStartedModalContext);
  if (!ctx) {
    throw new Error('useGetStartedModal must be used within GetStartedModalProvider');
  }
  return ctx;
}
