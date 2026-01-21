import { useEffect, useState } from "react";
import "../styles/Hero.css";
const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);
  return (
    <section id="home" className="hero">
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "10px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskComposite: "intersect",
          maskComposite: "intersect",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
        className="hero-container"
      >
        <div className={`hero-content ${isVisible ? "visible" : ""}`}>
          <div className="hero-text">
            <h1>Google Developer Group</h1>
            <h2>on Campus MMMUT</h2>
            <p>Developing Together a Better Tomorrow</p>
          </div>

          <div className="hero-image">
            <div className="rotating-cube">
              <div className="cube-face front">G</div>
              <div className="cube-face back">G</div>
              <div className="cube-face right">D</div>
              <div className="cube-face left">I/O</div>
              <div className="cube-face top">DEV</div>
              <div className="cube-face bottom">TECH</div>
            </div>
            {/* <img src={gdgGif} alt="GDG logo animation" /> */}
          </div>
        </div>

        <div className="hero-background">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="floating-shape"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
                backgroundColor: [
                  "rgba(66, 133, 244, 0.2)", // blue
                  "rgba(219, 68, 55, 0.2)", // red
                  "rgba(244, 180, 0, 0.2)", // yellow
                  "rgba(15, 157, 88, 0.2)", // green
                ][Math.floor(Math.random() * 4)],
              }}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
