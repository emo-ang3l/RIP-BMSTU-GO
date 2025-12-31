import React, { useEffect, useRef } from 'react';
import './Snowfall.css';

export const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Установка размера canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Массив снежинок
    const snowflakes: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
    }> = [];

    // Создание снежинки
    const createSnowflake = () => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
      };
    };

    // Инициализация снежинок
    for (let i = 0; i < 150; i++) {
      snowflakes.push(createSnowflake());
    }

    // Анимация
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        // Движение снежинки
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y * 0.01) * 0.5;

        // Если снежинка упала, создаем новую сверху
        if (flake.y > canvas.height) {
          flake.y = 0;
          flake.x = Math.random() * canvas.width;
        }

        // Если снежинка вышла за границы по X, возвращаем её
        if (flake.x < 0) flake.x = canvas.width;
        if (flake.x > canvas.width) flake.x = 0;

        // Рисование снежинки
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="snowfall-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

