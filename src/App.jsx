import React, { useState, useEffect, useRef, useCallback } from 'react';

const RacingGame = () => {
  const [playerX, setPlayerX] = useState(180);
  const [playerY, setPlayerY] = useState(400);
  const [botX, setBotX] = useState(180);
  const [botY, setBotY] = useState(400);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const [obstacles, setObstacles] = useState([]);
  const [botObstacles, setBotObstacles] = useState([]);

  const [playerCrashed, setPlayerCrashed] = useState(false);
  const [botCrashed, setBotCrashed] = useState(false);

  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  const keysPressed = useRef({});
  const animationRef = useRef(null);
  const obstacleTimer = useRef(null);
  const scoreTimer = useRef(null);

  const botXRef = useRef(180);
  const botYRef = useRef(400);

  const canvasPlayerRef = useRef(null);
  const canvasBotRef = useRef(null);

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

  // =====================================================
  //               PERFECT AI — FULL VISION
  // =====================================================
  const updateBotPosition = useCallback(() => {
    if (botCrashed) return;

    let x = botXRef.current;
    let y = botYRef.current;

    const BOT_SPEED = 4.2;
    const LOOKAHEAD_Y = 420;
    const PREDICT = 110;
    const GRID = 20;

    const leftBoundary = 10;
    const rightBoundary = TRACK_WIDTH - CAR_WIDTH - 10;

    const roadWidth = rightBoundary - leftBoundary;
    const slotWidth = roadWidth / GRID;

    // 1. Danger map
    const danger = Array(GRID).fill(0);

    botObstacles.forEach((o) => {
      const ghostY = o.y + PREDICT;
      const dy = ghostY - y;

      if (dy < -40 || dy > LOOKAHEAD_Y) return;

      const obsLeft = o.x;
      const obsRight = o.x + o.width;

      const startSlot = Math.max(0, Math.floor((obsLeft - leftBoundary) / slotWidth));
      const endSlot = Math.min(GRID - 1, Math.floor((obsRight - leftBoundary) / slotWidth));

      for (let s = startSlot; s <= endSlot; s++) {
        let proximityPenalty = (LOOKAHEAD_Y - dy) * 4;
        danger[s] += proximityPenalty;
      }
    });

    // 2. Smooth map
    const smoothed = danger.map((v, i) => {
      const L = danger[i - 1] ?? v;
      const R = danger[i + 1] ?? v;
      return v * 0.6 + (L + R) * 0.2;
    });

    // 3. Find safest slot
    let bestSlot = 0;
    let bestScore = Infinity;
    for (let i = 0; i < GRID; i++) {
      if (smoothed[i] < bestScore) {
        bestScore = smoothed[i];
        bestSlot = i;
      }
    }

    const targetX =
      leftBoundary + bestSlot * slotWidth + slotWidth / 2 - CAR_WIDTH / 2;

    // 4. Move bot
    const dx = targetX - x;
    if (Math.abs(dx) > 1) {
      x += dx > 0 ? BOT_SPEED : -BOT_SPEED;
    }

    x = Math.max(leftBoundary, Math.min(x, rightBoundary));

    botXRef.current = x;
    setBotX(x);
  }, [botObstacles, botCrashed]);

  // =====================================================
  //                      DRAWING
  // =====================================================

  const drawTrack = (ctx, x, y, obs, crashed, score, isPlayer) => {
    ctx.clearRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 20]);
    for (let i = 0; i < TRACK_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(TRACK_WIDTH / 2, i);
      ctx.lineTo(TRACK_WIDTH / 2, i + 16);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#ff0033";
    ctx.fillRect(0, 0, 2, TRACK_HEIGHT);
    ctx.fillRect(TRACK_WIDTH - 2, 0, 2, TRACK_HEIGHT);

    obs.forEach((o) => {
      ctx.fillStyle = "#ff2222";
      ctx.shadowColor = "red";
      ctx.shadowBlur = 10;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.shadowBlur = 0;
    });

    ctx.save();
    ctx.fillStyle = crashed ? "#555" : isPlayer ? "#00eefe" : "#ffe600";
    ctx.shadowColor = isPlayer ? "cyan" : "yellow";
    ctx.shadowBlur = crashed ? 0 : 15;
    ctx.fillRect(x, y, CAR_WIDTH, CAR_HEIGHT);
    ctx.shadowBlur = 0;

    ctx.fillStyle = crashed ? "#999" : "#fff";
    ctx.font = "30px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(crashed ? "💥" : "▲", x + CAR_WIDTH / 2, y + CAR_HEIGHT / 2);
    ctx.restore();

    ctx.fillStyle = "rgba(0,255,0,0.6)";
    ctx.fillRect(2, 2, TRACK_WIDTH - 4, 36);
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 24px monospace";
    ctx.fillText(score.toString().padStart(6, "0"), TRACK_WIDTH / 2, 20);
  };

  // =====================================================
  //                    GAME LOOP
  // =====================================================

  useEffect(() => {
    if (!gameStarted || gameOver) return;

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

      updateBotPosition();

      const updatedPlayer = obstacles
        .map((o) => ({ ...o, y: o.y + OBSTACLE_SPEED }))
        .filter((o) => o.y < TRACK_HEIGHT + 50);

      const updatedBot = botObstacles
        .map((o) => ({ ...o, y: o.y + OBSTACLE_SPEED }))
        .filter((o) => o.y < TRACK_HEIGHT + 50);

      setObstacles(updatedPlayer);
      setBotObstacles(updatedBot);

      if (!playerCrashed && checkCollision(playerX, playerY, updatedPlayer)) {
        setPlayerCrashed(true);
        setTimeout(() => {
          setGameOver(true);
          setWinner("bot");
        }, 1500);
      }

      if (!botCrashed && checkCollision(botXRef.current, botYRef.current, updatedBot)) {
        setBotCrashed(true);
        setTimeout(() => {
          setGameOver(true);
          setWinner("player");
        }, 1500);
      }

      const pCtx = canvasPlayerRef.current.getContext("2d");
      const bCtx = canvasBotRef.current.getContext("2d");

      drawTrack(pCtx, playerX, playerY, updatedPlayer, playerCrashed, playerScore, true);
      drawTrack(bCtx, botXRef.current, botYRef.current, updatedBot, botCrashed, botScore, false);

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [
    gameStarted,
    gameOver,
    playerX,
    playerY,
    playerCrashed,
    botCrashed,
    obstacles,
    botObstacles,
    playerScore,
    botScore,
    updateBotPosition,
  ]);

  // =====================================================
  //                OBSTACLES & SCORE
  // =====================================================

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    obstacleTimer.current = setInterval(() => {
      setObstacles((p) => [
        ...p,
        {
          x: 10 + Math.random() * (TRACK_WIDTH - 70),
          y: -80,
          width: 35 + Math.random() * 25,
          height: 35 + Math.random() * 25,
        },
      ]);

      setBotObstacles((p) => [
        ...p,
        {
          x: 10 + Math.random() * (TRACK_WIDTH - 70),
          y: -80,
          width: 35 + Math.random() * 25,
          height: 35 + Math.random() * 25,
        },
      ]);
    }, 700);

    return () => clearInterval(obstacleTimer.current);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    scoreTimer.current = setInterval(() => {
      if (!playerCrashed) setPlayerScore((p) => p + 10);
      if (!botCrashed) setBotScore((p) => p + 10);
    }, 100);

    return () => clearInterval(scoreTimer.current);
  }, [gameStarted, gameOver, playerCrashed, botCrashed]);

  // =====================================================
  //                     START GAME
  // =====================================================

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    setPlayerX(180);
    setPlayerY(400);
    botXRef.current = 180;
    botYRef.current = 400;
    setBotX(180);
    setBotY(400);
    setObstacles([]);
    setBotObstacles([]);
    setPlayerCrashed(false);
    setBotCrashed(false);
    setPlayerScore(0);
    setBotScore(0);
  };

  // =====================================================
  //                     UI RENDER
  // =====================================================

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <h1 className="text-5xl font-bold text-yellow-400 mb-4 font-mono"
        style={{ textShadow: "3px 3px 0px #ff0000" }}>
        RETRO RACER
      </h1>

      {!gameStarted && !gameOver && (
        <button
          onClick={startGame}
          className="bg-green-500 text-black font-bold py-4 px-12 text-2xl font-mono border-4 border-green-300"
        >
          INSERT COIN
        </button>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="p-8 border-8 border-yellow-400 bg-black text-center shadow-[0_0_30px_gold]">
            <h2 className="text-6xl font-mono text-yellow-400 mb-4">
              {winner === "player" ? "YOU WIN!" : "GAME OVER"}
            </h2>
            <button
              onClick={startGame}
              className="mt-6 bg-green-500 text-black font-bold py-3 px-12 border-4 border-green-300 font-mono"
            >
              CONTINUE?
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-8 mt-4">
        <div className="text-center">
          <canvas
            ref={canvasPlayerRef}
            width={TRACK_WIDTH}
            height={TRACK_HEIGHT}
            style={{ border: "4px solid #facc15", imageRendering: "pixelated" }}
          />
        </div>

        <div className="text-center">
          <canvas
            ref={canvasBotRef}
            width={TRACK_WIDTH}
            height={TRACK_HEIGHT}
            style={{ border: "4px solid #facc15", imageRendering: "pixelated" }}
          />
        </div>
      </div>
    </div>
  );
};

export default RacingGame;
