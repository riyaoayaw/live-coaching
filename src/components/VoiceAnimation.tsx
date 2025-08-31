import React from 'react';
import { motion } from 'motion/react';

export default function VoiceAnimation() {
  // Generate random waveform bar heights to simulate real audio input
  const generateWaveformData = () => {
    return Array.from({ length: 15 }, () => ({
      height: Math.random() * 40 + 8, // Random height between 8-48px
      animationDelay: Math.random() * 0.5, // Random delay up to 0.5s
      duration: 0.3 + Math.random() * 0.4, // Random duration between 0.3-0.7s
    }));
  };

  const waveformBars = generateWaveformData();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Waveform Container */}
      <div className="flex items-end justify-center space-x-1 h-16">
        {waveformBars.map((bar, index) => (
          <motion.div
            key={index}
            className="bg-blue-500 rounded-full"
            style={{
              width: '3px',
              minHeight: '6px',
            }}
            animate={{
              height: [
                bar.height * 0.3, 
                bar.height, 
                bar.height * 0.6, 
                bar.height * 0.8, 
                bar.height * 0.4
              ],
              opacity: [0.6, 1, 0.8, 0.9, 0.7],
            }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: bar.animationDelay,
              repeatDelay: Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      {/* Subtle pulse background */}
      <motion.div
        className="absolute w-32 h-32 bg-blue-400/10 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Recording indicator dot */}
      <motion.div
        className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
        animate={{
          opacity: [1, 0.3, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}