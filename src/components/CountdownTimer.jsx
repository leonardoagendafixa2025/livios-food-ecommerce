import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate, label = "OFERTA TERMINA EM:" }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 'bold' }}>
      {label && <span style={{ opacity: 0.9 }}>{label}</span>}
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
          {String(timeLeft.days).padStart(2, '0')}d
        </span>
        :
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        :
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        :
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: '#FFD700' }}>
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
