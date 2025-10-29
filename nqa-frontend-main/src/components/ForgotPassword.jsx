import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import './LoginPage.css';

const ForgotPassword = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");

    let cW = window.innerWidth;
    let cH = window.innerHeight;
    let bgColor = "#FF6138";
    let animations = [];

    const colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
    let colorIndex = 0;
    const colorPicker = {
      next: () => {
        colorIndex = (colorIndex + 1) % colors.length;
        return colors[colorIndex];
      },
      current: () => colors[colorIndex],
    };

    const resizeCanvas = () => {
      cW = window.innerWidth;
      cH = window.innerHeight;
      c.width = cW * window.devicePixelRatio;
      c.height = cH * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const removeAnimation = (animation) => {
      const index = animations.indexOf(animation);
      if (index > -1) animations.splice(index, 1);
    };

    const calcPageFillRadius = (x, y) => {
      const l = Math.max(x - 0, cW - x);
      const h = Math.max(y - 0, cH - y);
      return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
    };

    const Circle = function (opts) {
      Object.assign(this, opts);
    };
    Circle.prototype.draw = function () {
      ctx.globalAlpha = this.opacity || 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
      if (this.stroke) {
        ctx.strokeStyle = this.stroke.color;
        ctx.lineWidth = this.stroke.width;
        ctx.stroke();
      }
      if (this.fill) {
        ctx.fillStyle = this.fill;
        ctx.fill();
      }
      ctx.closePath();
      ctx.globalAlpha = 1;
    };

    const handleEvent = (e) => {
      if (e.touches) {
        e.preventDefault();
        e = e.touches[0];
      }

      const currentColor = colorPicker.current();
      const nextColor = colorPicker.next();
      const targetR = calcPageFillRadius(e.pageX, e.pageY);
      const rippleSize = Math.min(200, cW * 0.4);
      const minCoverDuration = 750;

      const pageFill = new Circle({
        x: e.pageX,
        y: e.pageY,
        r: 0,
        fill: nextColor,
      });

      const fillAnimation = anime({
        targets: pageFill,
        r: targetR,
        duration: Math.max(targetR / 2, minCoverDuration),
        easing: "easeOutQuart",
        complete: () => {
          bgColor = pageFill.fill;
          removeAnimation(fillAnimation);
        },
      });

      const ripple = new Circle({
        x: e.pageX,
        y: e.pageY,
        r: 0,
        fill: currentColor,
        stroke: {
          width: 3,
          color: currentColor,
        },
        opacity: 1,
      });

      const rippleAnimation = anime({
        targets: ripple,
        r: rippleSize,
        opacity: 0,
        easing: "easeOutExpo",
        duration: 900,
        complete: removeAnimation,
      });

      const particles = [];
      for (let i = 0; i < 32; i++) {
        const particle = new Circle({
          x: e.pageX,
          y: e.pageY,
          fill: currentColor,
          r: Math.random() * 24 + 24,
        });
        particles.push(particle);
      }

      const particlesAnimation = anime({
        targets: particles,
        x: (p) => p.x + (Math.random() * rippleSize * 2 - rippleSize),
        y: (p) => p.y + (Math.random() * rippleSize * 2.3 - rippleSize * 1.15),
        r: 0,
        easing: "easeOutExpo",
        duration: Math.random() * 300 + 1000,
        complete: removeAnimation,
      });

      animations.push(fillAnimation, rippleAnimation, particlesAnimation);
    };

    const animateLoop = anime({
      duration: Infinity,
      update: () => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, cW, cH);
        animations.forEach((anim) => {
          anim.animatables.forEach((a) => a.target.draw());
        });
      },
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("mousedown", handleEvent);
    document.addEventListener("touchstart", handleEvent);

    return () => {
      animateLoop.pause();
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousedown", handleEvent);
      document.removeEventListener("touchstart", handleEvent);
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1
        }}
      />
      <div style={formWrapperStyle}>
        <img src="nammaqa.jpg" alt="Logo" style={{ height: 50, width:320,marginLeft: '-11px' }} />
        <h2 style={{ marginBottom: '30px' }}>Forgot Password</h2>
        <form>
          <div style={fieldWrapperStyle}>
            <div style={floatingInputWrapperStyle}>
              <label style={floatingLabelStyle}>Email-ID</label>
              <input type="email" placeholder="Enter Email-ID" className="custom-placeholder" style={floatingInputStyle} />
            </div>
            <div style={descriptionStyle}>
              Enter your registered Email-ID
            </div>
          </div>
          <button type="submit" style={buttonStyle}>Submit</button>
        </form>
      </div>
    </div>
  );
};

// Styles
const formWrapperStyle = {
   position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
        width: '300px',
        height:'260px',
        textAlign: 'center',
        fontFamily: 'Afacad, sans-serif'
};

const fieldWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '20px',
};

const floatingInputWrapperStyle = {
  position: 'relative',
  width: '100%',
};

const floatingLabelStyle = {
  position: 'absolute',
  top: '-8px',
  left: '12px',
  backgroundColor: 'white',
  padding: '0 6px',
  fontSize: '13px',
  color: '#06224a',
  zIndex: 1,
  fontFamily: 'Afacad, sans-serif',
};

const floatingInputStyle = {
  width: '95.5%',
  padding: '14px 10px',
  borderRadius: '10px',
  border: '1px solid #06224a',
  fontSize: '16px',
  fontFamily: 'Afacad, sans-serif',
  outline: 'none',
  backgroundColor: '#ffffff',
  color: '#06224a',
};

const descriptionStyle = {
  fontSize: '13px',
  color: '#06224a',
  marginTop: '8px',
  textAlign: 'left',
};

const buttonStyle = {
  width: '103%',
  padding: '14px',
  backgroundColor: ' #031D4E',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontFamily: 'Afacad, sans-serif',
};

export default ForgotPassword;
