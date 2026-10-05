import React, { useEffect, useRef, useState } from 'react';
import { UserInputState } from '../game/engine';

interface MatchControlsOverlayProps {
  onInputChange: (input: UserInputState) => void;
}

export const MatchControlsOverlay: React.FC<MatchControlsOverlayProps> = ({ onInputChange }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Active inputs state
  const inputRef = useRef<UserInputState>({
    moveX: 0,
    moveY: 0,
    sprint: false,
    pass: false,
    passPressed: false,
    throughBall: false,
    throughBallPressed: false,
    shoot: false,
    shootCharging: false,
    shootPower: 0,
    lob: false,
    lobPressed: false,
    tackle: false,
    tacklePressed: false,
    skill: false,
    skillPressed: false,
    switchPlayer: false,
    switchPlayerPressed: false,
    chipShot: false,
    chipShotPressed: false,
  });

  const shootTouchStartY = useRef<number | null>(null);

  // Keyboard keys active tracking
  const keysActive = useRef<Record<string, boolean>>({});

  // Virtual Joystick state
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);
  const [joystickKnobPos, setJoystickKnobPos] = useState({ x: 0, y: 0 });
  const isDraggingJoystick = useRef(false);

  useEffect(() => {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    const updateKeyboardMovement = () => {
      let mx = 0;
      let my = 0;
      if (keysActive.current['KeyW'] || keysActive.current['ArrowUp']) my -= 1;
      if (keysActive.current['KeyS'] || keysActive.current['ArrowDown']) my += 1;
      if (keysActive.current['KeyA'] || keysActive.current['ArrowLeft']) mx -= 1;
      if (keysActive.current['KeyD'] || keysActive.current['ArrowRight']) mx += 1;

      // Normalize diagonal
      const mag = Math.hypot(mx, my);
      if (mag > 0) {
        mx /= mag;
        my /= mag;
      }

      if (!isDraggingJoystick.current) {
        inputRef.current.moveX = mx;
        inputRef.current.moveY = my;
      }
      inputRef.current.sprint = !!(keysActive.current['ShiftLeft'] || keysActive.current['ShiftRight']);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing repetitively on hold
      if (keysActive.current[e.code]) return;
      keysActive.current[e.code] = true;
      updateKeyboardMovement();

      if (e.code === 'KeyK') {
        inputRef.current.passPressed = true;
      } else if (e.code === 'KeyL') {
        inputRef.current.throughBallPressed = true;
      } else if (e.code === 'KeyJ') {
        inputRef.current.shootCharging = true;
      } else if (e.code === 'KeyU') {
        inputRef.current.chipShotPressed = true;
      } else if (e.code === 'KeyC') {
        inputRef.current.skillPressed = true;
      } else if (e.code === 'KeyI') {
        inputRef.current.lobPressed = true;
      } else if (e.code === 'KeyE' || e.code === 'Space') {
        inputRef.current.tacklePressed = true;
        inputRef.current.skillPressed = true;
      } else if (e.code === 'KeyQ' || e.code === 'Tab') {
        inputRef.current.switchPlayerPressed = true;
        e.preventDefault();
      }

      onInputChange({ ...inputRef.current });
      // Reset one-frame pulses
      inputRef.current.passPressed = false;
      inputRef.current.throughBallPressed = false;
      inputRef.current.lobPressed = false;
      inputRef.current.tacklePressed = false;
      inputRef.current.skillPressed = false;
      inputRef.current.switchPlayerPressed = false;
      inputRef.current.chipShotPressed = false;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysActive.current[e.code] = false;
      updateKeyboardMovement();

      if (e.code === 'KeyJ') {
        inputRef.current.shootCharging = false;
      }

      onInputChange({ ...inputRef.current });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gamepad API polling loop
    let gamepadRaf: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp) {
        // Left stick
        const stickX = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
        const stickY = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
        inputRef.current.moveX = stickX;
        inputRef.current.moveY = stickY;

        // Triggers/Buttons
        inputRef.current.sprint = gp.buttons[7]?.pressed || gp.buttons[5]?.pressed; // RT / R1
        if (gp.buttons[0]?.pressed) inputRef.current.passPressed = true; // A button: Pass
        if (gp.buttons[3]?.pressed) inputRef.current.throughBallPressed = true; // Y button: Through
        if (gp.buttons[2]?.pressed) inputRef.current.shootCharging = true; // X button: Shoot
        else inputRef.current.shootCharging = false;
        if (gp.buttons[1]?.pressed) inputRef.current.tacklePressed = true; // B button: Tackle
        if (gp.buttons[4]?.pressed) inputRef.current.switchPlayerPressed = true; // LB: Switch

        onInputChange({ ...inputRef.current });
        inputRef.current.passPressed = false;
        inputRef.current.throughBallPressed = false;
        inputRef.current.tacklePressed = false;
        inputRef.current.switchPlayerPressed = false;
      }

      gamepadRaf = requestAnimationFrame(pollGamepad);
    };

    gamepadRaf = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gamepadRaf);
    };
  }, [onInputChange]);

  // Touch Joystick handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingJoystick.current = true;
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingJoystick.current || !joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickKnobPos({ x: knobX, y: knobY });

    inputRef.current.moveX = knobX / maxRadius;
    inputRef.current.moveY = knobY / maxRadius;
    onInputChange({ ...inputRef.current });
  };

  const handleTouchEnd = () => {
    isDraggingJoystick.current = false;
    setJoystickKnobPos({ x: 0, y: 0 });
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    onInputChange({ ...inputRef.current });
  };

  // Virtual Buttons
  const triggerAction = (action: 'pass' | 'through' | 'lob' | 'tackle' | 'switch' | 'chip' | 'skill') => {
    if (action === 'pass') inputRef.current.passPressed = true;
    if (action === 'through') inputRef.current.throughBallPressed = true;
    if (action === 'lob') inputRef.current.lobPressed = true;
    if (action === 'chip') inputRef.current.chipShotPressed = true;
    if (action === 'skill') inputRef.current.skillPressed = true;
    if (action === 'tackle') {
      inputRef.current.tacklePressed = true;
      inputRef.current.skillPressed = true;
    }
    if (action === 'switch') inputRef.current.switchPlayerPressed = true;

    onInputChange({ ...inputRef.current });
    setTimeout(() => {
      inputRef.current.passPressed = false;
      inputRef.current.throughBallPressed = false;
      inputRef.current.lobPressed = false;
      inputRef.current.chipShotPressed = false;
      inputRef.current.skillPressed = false;
      inputRef.current.tacklePressed = false;
      inputRef.current.switchPlayerPressed = false;
      onInputChange({ ...inputRef.current });
    }, 50);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* On-Screen Touch Joystick (Visible on mobile/tablet or when touched) */}
      <div className={`absolute bottom-6 left-6 pointer-events-auto ${isTouchDevice ? 'block' : 'hidden md:block opacity-60 hover:opacity-100 transition'}`}>
        <div
          ref={joystickContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="touch-none w-32 h-32 rounded-full bg-slate-950/60 border-2 border-white/20 backdrop-blur-md relative flex items-center justify-center shadow-2xl"
        >
          {/* Outer compass marks */}
          <div className="absolute top-1 text-[10px] text-white/30 font-bold">▲</div>
          <div className="absolute bottom-1 text-[10px] text-white/30 font-bold">▼</div>
          <div className="absolute left-1 text-[10px] text-white/30 font-bold">◀</div>
          <div className="absolute right-1 text-[10px] text-white/30 font-bold">▶</div>

          {/* Draggable Knob */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl border-2 border-white/80 absolute transition-transform duration-75"
            style={{
              transform: `translate(${joystickKnobPos.x}px, ${joystickKnobPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* On-Screen Action Buttons (Right side diamond cluster) */}
      <div className={`absolute bottom-6 right-6 pointer-events-auto ${isTouchDevice ? 'block' : 'hidden md:block opacity-85 hover:opacity-100 transition'}`}>
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* THROUGH BALL (Top / Y) */}
          <button
            id="touch-btn-through"
            onClick={() => triggerAction('through')}
            className="absolute top-0 w-14 h-14 rounded-full bg-cyan-600/90 hover:bg-cyan-500 active:scale-90 border-2 border-cyan-300 text-white font-['Chakra_Petch'] font-black text-xs shadow-xl flex flex-col items-center justify-center transition"
          >
            <span>THROUGH</span>
            <span className="text-[9px] text-cyan-200 font-mono">L</span>
          </button>

          {/* SHOOT (Right / B) - Touch & Hold to charge, or swipe-up for CHIP */}
          <button
            id="touch-btn-shoot"
            onTouchStart={(e) => {
              shootTouchStartY.current = e.touches[0].clientY;
              inputRef.current.shootCharging = true;
              onInputChange({ ...inputRef.current });
            }}
            onTouchMove={(e) => {
              if (shootTouchStartY.current !== null) {
                const dy = shootTouchStartY.current - e.touches[0].clientY;
                if (dy > 28) {
                  inputRef.current.shootCharging = false;
                  shootTouchStartY.current = null;
                  triggerAction('chip');
                }
              }
            }}
            onTouchEnd={() => {
              inputRef.current.shootCharging = false;
              shootTouchStartY.current = null;
              onInputChange({ ...inputRef.current });
            }}
            onTouchCancel={() => {
              inputRef.current.shootCharging = false;
              shootTouchStartY.current = null;
              onInputChange({ ...inputRef.current });
            }}
            onMouseDown={() => {
              inputRef.current.shootCharging = true;
              onInputChange({ ...inputRef.current });
            }}
            onMouseUp={() => {
              inputRef.current.shootCharging = false;
              onInputChange({ ...inputRef.current });
            }}
            className="touch-none absolute right-0 w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-500 active:scale-90 border-2 border-rose-300 text-white font-['Chakra_Petch'] font-black text-xs shadow-xl flex flex-col items-center justify-center transition group"
          >
            <span>SHOOT</span>
            <span className="text-[9px] text-rose-200 font-mono">Hold / ↑Chip</span>
          </button>

          {/* PASS (Bottom / A) */}
          <button
            id="touch-btn-pass"
            onClick={() => triggerAction('pass')}
            className="absolute bottom-0 w-14 h-14 rounded-full bg-emerald-600/90 hover:bg-emerald-500 active:scale-90 border-2 border-emerald-300 text-white font-['Chakra_Petch'] font-black text-xs shadow-xl flex flex-col items-center justify-center transition"
          >
            <span>PASS</span>
            <span className="text-[9px] text-emerald-200 font-mono">K</span>
          </button>

          {/* TACKLE / SLIDE (Left / X) */}
          <button
            id="touch-btn-tackle"
            onClick={() => triggerAction('tackle')}
            className="absolute left-0 w-14 h-14 rounded-full bg-amber-600/90 hover:bg-amber-500 active:scale-90 border-2 border-amber-300 text-white font-['Chakra_Petch'] font-black text-xs shadow-xl flex flex-col items-center justify-center transition"
          >
            <span>TACKLE</span>
            <span className="text-[9px] text-amber-200 font-mono">E</span>
          </button>

          {/* SWITCH PLAYER (Center) */}
          <button
            id="touch-btn-switch"
            onClick={() => triggerAction('switch')}
            className="w-11 h-11 rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-90 border border-white/30 text-white/90 font-['Chakra_Petch'] font-bold text-[10px] shadow-lg flex items-center justify-center transition"
          >
            SWITCH
          </button>

          {/* SPRINT / SKILL MOVES Trigger Pill (Above cluster) */}
          <button
            id="touch-btn-sprint"
            onTouchStart={() => {
              inputRef.current.sprint = true;
              inputRef.current.skillPressed = true;
              onInputChange({ ...inputRef.current });
            }}
            onTouchEnd={() => {
              inputRef.current.sprint = false;
              inputRef.current.skillPressed = false;
              onInputChange({ ...inputRef.current });
            }}
            onTouchCancel={() => {
              inputRef.current.sprint = false;
              inputRef.current.skillPressed = false;
              onInputChange({ ...inputRef.current });
            }}
            onMouseDown={() => {
              inputRef.current.sprint = true;
              inputRef.current.skillPressed = true;
              onInputChange({ ...inputRef.current });
            }}
            onMouseUp={() => {
              inputRef.current.sprint = false;
              inputRef.current.skillPressed = false;
              onInputChange({ ...inputRef.current });
            }}
            className="touch-none absolute -top-7 right-4 px-3 py-1 bg-violet-600/90 hover:bg-violet-500 active:scale-95 border border-violet-300 text-white font-['Chakra_Petch'] font-bold text-[10px] uppercase rounded-full shadow-lg flex items-center gap-1 transition"
          >
            <span>⚡ SPRINT / SKILL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
