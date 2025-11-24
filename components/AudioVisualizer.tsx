import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  color: string; // e.g., 'rgb(59, 130, 246)'
  active: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, color, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyser || !active) {
         // Draw idle line
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down slightly

        // Dynamic color based on height or passed prop
        // Use the passed color but vary opacity
        ctx.fillStyle = color; 
        
        // Center the bars vertically
        const y = (canvas.height - barHeight) / 2;
        
        // Draw rounded pill shape
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 5);
        ctx.fill();

        x += barWidth + 2;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, active, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-32 md:h-48 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50"
    />
  );
};

export default AudioVisualizer;