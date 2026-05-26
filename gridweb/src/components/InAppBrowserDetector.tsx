import React, { useEffect, useState } from 'react';

const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || navigator.vendor || '';
  return /Instagram|FBAN|FBAV|Line\/|Twitter/i.test(ua);
};

const InAppBrowserDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInApp, setIsInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsInApp(isInAppBrowser());
  }, []);

  if (isInApp && !dismissed) {
    const currentUrl = window.location.href;
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'hsl(222, 47%, 6%)' }}>
        <div className="text-center max-w-sm space-y-6">
          <div className="text-5xl">🌐</div>
          <h1 className="text-xl font-bold text-white">Open in Browser Now</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            This app works best in your default browser. Instagram's in-app browser has limited support.
          </p>
          <div className="space-y-3">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, hsl(250, 70%, 50%), hsl(280, 70%, 50%))' }}
              onClick={(e) => {
                e.preventDefault();
                // Try to open in external browser
                window.open(currentUrl, '_system');
                // Fallback: copy to clipboard
                navigator.clipboard?.writeText(currentUrl);
              }}
            >
              Open in Safari / Chrome
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="block w-full py-3 px-4 rounded-xl text-gray-400 text-sm hover:text-white transition-colors"
            >
              Continue no more
            </button>
          </div>
          <div className="pt-2">
            <p className="text-gray-500 text-xs">
              Tap the <strong>•••</strong> menu above and select <strong>"Open in Safari"</strong> or <strong>"Open in Browser"</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default InAppBrowserDetector;
