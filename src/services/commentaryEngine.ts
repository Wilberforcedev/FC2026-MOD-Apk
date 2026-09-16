import { CommentaryMessage } from '../types/soccer';

export class CommentaryEngine {
  private messages: CommentaryMessage[] = [];
  private speechEnabled: boolean = true;
  private onNewMessageCallback?: (msg: CommentaryMessage) => void;

  constructor(onNewMessage?: (msg: CommentaryMessage) => void) {
    this.onNewMessageCallback = onNewMessage;
  }

  public setSpeechEnabled(enabled: boolean) {
    this.speechEnabled = enabled;
  }

  public setMuted(muted: boolean) {
    this.speechEnabled = !muted;
  }

  public setEnabled(enabled: boolean) {
    this.setSpeechEnabled(enabled);
  }

  public addComment(
    text: string, 
    type: CommentaryMessage['type'] = 'general'
  ): CommentaryMessage {
    const msg: CommentaryMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now(),
    };

    this.messages.unshift(msg);
    if (this.messages.length > 20) {
      this.messages.pop();
    }

    if (this.onNewMessageCallback) {
      this.onNewMessageCallback(msg);
    }

    if (this.speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Keep voice speech subtle, brief, and sports-broadcast styled
      if (type === 'goal' || type === 'save' || type === 'whistle') {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.15;
          utterance.pitch = type === 'goal' ? 1.25 : 1.0;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Graceful fallback
        }
      }
    }

    return msg;
  }

  public getRecent(): CommentaryMessage[] {
    return this.messages.slice(0, 5);
  }

  public goalCommentary(scorer: string, team: string, speedKmh?: number): string {
    const speedStr = speedKmh ? ` Clocked at ${Math.round(speedKmh)} km/h!` : '';
    const lines = [
      `GOAL! ${scorer} with an absolute rocket for ${team}!${speedStr}`,
      `WHAT A HIT! ${scorer} wheels away in celebration! Unstoppable!`,
      `SENSATIONAL FINISH! ${scorer} delivers magic for ${team}!`,
      `GOOOAAAL! Masterclass from ${scorer}, picking out the top corner!`,
      `IT'S IN! ${scorer} fires ${team} ahead with devastating precision!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'goal');
    return picked;
  }

  public shotCommentary(shooter: string): string {
    const lines = [
      `${shooter} pulls the trigger from distance!`,
      `Audacious strike by ${shooter}!`,
      `${shooter} has a go towards goal!`,
      `Driven hard and low by ${shooter}!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'shot');
    return picked;
  }

  public saveCommentary(keeper: string): string {
    const lines = [
      `OUTSTANDING REFLEXES! ${keeper} with a fingertip denial!`,
      `WHAT A SAVE! ${keeper} stands tall to keep it out!`,
      `DENIED! Pure athleticism from ${keeper}!`,
      `Brilliant goalkeeping by ${keeper} to parry it away!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'save');
    return picked;
  }

  public woodworkCommentary(): string {
    const lines = [
      `OFF THE POST! The keeper was completely beaten!`,
      `CLATTERED AGAINST THE WOODWORK! So close!`,
      `OFF THE CROSSBAR! Inches away from a wondergoal!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'shot');
    return picked;
  }

  public tackleCommentary(player: string): string {
    const lines = [
      `Crunching challenge from ${player} to regain possession!`,
      `Superb timing on the slide tackle by ${player}!`,
      `Textbook defending by ${player}!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'tackle');
    return picked;
  }

  public foulCommentary(refereeWhistle: boolean = true): string {
    const lines = [
      `The referee blows his whistle! That's a foul.`,
      `Mistimed tackle! Free kick awarded.`,
      `Careless challenge in a dangerous area!`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.addComment(picked, 'foul');
    return picked;
  }
}

export const commentary = new CommentaryEngine();
