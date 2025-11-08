import { useEffect, useState } from 'react';
import liff from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export function useLiff() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

        if (!liffId) {
          setError('LIFF ID is not configured');
          return;
        }

        // LIFF初期化
        await liff.init({ liffId });
        setIsLiffReady(true);

        // ログイン状態を確認
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);

          // プロフィール情報を取得
          const userProfile = await liff.getProfile();
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          });
        }
      } catch (err) {
        console.error('LIFF initialization failed:', err);
        setError(err instanceof Error ? err.message : 'LIFF initialization failed');
      }
    };

    initLiff();
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

  return {
    isLoggedIn,
    profile,
    isLiffReady,
    error,
    login,
    logout,
    sendMessage,
    closeWindow,
    isInClient: isLiffReady ? liff.isInClient() : false,
  };
}
