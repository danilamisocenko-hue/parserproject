import React, { useRef, useEffect } from 'react';

export const InteractiveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let bursts: BurstParticle[] = [];
    let ripples: Ripple[] = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = -1000; // start offscreen
    let lastScrollY = window.scrollY;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * (canvas!.height + 200) - 100;
        this.size = Math.random() * 1.0 + 0.5; // Small white particles
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -50) this.x = canvas!.width + 50;
        if (this.x > canvas!.width + 50) this.x = -50;
        if (this.y < -150) this.y = canvas!.height + 150;
        if (this.y > canvas!.height + 150) this.y = -150;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class BurstParticle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
      color: string;
      isPrimary: boolean;

      constructor(x: number, y: number, isPrimary: boolean = false) {
        this.x = x;
        this.y = y;
        this.isPrimary = isPrimary;
        this.size = Math.random() * (isPrimary ? 6 : 3) + (isPrimary ? 3 : 1);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (isPrimary ? 12 : 5) + (isPrimary ? 6 : 2);
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.life = 1.0;
        
        const colors = isPrimary 
            ? ['255, 255, 255', '129, 140, 248', '99, 102, 241', '192, 132, 252']
            : ['255, 255, 255', '200, 200, 200', '160, 160, 255'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.94; // Slower deceleration
        this.speedY *= 0.94;
        this.life -= this.isPrimary ? 0.008 : 0.015; // Live longer if primary
        if (this.size > 0) this.size -= 0.03;
      }

      draw() {
        if (!ctx || this.life <= 0) return;
        const drawSize = Math.max(0, this.size);
        const drawLife = Math.max(0, this.life);
        
        ctx.fillStyle = `rgba(${this.color}, ${drawLife})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isPrimary) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${this.color}, ${drawLife})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      }
    }

    class Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      life: number;
      speed: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = 300;
        this.life = 1;
        this.speed = 15;
      }
      update() {
        this.radius += this.speed;
        this.speed *= 0.95;
        this.life -= 0.02;
      }
      draw() {
        if (!ctx || this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129, 140, 248, ${this.life * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    const init = () => {
      particles = Array.from({ length: 60 }, () => new Particle());
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleNativeClick = (e: MouseEvent) => {
      // Small ambient burst on any native click
      for (let i = 0; i < 8; i++) {
        bursts.push(new BurstParticle(e.clientX, e.clientY));
      }
    };

    const handleBurstEvent = (e: any) => {
      const { x, y, type } = e.detail;
      if (type === 'primary') {
         for (let i = 0; i < 50; i++) {
             bursts.push(new BurstParticle(x, y, true));
         }
         ripples.push(new Ripple(x, y));
         setTimeout(() => {
             ripples.push(new Ripple(x, y));
         }, 150);
      } else {
         for (let i = 0; i < 25; i++) {
             bursts.push(new BurstParticle(x, y));
         }
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      
      particles.forEach(p => {
        p.y -= delta * 0.3;
      });
    };

    // Attach native listeners
    window.addEventListener('resize', () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
      init(); 
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleNativeClick);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('canvas-burst', handleBurstEvent);

    // Initial setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.update();
        p.draw();
      }

      // Connecting lines to mouse
      for (const p of particles) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 150) * 0.2})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();

          // Slight pull towards mouse
          p.x -= dx * 0.01;
          p.y -= dy * 0.01;
        }
      }

      // Draw active ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw();
        if (ripples[i].life <= 0) {
          ripples.splice(i, 1);
        }
      }

      // Draw active bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        bursts[i].update();
        bursts[i].draw();
        if (bursts[i].life <= 0) {
          bursts.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleNativeClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('canvas-burst', handleBurstEvent);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9998]" />;
};
