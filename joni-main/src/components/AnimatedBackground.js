
export default function AnimatedBackground() {
  return (
    <div className="animated-bg" style={{pointerEvents: "none", zIndex: "-1"}}>
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />
      <div className="gradient-orb orb-4" />
      <div className="gradient-orb orb-5" />
    </div>
  );
}
