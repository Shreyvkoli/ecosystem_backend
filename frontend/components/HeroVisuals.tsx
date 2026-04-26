'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Play, Pause, MessageCircle, Check, Clock } from 'lucide-react'

export default function HeroVisuals() {
    const [isPlaying, setIsPlaying] = useState(true)
    const [progress, setProgress] = useState(30)

    // Simulated playback
    useEffect(() => {
        if (!isPlaying) return
        const interval = setInterval(() => {
            setProgress(p => (p >= 100 ? 0 : p + 0.5))
        }, 50)
        return () => clearInterval(interval)
    }, [isPlaying])

    return (
        <div className="relative w-full max-w-lg mx-auto lg:mx-0 perspective-1000">
            {/* Subtle Gradient Accents */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10" />

            {/* Main "Player" Card */}
            <motion.div
                initial={{ rotateY: 10, rotateX: 5, opacity: 0, y: 50 }}
                animate={{ rotateY: 0, rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="pro-card overflow-hidden relative z-10 shadow-2xl border-gray-100 p-0"
            >
                {/* Header */}
                <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                    </div>
                    <div className="text-[11px] text-gray-500 font-bold ml-2 tracking-wide uppercase">Final_Cut_v3.mp4</div>
                </div>

                {/* Video Area */}
                <div className="relative aspect-video bg-charcoal group overflow-hidden">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    >
                        <source src="https://player.vimeo.com/external/434045526.sd.mp4?s=c83134639d6756855b41cf434e3e3b38144b209c&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Gradient Overlay for Text Legibility */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-charcoal/90 to-transparent pointer-events-none" />

                    {/* Play/Pause Overlay Pulse */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{ opacity: isPlaying ? 0 : 1, scale: isPlaying ? 0.8 : 1 }}
                            className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                        >
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </motion.div>
                    </div>

                    {/* Floating Comments */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="absolute top-1/4 right-8 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 max-w-[220px]"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">RV</div>
                            <div>
                                <p className="text-xs font-bold text-charcoal">Adjust color saturation.</p>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 00:14
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 2.5, duration: 0.5 }}
                        className="absolute bottom-1/4 left-8 bg-white p-3.5 rounded-xl shadow-2xl border border-brand/20 max-w-[180px]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-charcoal">Scene 2 optimized.</p>
                        </div>
                    </motion.div>

                    {/* Controls */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-4">
                            <button className="text-white hover:text-brand transition-colors">
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            {/* Progress Bar */}
                            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand transition-all duration-75 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[11px] text-white font-bold font-mono">00:{Math.floor(progress / 100 * 59).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Info Pannel */}
                <div className="p-6 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-md text-[10px] font-black bg-brand/10 text-brand border border-brand/20 uppercase tracking-widest">
                            Draft v3
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Updated 2m ago</span>
                    </div>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${i === 1 ? 'bg-brand/20' : 'bg-gray-100'}`} />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
