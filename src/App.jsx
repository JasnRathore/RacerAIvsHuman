import React, { useState, useEffect, useRef } from 'react';

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

  // Check collision
  const checkCollision = (carX, carY, obs) => {
    return obs.some(obstacle => {
      const carLeft = carX;
      const carRight = carX + CAR_WIDTH;
      const carTop = carY;
      const carBottom = carY + CAR_HEIGHT;
      
      const obsLeft = obstacle.x;
      const obsRight = obstacle.x + obstacle.width;
      const obsTop = obstacle.y;
      const obsBottom = obstacle.y + obstacle.height;
      
      return !(carRight < obsLeft || 
               carLeft > obsRight || 
               carBottom < obsTop || 
               carTop > obsBottom);
    });
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      // Player movement - all 4 directions with limits
      if (keysPressed.current['ArrowLeft'] && playerX > 10 && !playerCrashed) {
        setPlayerX(prev => Math.max(10, prev - MOVE_SPEED));
      }
      if (keysPressed.current['ArrowRight'] && playerX < TRACK_WIDTH - CAR_WIDTH - 10 && !playerCrashed) {
        setPlayerX(prev => Math.min(TRACK_WIDTH - CAR_WIDTH - 10, prev + MOVE_SPEED));
      }
      if (keysPressed.current['ArrowUp'] && playerY > 50 && !playerCrashed) {
        setPlayerY(prev => Math.max(50, prev - MOVE_SPEED));
      }
      if (keysPressed.current['ArrowDown'] && playerY < TRACK_HEIGHT - CAR_HEIGHT - 10 && !playerCrashed) {
        setPlayerY(prev => Math.min(TRACK_HEIGHT - CAR_HEIGHT - 10, prev + MOVE_SPEED));
      }

      // Bot AI - Advanced obstacle avoidance with predictive movement
      if (!botCrashed) {
        setBotX(prev => {
          // Look ahead further for obstacles
          const lookAheadObstacles = botObstacles.filter(obs => 
            obs.y < botY + 250 && obs.y > botY - 50
          );
          
          if (lookAheadObstacles.length > 0) {
            // Sort by distance to bot
            const sortedObs = lookAheadObstacles.sort((a, b) => a.y - b.y);
            const closestObs = sortedObs[0];
            
            // Calculate danger zones for each obstacle
            const botCenter = prev + CAR_WIDTH / 2;
            const obsLeft = closestObs.x;
            const obsRight = closestObs.x + closestObs.width;
            //const obsCenter = closestObs.x + closestObs.width / 2;
            
            // More aggressive avoidance with safety margin
            const safetyMargin = 15;
            const threatDistance = closestObs.y - botY;
            
            // Calculate if bot is in danger zone
            if (threatDistance < 180 && threatDistance > -30) {
              const urgency = Math.max(1, (180 - threatDistance) / 30);
              
              // Bot is in path of obstacle
              if (botCenter > obsLeft - safetyMargin && botCenter < obsRight + safetyMargin) {
                // Decide which direction is safer
                const leftSpace = obsLeft - 10;
                const rightSpace = (TRACK_WIDTH - 10) - obsRight;
                
                if (leftSpace > rightSpace && prev > 10) {
                  // Move left more aggressively
                  return Math.max(10, prev - (6 * urgency));
                } else if (prev < TRACK_WIDTH - CAR_WIDTH - 10) {
                  // Move right more aggressively
                  return Math.min(TRACK_WIDTH - CAR_WIDTH - 10, prev + (6 * urgency));
                }
              }
            }
            
            // Check for multiple obstacles and find safe lane
            if (sortedObs.length > 1 && threatDistance < 200) {
              const lanes = [
                { x: 60, clear: true },
                { x: TRACK_WIDTH / 2 - CAR_WIDTH / 2, clear: true },
                { x: TRACK_WIDTH - CAR_WIDTH - 60, clear: true }
              ];
              
              // Mark lanes as blocked
              sortedObs.slice(0, 3).forEach(obs => {
                lanes.forEach(lane => {
                  if (Math.abs((lane.x + CAR_WIDTH / 2) - (obs.x + obs.width / 2)) < 50) {
                    lane.clear = false;
                  }
                });
              });
              
              // Move to nearest clear lane
              const clearLanes = lanes.filter(l => l.clear);
              if (clearLanes.length > 0) {
                const targetLane = clearLanes.reduce((nearest, lane) => 
                  Math.abs(lane.x - prev) < Math.abs(nearest.x - prev) ? lane : nearest
                );
                
                if (prev < targetLane.x - 5) return Math.min(prev + 5, TRACK_WIDTH - CAR_WIDTH - 10);
                if (prev > targetLane.x + 5) return Math.max(prev - 5, 10);
              }
            }
          }
          
          // Return to optimal position when no immediate threats
          const optimalX = TRACK_WIDTH / 2 - CAR_WIDTH / 2;
          if (prev < optimalX - 50) return Math.min(prev + 3, TRACK_WIDTH - CAR_WIDTH - 10);
          if (prev > optimalX + 50) return Math.max(prev - 3, 10);
          return prev;
        });

        setBotY(prev => {
          // Look ahead for vertical obstacles
          const verticalThreats = botObstacles.filter(obs => 
            obs.y < prev + 150 && obs.y > prev - 30
          );
          
          if (verticalThreats.length > 0) {
            const closestObs = verticalThreats.reduce((closest, obs) => 
              obs.y < closest.y ? obs : closest
            );
            
            const botCenter = botX + CAR_WIDTH / 2;
            const obsCenter = closestObs.x + closestObs.width / 2;
            const horizontalDistance = Math.abs(botCenter - obsCenter);
            
            // If obstacle is directly ahead, use vertical movement
            if (horizontalDistance < 35 && closestObs.y < prev + 100) {
              //const threatLevel = 100 - (closestObs.y - prev);
              
              // Move up to avoid if space available
              if (prev > 100 && closestObs.y < prev + 60) {
                return Math.max(50, prev - 5);
              }
              // Move down if up is not safe
              else if (prev < TRACK_HEIGHT - CAR_HEIGHT - 100 && closestObs.y > prev - 20) {
                return Math.min(TRACK_HEIGHT - CAR_HEIGHT - 10, prev + 5);
              }
            }
          }
          
          // Maintain optimal vertical position (middle-lower area)
          const optimalY = 380;
          if (prev < optimalY - 80) return Math.min(prev + 2, TRACK_HEIGHT - CAR_HEIGHT - 10);
          if (prev > optimalY + 80) return Math.max(prev - 2, 50);
          return prev;
        });
      }

      // Update obstacles - move them downward
      setObstacles(prev => {
        const updated = prev.map(obs => ({ ...obs, y: obs.y + OBSTACLE_SPEED }))
           .filter(obs => obs.y < TRACK_HEIGHT + 50);
        
        if (checkCollision(playerX, playerY, updated) && !playerCrashed) {
          setPlayerCrashed(true);
          setTimeout(() => {
            setGameOver(true);
            setWinner('bot');
          }, 1500);
        }
        
        return updated;
      });
      
      setBotObstacles(prev => {
        const updated = prev.map(obs => ({ ...obs, y: obs.y + OBSTACLE_SPEED }))
           .filter(obs => obs.y < TRACK_HEIGHT + 50);
        
        // Check if bot will collide and try to avoid
        const willCollide = checkCollision(botX, botY, updated);
        
        if (willCollide && !botCrashed) {
          // Find the colliding obstacle
          const collidingObs = updated.find(obs => {
            const carLeft = botX;
            const carRight = botX + CAR_WIDTH;
            const carTop = botY;
            const carBottom = botY + CAR_HEIGHT;
            
            const obsLeft = obs.x;
            const obsRight = obs.x + obs.width;
            const obsTop = obs.y;
            const obsBottom = obs.y + obs.height;
            
            return !(carRight < obsLeft || 
                     carLeft > obsRight || 
                     carBottom < obsTop || 
                     carTop > obsBottom);
          });
          
          if (collidingObs) {
            // Emergency evasion - move away from obstacle immediately
            const botCenter = botX + CAR_WIDTH / 2;
            const obsCenter = collidingObs.x + collidingObs.width / 2;
            
            // Try horizontal evasion first
            if (botCenter < obsCenter && botX > 20) {
              setBotX(prev => Math.max(10, prev - 8));
            } else if (botCenter > obsCenter && botX < TRACK_WIDTH - CAR_WIDTH - 20) {
              setBotX(prev => Math.min(TRACK_WIDTH - CAR_WIDTH - 10, prev + 8));
            } else {
              // If horizontal fails, try vertical
              if (botY > 100) {
                setBotY(prev => Math.max(50, prev - 6));
              } else if (botY < TRACK_HEIGHT - CAR_HEIGHT - 100) {
                setBotY(prev => Math.min(TRACK_HEIGHT - CAR_HEIGHT - 10, prev + 6));
              } else {
                // Last resort - collision unavoidable
                setBotCrashed(true);
                setTimeout(() => {
                  setGameOver(true);
                  setWinner('player');
                }, 1500);
              }
            }
          }
        } else if (checkCollision(botX, botY, updated) && !botCrashed) {
          // If still colliding after evasion attempt
          setBotCrashed(true);
          setTimeout(() => {
            setGameOver(true);
            setWinner('player');
          }, 1500);
        }
        
        return updated;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, playerX, playerY, botX, botY, playerCrashed, botCrashed]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    obstacleTimer.current = setInterval(() => {
      const obstacleCount = Math.random() > 0.5 ? 1 : Math.random() > 0.7 ? 2 : 3;
      
      for (let i = 0; i < obstacleCount; i++) {
        setObstacles(prev => [...prev, {
          x: 10 + Math.random() * (TRACK_WIDTH - 70),
          y: -80 - (i * 100),
          width: 35 + Math.random() * 25,
          height: 35 + Math.random() * 25
        }]);
      }

      const botObstacleCount = Math.random() > 0.5 ? 1 : 2;
      for (let i = 0; i < botObstacleCount; i++) {
        setBotObstacles(prev => [...prev, {
          x: 10 + Math.random() * (TRACK_WIDTH - 70),
          y: -80 - (i * 100),
          width: 35 + Math.random() * 25,
          height: 35 + Math.random() * 25
        }]);
      }
    }, 700);

    return () => clearInterval(obstacleTimer.current);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    scoreTimer.current = setInterval(() => {
      if (!playerCrashed) setPlayerScore(prev => prev + 10);
      if (!botCrashed) setBotScore(prev => prev + 10);
    }, 100);

    return () => clearInterval(scoreTimer.current);
  }, [gameStarted, gameOver, playerCrashed, botCrashed]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    setPlayerX(180);
    setPlayerY(400);
    setBotX(180);
    setBotY(400);
    setObstacles([]);
    setBotObstacles([]);
    setPlayerCrashed(false);
    setBotCrashed(false);
    setPlayerScore(0);
    setBotScore(0);
  };

  const renderTrack = (x, y, obs, crashed, score, isPlayer = true) => {
    return (
      <div className="relative bg-black overflow-hidden border-4 border-yellow-400" style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}>
        {/* Road - retro striped pattern */}
        <div className="absolute inset-0 bg-gray-900">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-16 bg-white"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                top: `${(i * 40) % TRACK_HEIGHT}px`,
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Road edges - retro style */}
        <div className="absolute left-0 top-0 w-2 h-full bg-red-500" />
        <div className="absolute right-0 top-0 w-2 h-full bg-red-500" />
        
        {/* Side stripes */}
        <div className="absolute left-2 top-0 w-1 h-full bg-white opacity-50" />
        <div className="absolute right-2 top-0 w-1 h-full bg-white opacity-50" />

        {/* Obstacles - retro blocky style */}
        {obs.map((obstacle, i) => (
          <div
            key={i}
            className="absolute bg-red-600 border-2 border-red-400"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
              boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
            }}
          />
        ))}

        {/* Car - retro pixelated look */}
        <div
          className={`absolute ${isPlayer ? (crashed ? 'bg-gray-600' : 'bg-cyan-400') : (crashed ? 'bg-gray-600' : 'bg-yellow-400')} border-2 ${isPlayer ? 'border-cyan-200' : 'border-yellow-200'} transition-all`}
          style={{
            left: x,
            top: y,
            width: CAR_WIDTH,
            height: CAR_HEIGHT,
            transform: crashed ? 'rotate(180deg)' : 'none',
            boxShadow: crashed ? 'none' : `0 0 15px ${isPlayer ? 'cyan' : 'yellow'}`
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {crashed ? '💥' : isPlayer ? '▲' : '▲'}
          </div>
          {/* Retro car details */}
          <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${isPlayer ? 'bg-cyan-200' : 'bg-yellow-200'}`} />
        </div>

        {/* Score display - retro arcade style */}
        <div className="absolute top-2 left-2 right-2 bg-black bg-opacity-80 p-2 border-2 border-green-400">
          <div className="text-green-400 text-xl font-mono font-bold text-center" style={{ fontFamily: 'monospace' }}>
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* HI-SCORE label */}
        <div className="absolute top-10 left-2 text-green-400 text-xs font-mono font-bold">
          {isPlayer ? 'PLAYER' : 'CPU'}
        </div>

        {/* Game over effect */}
        {crashed && (
          <div className="absolute inset-0 bg-red-600 opacity-30 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="mb-4 text-center">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ 
          fontFamily: 'monospace',
          textShadow: '3px 3px 0px #ff0000, -1px -1px 0px #00ff00'
        }}>
          RETRO RACER
        </h1>
        <div className="text-cyan-400 text-sm font-mono">
          *** ARCADE EDITION ***
        </div>
      </div>
      
      {!gameStarted && !gameOver && (
        <div className="text-center mb-4 bg-black border-4 border-yellow-400 p-6">
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-12 text-2xl border-4 border-green-300 font-mono"
            style={{ boxShadow: '5px 5px 0px rgba(0,255,0,0.5)' }}
          >
            INSERT COIN
          </button>
          <div className="text-yellow-400 mt-6 font-mono text-sm space-y-2">
            <p>↑ ↓ ← → ARROW KEYS</p>
            <p>DODGE OBSTACLES!</p>
            <p className="text-red-400 mt-4">SURVIVE AS LONG AS YOU CAN!</p>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-black border-8 border-yellow-400 p-8 text-center" style={{
            boxShadow: '0 0 30px rgba(255, 255, 0, 0.8)'
          }}>
            <h2 className="text-6xl font-bold mb-4 font-mono text-yellow-400">
              {winner === 'player' ? 'YOU WIN!' : 'GAME OVER'}
            </h2>
            <div className="text-3xl mb-6 text-cyan-400 font-mono">
              {winner === 'player' 
                ? 'CPU CRASHED!' 
                : 'YOU CRASHED!'}
            </div>
            <div className="text-2xl mb-8 text-green-400 font-mono">
              <div>YOUR SCORE: {playerScore.toString().padStart(6, '0')}</div>
              <div>CPU SCORE: {botScore.toString().padStart(6, '0')}</div>
            </div>
            <button
              onClick={startGame}
              className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-10 text-xl border-4 border-green-300 font-mono"
              style={{ boxShadow: '5px 5px 0px rgba(0,255,0,0.5)' }}
            >
              CONTINUE?
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-8">
        <div className="text-center">
          <div className="text-cyan-400 font-mono font-bold mb-2 text-xl">PLAYER 1</div>
          {renderTrack(playerX, playerY, obstacles, playerCrashed, playerScore, true)}
        </div>
        
        <div className="text-center">
          <div className="text-yellow-400 font-mono font-bold mb-2 text-xl">CPU</div>
          {renderTrack(botX, botY, botObstacles, botCrashed, botScore, false)}
        </div>
      </div>

      {gameStarted && !gameOver && (
        <div className="mt-4 text-center">
          <div className="text-green-400 font-mono text-sm animate-pulse">
            *** RACING IN PROGRESS ***
          </div>
        </div>
      )}
    </div>
  );
};

export default RacingGame;
