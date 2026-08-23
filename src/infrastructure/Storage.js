export class Storage {
  static KEY = 'architecture_world_progress';
  static INTRO_KEY = 'architecture_world_intro_seen';

  static load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : { discovered: [], completed: 0, level: 1, xp: 0, xpMax: 1000 };
    } catch {
      return { discovered: [], completed: 0, level: 1, xp: 0, xpMax: 1000 };
    }
  }

  static save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  static hasSeenIntro() {
    return localStorage.getItem(this.INTRO_KEY) === 'true';
  }

  static markIntroSeen() {
    localStorage.setItem(this.INTRO_KEY, 'true');
  }

  static resetAll() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.INTRO_KEY);
  }
}