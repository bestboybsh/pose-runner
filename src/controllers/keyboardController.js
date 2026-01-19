// Keyboard controller - fallback input method
export class KeyboardController {
  constructor() {
    this.keys = { space: false, down: false };
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") this.keys.space = true;
      if (e.code === "ArrowDown") this.keys.down = true;
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") this.keys.space = false;
      if (e.code === "ArrowDown") this.keys.down = false;
    });
  }

  getActions() {
    return {
      jump: this.keys.space,
      duck: this.keys.down
    };
  }
}
