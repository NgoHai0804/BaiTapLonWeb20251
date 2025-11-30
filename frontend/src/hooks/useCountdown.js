import { useState, useEffect, useRef } from 'react';

// useCountdown.js
// Bộ đếm thời gian đơn giản: start / pause / reset.

export const useCountdown = (initialTime = 30, onTimeout = null) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (onTimeout) {
              onTimeout();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onTimeout]);

  const start = (time = initialTime) => {
    setTimeLeft(time);
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = (time = initialTime) => {
    setIsRunning(false);
    setTimeLeft(time);
  };

  const resume = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  };

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    resume,
  };
};

export default useCountdown;
