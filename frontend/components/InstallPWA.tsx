'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Robust check for standalone mode
        const checkStandalone = () => {
            const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');
            setIsStandalone(isStandaloneMode);
        };

        checkStandalone(); // Initial check

        // Listen for changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        try {
            mediaQuery.addEventListener('change', checkStandalone);
        } catch (e) {
            // Fallback for older browsers
            mediaQuery.addListener(checkStandalone);
        }

        // Check for iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log('beforeinstallprompt event captured');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    if (isStandalone) return null;

    // Render Install Button (Persistent until installed)
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-50 w-max">
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 border-2 border-indigo-400 animate-bounce"
            >
                <Download className="w-5 h-5" />
                Install App
            </button>

            {/* Helper text/tooltip can be added here if needed, or simple Alert for now */}
        </div>
    );

    function handleInstallClick() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
            });
        } else if (isIOS) {
            // Show iOS specific instructions
            alert("To install on iOS:\n1. Tap the Share button (square with arrow up)\n2. Scroll down and tap 'Add to Home Screen'");
        } else {
            // Show generic instructions for other browsers that might not support the event or have already fired it
            alert("To install:\n1. Open your browser menu (three dots/lines)\n2. Tap 'Add to Home Screen' or 'Install App'");
        }
    }
}
