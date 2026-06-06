import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { submitScore } from './lib/api';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import keyIcon from './assets/key.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

export default function App() {
  const { user, loading, login, signup, logout, setHighScore } = useAuth();
  // Whether to show the login/signup screen. The game is the default landing
  // page; players only open this when they want their score recorded.
  const [showAuth, setShowAuth] = useState(false);

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  // Guards against submitting the same finished game's score more than once.
  const scoreSubmitted = useRef(false);

  const initializeGame = () => {
    // Randomly assign treasure to one box
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    scoreSubmitted.current = false;
  };

  // Initialize game automatically when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  // When a game ends, submit the final score for logged-in users (highest is kept).
  useEffect(() => {
    if (!gameEnded || !user || scoreSubmitted.current) return;
    scoreSubmitted.current = true;
    submitScore(score)
      .then((res) => setHighScore(res.highScore))
      .catch((err) => console.error('Failed to submit score:', err));
  }, [gameEnded, user, score, setHighScore]);

  // Plays the chest-opening sound effect. Input: none. Output: none.
  const playChestOpenSound = () => {
    const audio = new Audio(chestOpenSound);
    audio.play();
  };

  // Plays the evil-laugh sound effect for opening a wrong (skeleton) box. Input: none. Output: none.
  const playEvilLaughSound = () => {
    const audio = new Audio(evilLaughSound);
    audio.play();
  };

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          // Treasure box plays the normal open sound; wrong (skeleton) box plays the evil laugh.
          if (box.hasTreasure) {
            playChestOpenSound();
          } else {
            playEvilLaughSound();
          }
          const newScore = box.hasTreasure ? score + 100 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });
      
      // Check if treasure is found or all boxes are opened
      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }
      
      return updatedBoxes;
    });
  };

  const resetGame = () => {
    initializeGame();
  };

  // Logs the user out and returns to the game (still playable as a guest).
  const handleLogout = () => {
    logout();
    setShowAuth(false);
  };

  // While restoring a session from a stored token, render nothing to avoid a flash.
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100" />;
  }

  // Only show the auth screen when the player explicitly asks to log in.
  if (showAuth && !user) {
    return (
      <AuthScreen
        onLogin={login}
        onSignup={signup}
        onGuest={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      {/* Account bar: greet the user with their high score, or note guest mode */}
      <div
        className="text-amber-900"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.95rem',
        }}
      >
        {user ? (
          <>
            <span>
              👤 {user.username}　🏆 最高分:{' '}
              <span style={{ color: '#16a34a', fontWeight: 700 }}>${user.highScore}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #d97706',
                background: 'transparent',
                color: '#92400e',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              登出
            </button>
          </>
        ) : (
          <>
            <span>👻 訪客模式・分數不會儲存</span>
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #d97706',
                background: 'transparent',
                color: '#92400e',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              登入
            </button>
          </>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$100 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
      </div>

      {/* Show WIN / TIE / LOSE in the circled spot once the game ends, based on final score */}
      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-4xl text-center mb-8"
          style={{
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: score > 0 ? '#16a34a' : score < 0 ? '#dc2626' : '#d97706',
          }}
        >
          {score > 0 ? '🎉 WIN 🎉' : score < 0 ? '💀 LOSE 💀' : '🤝 TIE 🤝'}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                className="flex flex-col items-center"
                style={{
                  // Use the key image as the mouse cursor over a closed box
                  cursor: box.isOpen ? 'default' : `url(${keyIcon}) 16 16, pointer`,
                }}
                whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
                whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
                onClick={() => openBox(box.id)}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ 
                    rotateY: box.isOpen ? 180 : 0,
                    scale: box.isOpen ? 1.1 : 1
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <img
                    src={box.isOpen 
                      ? (box.hasTreasure ? treasureChest : skeletonChest)
                      : closedChest
                    }
                    alt={box.isOpen 
                      ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                      : "Treasure Chest"
                    }
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />
                  
                  {box.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      {box.hasTreasure ? (
                        <div className="text-2xl animate-bounce">✨💰✨</div>
                      ) : (
                        <div className="text-2xl animate-pulse">💀👻💀</div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
                
                <div className="mt-4 text-center">
                  {box.isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className={`text-lg p-2 rounded-lg ${
                        box.hasTreasure 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {box.hasTreasure ? '+$100' : '-$50'}
                    </motion.div>
                  ) : (
                    <div className="text-amber-700 p-2">
                      Click to open!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {gameEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
                <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
                <p className="text-lg text-amber-800">
                  Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${score}
                  </span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {boxes.some(box => box.isOpen && box.hasTreasure) 
                    ? 'Treasure found! Well done, treasure hunter! 🎉' 
                    : 'No treasure found this time! Better luck next time! 💀'}
                </p>
              </div>
              
              <Button 
                onClick={resetGame}
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Play Again
              </Button>
            </motion.div>
          )}
    </div>
  );
}
