// RippleBackground.jsx
import React, { useEffect, useRef } from "react";
import anime from "animejs";

const RippleBackground = () => {
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

    // Cleanup
    return () => {
      animateLoop.pause();
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousedown", handleEvent);
      document.removeEventListener("touchstart", handleEvent);
    };
  }, []);

  return (
    <canvas
      id="c"
      ref={canvasRef}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
      }}
    ></canvas>
  );
};

export default RippleBackground;
