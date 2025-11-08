'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextType {
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  isLiffReady: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  sendMessage: (message: string) => Promise<void>;
  closeWindow: () => void;
  shareTargetPicker: (messages: any[]) => Promise<any>;
  isInClient: boolean;
  isSharetargetPickerAvailable: boolean;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export function LiffProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const initLiff = async () => {
      try {
        console.log('🚀 LIFF initialization started');
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        console.log('📝 LIFF ID:', liffId ? 'Found' : 'Not found');

        if (!liffId) {
          console.error('❌ LIFF ID is not configured');
          setError('LIFF ID is not configured');
          setIsLiffReady(true);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        // すでに初期化済みかチェック
        console.log('🔍 Checking if LIFF is already initialized...');
        try {
          const isLoggedInStatus = liff.isLoggedIn();
          console.log('✅ LIFF already initialized, logged in:', isLoggedInStatus);

          if (isLoggedInStatus) {
            setIsLiffReady(true);
            setIsLoggedIn(true);
            if (timeoutId) clearTimeout(timeoutId);

            try {
              console.log('👤 Fetching user profile...');
              const userProfile = await liff.getProfile();
              console.log('✅ Profile fetched:', userProfile.displayName);
              setProfile({
                userId: userProfile.userId,
                displayName: userProfile.displayName,
                pictureUrl: userProfile.pictureUrl,
                statusMessage: userProfile.statusMessage,
              });
            } catch (profileErr) {
              console.error('❌ Profile fetch failed:', profileErr);
            }
            return;
          } else {
            console.log('ℹ️ LIFF initialized but not logged in');
            setIsLiffReady(true);
            if (timeoutId) clearTimeout(timeoutId);
            return;
          }
        } catch (checkErr) {
          console.log('ℹ️ LIFF not yet initialized, proceeding with init...');
        }

        // 初回初期化
        console.log('🔧 Starting LIFF init...');
        await liff.init({ liffId });
        console.log('✅ LIFF init completed');
        setIsLiffReady(true);
        if (timeoutId) clearTimeout(timeoutId);

        const isLoggedInStatus = liff.isLoggedIn();
        console.log('🔐 Login status after init:', isLoggedInStatus);

        if (isLoggedInStatus) {
          setIsLoggedIn(true);

          console.log('👤 Fetching user profile...');
          const userProfile = await liff.getProfile();
          console.log('✅ Profile fetched:', userProfile.displayName);
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          });
        }
      } catch (err) {
        console.error('❌ LIFF initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'LIFF initialization failed';
        console.error('Error details:', errorMessage);
        setError(errorMessage);
        setIsLiffReady(true);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    // タイムアウト処理: 30秒経っても初期化が完了しない場合はエラー
    timeoutId = setTimeout(() => {
      console.error('⏰ LIFF initialization timeout (30 seconds)');
      setError('LIFF initialization timeout. Please reload the page.');
      setIsLiffReady(true);
    }, 30000);

    initLiff();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const login = () => {
    if (!isLiffReady) {
      console.warn('LIFF is not ready yet');
      return;
    }
    liff.login();
  };

  const logout = () => {
    if (!isLiffReady) {
      console.warn('LIFF is not ready yet');
      return;
    }
    liff.logout();
    setIsLoggedIn(false);
    setProfile(null);
  };

  const sendMessage = async (message: string) => {
    if (!isLiffReady) {
      throw new Error('LIFF is not ready');
    }

    if (!liff.isInClient()) {
      throw new Error('This feature is only available in LINE app');
    }

    await liff.sendMessages([
      {
        type: 'text',
        text: message,
      },
    ]);
  };

  const closeWindow = () => {
    if (!isLiffReady) {
      console.warn('LIFF is not ready yet');
      return;
    }
    liff.closeWindow();
  };

  const shareTargetPicker = async (messages: any[]) => {
    if (!isLiffReady) {
      throw new Error('LIFF is not ready');
    }

    // デバッグ情報を出力
    console.log('LIFF Debug Info:', {
      isInClient: liff.isInClient(),
      isLoggedIn: liff.isLoggedIn(),
      os: liff.getOS(),
      language: liff.getLanguage(),
      version: liff.getVersion(),
      lineVersion: liff.getLineVersion(),
      isApiAvailable: liff.isApiAvailable('shareTargetPicker'),
    });

    if (!liff.isInClient()) {
      throw new Error('ShareTargetPicker is only available in LINE app. Please open this page in LINE app.');
    }

    if (!liff.isApiAvailable('shareTargetPicker')) {
      throw new Error('ShareTargetPicker is not available. Please check LIFF app settings (Scope: chat_message.write required).');
    }

    try {
      const result = await liff.shareTargetPicker(messages);
      return result;
    } catch (err) {
      console.error('ShareTargetPicker error:', err);
      throw err;
    }
  };

  const value: LiffContextType = {
    isLoggedIn,
    profile,
    isLiffReady,
    error,
    login,
    logout,
    sendMessage,
    closeWindow,
    shareTargetPicker,
    isSharetargetPickerAvailable: isLiffReady && liff.isInClient() ? liff.isApiAvailable('shareTargetPicker') : false,
    isInClient: isLiffReady ? liff.isInClient() : false,
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
}
