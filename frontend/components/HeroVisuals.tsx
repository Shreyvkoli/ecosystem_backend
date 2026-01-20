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
            {/* Abstract Background Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -z-10"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, -20, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10"
            />

            {/* Main "Player" Card */}
            <motion.div
                initial={{ rotateY: 10, rotateX: 5, opacity: 0, y: 50 }}
                animate={{ rotateY: 0, rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="glass-card overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium ml-2">Final_Cut_v3.mp4</div>
                </div>

                {/* Video Area Placeholder */}
                <div className="relative aspect-video bg-gray-900 group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                    {/* Simulated Video Content */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
                        <motion.div
                            animate={{ opacity: isPlaying ? 0 : 1, scale: isPlaying ? 0.8 : 1 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </motion.div>
                    </div>

                    {/* Floating Comments (The WOW Factor) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="absolute top-1/4 right-1/4 bg-white p-3 rounded-xl shadow-xl border border-indigo-100 max-w-[200px]"
                    >
                        <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">R</div>
                            <div>
                                <p className="text-xs font-medium text-gray-900">Color grade is slightly off here.</p>
                                <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 00:14
                                </p>
                            </div>
                        </div>
                        {/* Connecting line */}
                        <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white rotate-45 border-r border-b border-indigo-100"></div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 2.5, duration: 0.5 }}
                        className="absolute bottom-1/3 left-8 bg-white p-2.5 rounded-xl shadow-xl border border-green-100 max-w-[180px]"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Check className="w-3 h-3" />
                            </div>
                            <p className="text-xs font-medium text-gray-900">Fixed transition!</p>
                        </div>
                        {/* Connecting line */}
                        <div className="absolute bottom-2 -left-1 w-3 h-3 bg-white rotate-45 border-l border-b border-indigo-50"></div>
                    </motion.div>

                    {/* Controls */}
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                            <button className="text-white/90 hover:text-white">
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            {/* Progress Bar */}
                            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-75 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-white/80 font-mono">00:{Math.floor(progress / 100 * 59).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Info Pannel */}
                <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                V3
                            </div>
                            <span className="text-xs text-gray-400">Changed 2 mins ago</span>
                        </div>
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200"></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-200"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 bg-gray-100 rounded-full w-3/4"></div>
                        <div className="h-2 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Elements simulated 3D depth */}
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 top-1/3 glass-morphism p-3 shadow-lg z-20 hidden sm:block"
            >
                <MessageCircle className="w-6 h-6 text-indigo-600" />
            </motion.div>
        </div>
    )
}
