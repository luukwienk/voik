import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faCog } from '@fortawesome/free-solid-svg-icons';

const Timer = () => {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [time, setTime] = useState(workTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, time]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playRepeatingAudio();
    setIsBreak(!isBreak);
    setTime(isBreak ? workTime * 60 : breakTime * 60);
  };

  const toggleTimer = () => {
    if (!isActive && time === 0) {
      // If timer is not active and time is 0, reset to work time
      setTime(workTime * 60);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTime(workTime * 60);
  };

  const playRepeatingAudio = () => {
    if (audioContextRef.current) {
      const beepDuration = 0.3;
      const gapDuration = 0.5
      const repeatCount = 5;

      for (let i = 0; i < repeatCount; i++) {
        const startTime = audioContextRef.current.currentTime + i * (beepDuration + gapDuration);
        
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      }
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWorkTimeChange = (e) => {
    const newWorkTime = parseInt(e.target.value, 10);
    setWorkTime(newWorkTime);
    if (!isActive && !isBreak) {
      setTime(newWorkTime * 60);
    }
  };

  const handleBreakTimeChange = (e) => {
    setBreakTime(parseInt(e.target.value, 10));
  };

  return (
    <div className="timer">
      <h2>{isBreak ? 'Break Time' : 'Work Time'}</h2>
      <div className="time-display">{formatTime(time)}</div>
      <div className="controls">
        <button onClick={toggleTimer}>
          <FontAwesomeIcon icon={isActive ? faPause : faPlay} />
          {isActive ? ' Pause' : ' Start'}
        </button>
        <button onClick={resetTimer}>
          <FontAwesomeIcon icon={faStop} /> Reset
        </button>
        <button onClick={() => setShowSettings(!showSettings)}>
          <FontAwesomeIcon icon={faCog} /> Settings
        </button>
      </div>
      {showSettings && (
        <div className="timer-settings">
          <div>
            <label htmlFor="workTime">Work Time (minutes): </label>
            <input
              type="number"
              id="workTime"
              value={workTime}
              onChange={handleWorkTimeChange}
              min="1"
              max="60"
            />
          </div>
          <div>
            <label htmlFor="breakTime">Break Time (minutes): </label>
            <input
              type="number"
              id="breakTime"
              value={breakTime}
              onChange={handleBreakTimeChange}
              min="1"
              max="30"
            />
          </div>
        </div>
      )}
      <button onClick={playRepeatingAudio}>Test Sound</button>
    </div>
  );
};

export default Timer;