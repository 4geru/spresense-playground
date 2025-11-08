'use client';

import { useLiff } from '@/contexts/LiffContext';

interface LiffLoginProps {
  onLoginSuccess?: () => void;
  showProfile?: boolean;
}

export default function LiffLogin({ onLoginSuccess, showProfile = true }: LiffLoginProps) {
  const { isLoggedIn, profile, isLiffReady, error, login, logout } = useLiff();

  // ログイン成功時のコールバック
  if (isLoggedIn && onLoginSuccess) {
    onLoginSuccess();
  }

  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <p className="font-bold">LIFF Error</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!isLiffReady) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <p>Initializing LIFF...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-900 text-white p-6 rounded-lg text-center">
        <h2 className="text-xl font-bold mb-4">LINE Login Required</h2>
        <p className="text-gray-400 mb-6">
          Please login with your LINE account to continue
        </p>
        <button
          onClick={login}
          className="bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Login with LINE
        </button>
      </div>
    );
  }

  if (!showProfile) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <div className="flex items-center gap-4">
        {profile?.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={profile.displayName}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-bold">{profile?.displayName}</p>
          {profile?.statusMessage && (
            <p className="text-sm text-gray-400">{profile.statusMessage}</p>
          )}
        </div>
        <button
          onClick={logout}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
