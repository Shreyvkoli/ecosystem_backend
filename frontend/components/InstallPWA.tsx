'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsStandalone(true);
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

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
    };

    if (isStandalone) return null;

    // Render Install Button for Chrome/Edge/Android
    if (deferredPrompt) {
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 border-2 border-indigo-400"
                >
                    <Download className="w-5 h-5" />
                    Install Cutflow App
                </button>
            </div>
        );
    }

    // Optional: Render iOS Instructions (Since functionality for button doesn't exist on iOS)
    // The user asked for a note, but showing a UI hint can be nice. 
    // For now, I will omit the iOS specific UI unless explicitly asked to design it, 
    // but the user asked for a NOTE on how it behaves. I will provide that in the final response.

    return null;
}
