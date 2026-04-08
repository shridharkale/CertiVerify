import { useEffect, useRef } from 'react';
import './VideoBackground.css';

export default function VideoBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <div className="video-bg">
      {/* Animated CSS gradient fallback + overlay */}
      <div className="gradient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
        <div className="orb orb-5"></div>
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${Math.random() * 8}s`,
              '--x': `${Math.random() * 100}%`,
              '--size': `${4 + Math.random() * 8}px`,
              '--duration': `${6 + Math.random() * 10}s`,
            }}></div>
          ))}
        </div>
      </div>
      <div className="vbg-overlay"></div>
    </div>
  );
}
