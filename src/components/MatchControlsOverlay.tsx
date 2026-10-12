import React, { useEffect, useRef, useState } from 'react';
import { UserInputState } from '../game/engine';

interface MatchControlsOverlayProps {
  onInputChange: (input: UserInputState) => void;
}

const JOYSTICK_RADIUS = 60;
const LEFT_HANDED_KEY = 'fc26-left-handed';

const findTouch = (list: React.TouchList, id: number): React.Touch | undefined => {
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    if (t && t.identifier === id) return t;
  }
  return undefined;
};

export const MatchControlsOverlay: React.FC<MatchControlsOverlayProps> = ({ onInputChange }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [leftHanded, setLeftHanded] = useState(false);
  const [portrait, setPortrait] = useState(false);

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

  // Floating dynamic joystick state (anchors where the thumb lands)
  const [joystickOrigin, setJoystickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnobPos, setJoystickKnobPos] = useState({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (touch) setIsTouchDevice(true);
    setLeftHanded(localStorage.getItem(LEFT_HANDED_KEY) === '1');

    const readOrientation = () => setPortrait(window.innerHeight > window.innerWidth);
    readOrientation();
    window.addEventListener('resize', readOrientation);
    window.addEventListener('orientationchange', readOrientation);
    return () => {
      window.removeEventListener('resize', readOrientation);
      window.removeEventListener('orientationchange', readOrientation);
    };
  }, []);

  useEffect(() => {
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

      if (joystickTouchId.current === null) {
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

  // Floating joystick handlers: the stick anchors wherever the thumb lands
  const handleZoneTouchStart = (e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setJoystickOrigin({ x: touch.clientX, y: touch.clientY });
    setJoystickKnobPos({ x: 0, y: 0 });
  };

  const handleZoneTouchMove = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return;
    const touch = findTouch(e.changedTouches, joystickTouchId.current);
    if (!touch || !joystickOrigin) return;

    const dx = touch.clientX - joystickOrigin.x;
    const dy = touch.clientY - joystickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;

    setJoystickKnobPos({ x: knobX, y: knobY });
    inputRef.current.moveX = knobX / JOYSTICK_RADIUS;
    inputRef.current.moveY = knobY / JOYSTICK_RADIUS;
    onInputChange({ ...inputRef.current });
  };

  const handleZoneTouchEnd = (e: React.TouchEvent) => {
    const touch = findTouch(e.changedTouches, joystickTouchId.current);
    if (!touch) return;
    joystickTouchId.current = null;
    setJoystickOrigin(null);
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

  const toggleLeftHanded = () => {
    setLeftHanded(prev => {
      const next = !prev;
      localStorage.setItem(LEFT_HANDED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const joystickSide = leftHanded ? 'right' : 'left';
  const clusterSide = leftHanded ? 'left' : 'right';
  const safeBottom = 'calc(1.25rem + env(safe-area-inset-bottom))';
  const clusterStyle: React.CSSProperties = {
    bottom: safeBottom,
    [clusterSide]: `calc(1.25rem + env(safe-area-inset-${clusterSide}))`,
  } as React.CSSProperties;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* Floating joystick thumb zone (DLS-style: stick anchors where the thumb lands) */}
      {isTouchDevice && (
        <div
          className="absolute bottom-0 top-[32%] w-[46%] pointer-events-auto touch-none"
          style={{ [joystickSide]: 0 } as React.CSSProperties}
          onTouchStart={handleZoneTouchStart}
          onTouchMove={handleZoneTouchMove}
          onTouchEnd={handleZoneTouchEnd}
          onTouchCancel={handleZoneTouchEnd}
        />
      )}

      {/* Dynamic joystick visual */}
      {joystickOrigin && (
        <div
          className="fixed pointer-events-none z-20"
          style={{ left: joystickOrigin.x - 64, top: joystickOrigin.y - 64 }}
        >
          <div className="w-32 h-32 rounded-full bg-slate-950/50 border-2 border-white/20 backdrop-blur-md relative flex items-center justify-center shadow-2xl">
            <div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl border-2 border-white/80 absolute"
              style={{ transform: `translate(${joystickKnobPos.x}px, ${joystickKnobPos.y}px)` }}
            />
          </div>
        </div>
      )}

      {/* Left/right handed layout toggle */}
      {isTouchDevice && (
        <button
          id="touch-btn-hand-toggle"
          onClick={toggleLeftHanded}
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto touch-none px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/25 text-white/85 font-['Chakra_Petch'] font-bold text-[10px] uppercase shadow-lg active:scale-95 transition"
          style={{
            bottom: 'calc(0.6rem + env(safe-area-inset-bottom))',
          } as React.CSSProperties}
        >
          ⇄ {leftHanded ? 'Left' : 'Right'} hand
        </button>
      )}

      {/* Portrait rotate hint */}
      {isTouchDevice && portrait && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-950/85 border border-amber-400/40 text-amber-200 font-['Chakra_Petch'] font-bold text-[11px] uppercase tracking-wider shadow-xl whitespace-nowrap">
          ⟳ Rotate for the broadcast view
        </div>
      )}

      {/* On-Screen Action Buttons (diamond cluster, safe-area aware) */}
      <div className={`absolute pointer-events-auto ${isTouchDevice ? 'block' : 'hidden md:block opacity-85 hover:opacity-100 transition'}`} style={clusterStyle}>
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
