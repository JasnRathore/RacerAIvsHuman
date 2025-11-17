import React, { useState, useEffect, useRef } from 'react';

const RacingGame = () => {
  const [playerX, setPlayerX] = useState(180);
  const [playerY, setPlayerY] = useState(400);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [raceActive, setRaceActive] = useState(false);

  const [obstacles, setObstacles] = useState([]);

  const [playerCrashed, setPlayerCrashed] = useState(false);

  const [playerScore, setPlayerScore] = useState(0);

  const keysPressed = useRef({});
  const animationRef = useRef(null);
  const obstacleTimer = useRef(null);
  const scoreTimer = useRef(null);

  const canvasPlayerRef = useRef(null);

  const TRACK_WIDTH = 400;
  const TRACK_HEIGHT = 600;
  const CAR_WIDTH = 40;
  const CAR_HEIGHT = 60;
  const OBSTACLE_SPEED = 8;
  const MOVE_SPEED = 6;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkCollision = (carX, carY, obs) => {
    return obs.some((o) => {
      return !(
        carX + CAR_WIDTH < o.x ||
        carX > o.x + o.width ||
        carY + CAR_HEIGHT < o.y ||
        carY > o.y + o.height
      );
    });
  };


  const drawTrack = (ctx, x, y, obs, crashed, score, isPlayer) => {
    ctx.clearRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, TRACK_HEIGHT);
    bgGradient.addColorStop(0, "#1a1a2e");
    bgGradient.addColorStop(1, "#0f0f1e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT);

    const trackGradient = ctx.createLinearGradient(0, 0, TRACK_WIDTH, 0);
    trackGradient.addColorStop(0, "#2a2a3e");
    trackGradient.addColorStop(0.5, "#1f1f2e");
    trackGradient.addColorStop(1, "#2a2a3e");
    ctx.fillStyle = trackGradient;
    ctx.fillRect(20, 0, TRACK_WIDTH - 40, TRACK_HEIGHT);

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 30]);
    ctx.lineDashOffset = (Date.now() / 50) % 50;
    for (let i = -30; i < TRACK_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(TRACK_WIDTH / 2, i);
      ctx.lineTo(TRACK_WIDTH / 2, i + 20);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#ff0033";
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 20;
    ctx.fillRect(0, 0, 20, TRACK_HEIGHT);
    ctx.fillRect(TRACK_WIDTH - 20, 0, 20, TRACK_HEIGHT);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    for (let i = 0; i < TRACK_HEIGHT; i += 60) {
      ctx.beginPath();
      ctx.moveTo(25, i);
      ctx.lineTo(35, i + 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(TRACK_WIDTH - 25, i);
      ctx.lineTo(TRACK_WIDTH - 35, i + 20);
      ctx.stroke();
    }

    obs.forEach((o) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(o.x + 5, o.y + 5, o.width, o.height);
      
      const obsGradient = ctx.createLinearGradient(o.x, o.y, o.x + o.width, o.y + o.height);
      obsGradient.addColorStop(0, "#ff3366");
      obsGradient.addColorStop(1, "#cc0033");
      ctx.fillStyle = obsGradient;
      ctx.shadowColor = "#ff0033";
      ctx.shadowBlur = 15;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      
      ctx.fillStyle = "rgba(255, 100, 100, 0.5)";
      ctx.fillRect(o.x, o.y, o.width / 3, 3);
      ctx.shadowBlur = 0;
    });

    ctx.save();
    
    if (!crashed) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(x + 5, y + 5, CAR_WIDTH, CAR_HEIGHT);
    }
    
    const carGradient = ctx.createLinearGradient(x, y, x + CAR_WIDTH, y + CAR_HEIGHT);
    if (crashed) {
      carGradient.addColorStop(0, "#666");
      carGradient.addColorStop(1, "#333");
    } else if (isPlayer) {
      carGradient.addColorStop(0, "#00ffff");
      carGradient.addColorStop(0.5, "#00ccdd");
      carGradient.addColorStop(1, "#0099bb");
    } else {
      carGradient.addColorStop(0, "#ffff00");
      carGradient.addColorStop(0.5, "#ffcc00");
      carGradient.addColorStop(1, "#ff9900");
    }
    
    ctx.fillStyle = carGradient;
    ctx.shadowColor = crashed ? "transparent" : (isPlayer ? "#00ffff" : "#ffff00");
    ctx.shadowBlur = crashed ? 0 : 20;
    
    ctx.fillRect(x, y, CAR_WIDTH, CAR_HEIGHT);
    
    ctx.fillStyle = crashed ? "#444" : "rgba(100, 100, 150, 0.8)";
    ctx.fillRect(x + 5, y + 10, CAR_WIDTH - 10, 15);
    ctx.fillRect(x + 5, y + 35, CAR_WIDTH - 10, 15);
    
    if (!crashed) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(x + 2, y + 5, 5, CAR_HEIGHT - 10);
      ctx.fillRect(x, y, CAR_WIDTH, 3);
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();

    const scoreBarGradient = ctx.createLinearGradient(0, 0, TRACK_WIDTH, 0);
    scoreBarGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    scoreBarGradient.addColorStop(0.5, "rgba(20, 20, 40, 0.9)");
    scoreBarGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
    ctx.fillStyle = scoreBarGradient;
    ctx.fillRect(0, 0, TRACK_WIDTH, 50);
    
    ctx.strokeStyle = isPlayer ? "#00ffff" : "#ffff00";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, TRACK_WIDTH - 4, 46);
    
    ctx.fillStyle = isPlayer ? "#00ffff" : "#ffff00";
    ctx.shadowColor = isPlayer ? "#00ffff" : "#ffff00";
    ctx.shadowBlur = 10;
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(score.toString().padStart(6, "0"), TRACK_WIDTH / 2, 32);
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (!gameStarted || gameOver || !raceActive) return;

    const loop = () => {
      if (!playerCrashed) {
        if (keysPressed.current["ArrowLeft"] && playerX > 10)
          setPlayerX((p) => p - MOVE_SPEED);
        if (keysPressed.current["ArrowRight"] && playerX < TRACK_WIDTH - CAR_WIDTH - 10)
          setPlayerX((p) => p + MOVE_SPEED);
        if (keysPressed.current["ArrowUp"] && playerY > 50)
          setPlayerY((p) => p - MOVE_SPEED);
        if (keysPressed.current["ArrowDown"] && playerY < TRACK_HEIGHT - CAR_HEIGHT - 10)
          setPlayerY((p) => p + MOVE_SPEED);
      }


      const updatedObstacles = obstacles
        .map((o) => ({ ...o, y: o.y + OBSTACLE_SPEED }))
        .filter((o) => o.y < TRACK_HEIGHT + 50);

      setObstacles(updatedObstacles);

      if (!playerCrashed && checkCollision(playerX, playerY, updatedObstacles)) {
        setPlayerCrashed(true);
        setRaceActive(false);
        setTimeout(() => {
          setGameOver(true);
        }, 1000);
        return;
      }

      const pCtx = canvasPlayerRef.current.getContext("2d");

      drawTrack(pCtx, playerX, playerY, updatedObstacles, playerCrashed, playerScore, true);

      if (raceActive) {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [
    gameStarted,
    gameOver,
    raceActive,
    playerX,
    playerY,
    playerCrashed,
    obstacles,
    playerScore,
  ]);

  useEffect(() => {
    if (!gameStarted || gameOver || !raceActive) return;

    obstacleTimer.current = setInterval(() => {
      const newObstacle = {
        x: 10 + Math.random() * (TRACK_WIDTH - 70),
        y: -80,
        width: 35 + Math.random() * 25,
        height: 35 + Math.random() * 25,
      };
      setObstacles((p) => [...p, newObstacle]);
    }, 700);

    return () => clearInterval(obstacleTimer.current);
  }, [gameStarted, gameOver, raceActive]);

  useEffect(() => {
    if (!gameStarted || gameOver || !raceActive) return;

    scoreTimer.current = setInterval(() => {
      if (!playerCrashed) setPlayerScore((p) => p + 10);
    }, 100);

    return () => clearInterval(scoreTimer.current);
  }, [gameStarted, gameOver, raceActive, playerCrashed]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    setRaceActive(true);
    setPlayerX(180);
    setPlayerY(400);
    setObstacles([]);
    setPlayerCrashed(false);
    setPlayerScore(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black p-4">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 mb-6 font-mono tracking-wider"
        style={{ textShadow: "0 0 20px rgba(139, 92, 246, 0.5)" }}>
        RETRO RACER
      </h1>

      {!gameStarted && !gameOver && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold py-4 px-12 text-2xl font-mono border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
          >
            INSERT COIN
          </button>
          <p className="text-cyan-400 mt-4 text-lg font-mono">Use Arrow Keys to Control</p>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="p-12 border-8 bg-gradient-to-br from-gray-900 to-purple-900 text-center relative overflow-hidden"
            style={{ 
              borderImage: "linear-gradient(45deg, #fbbf24, #a855f7, #06b6d4) 1",
              boxShadow: "0 0 50px rgba(168, 85, 245, 0.8), inset 0 0 50px rgba(0, 0, 0, 0.5)"
            }}>
            <div className="relative z-10">
              <h2 className="text-7xl font-mono mb-6 animate-pulse"
                style={{
                  color: winner === "player" ? "#00ffff" : "#ff3366",
                  textShadow: winner === "player" 
                    ? "0 0 30px #00ffff, 0 0 60px #00ffff" 
                    : "0 0 30px #ff3366, 0 0 60px #ff3366"
                }}>
                {winner === "player" ? "🏆 VICTORY! 🏆" : "💥 WRECKED! 💥"}
              </h2>
              
              <div className="text-2xl font-mono text-white mb-8 space-y-3">
                <div className="flex justify-between items-center px-8 py-3 bg-black bg-opacity-50 rounded">
                  <span className="text-cyan-400">YOUR SCORE:</span>
                  <span className="text-cyan-400 font-bold text-3xl">{playerScore}</span>
                </div>
                
                {winner === "player" && (
                  <p className="text-green-400 text-xl mt-4 animate-pulse">
                    You beat the AI! 🎮
                  </p>
                )}
              </div>
              
              <button
                onClick={startGame}
                className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold py-4 px-12 text-xl border-4 border-green-300 font-mono hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 mt-6">
        <div className="relative">
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="text-cyan-400 font-bold text-xl font-mono bg-black bg-opacity-70 px-4 py-1 rounded">
              PLAYER
            </span>
          </div>
          <canvas
            ref={canvasPlayerRef}
            width={TRACK_WIDTH}
            height={TRACK_HEIGHT}
            className="border-4 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.5)]"
            style={{ borderColor: "#00ffff", imageRendering: "pixelated" }}
          />
        </div>
        
      </div>
    </div>
  );
};

export default RacingGame;
