// components/Particles.js
import React, { useMemo } from "react";

const NUM_PARTICLES = 50; // Number of particles

const random = (min, max) => Math.random() * (max - min) + min;

const colors = ["#52e0b5", "#ff6b6b", "#ffd93d", "#6a5acd", "#ff69b4"]; // Example colors

const Particles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: NUM_PARTICLES }).map(() => ({
      size: random(2, 4), // px
      color: colors[Math.floor(random(0, colors.length))],
      left: random(0, 100), // %
      top: random(0, 100), // %
      duration: random(10, 20), // seconds
      delay: random(0, 5), // seconds
      translateX: random(-50, 50), // movement in px
      translateY: random(-50, 50), // movement in px
    }));
  }, []);

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: "0", overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: "50%",
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: 0,
            animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
            transform: "translate(0,0)",
          }}
        />
      ))}

      <style jsx>{`
        @keyframes particleFloat {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            // transform: translate(var(--tx), var(--ty));
            transform: translate(40.73384435655109px, -5.401679270453158px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Particles;
