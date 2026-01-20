import { Container, Graphics } from "pixi.js";
import { COLORS } from "../theme.js";

export class GlassPanel extends Container {
  constructor(width, height) {
    super();
    this.bg = new Graphics();
    this.addChild(this.bg);
    this.resize(width, height);
  }

  resize(w, h) {
    this.bg.clear();
    this.bg
      .rect(0, 0, w, h)
      .fill({ color: COLORS.panel || 0xffffff, alpha: 0.5 });

    this.bg.stroke({ width: 3, color: COLORS.primary });
  }
}
