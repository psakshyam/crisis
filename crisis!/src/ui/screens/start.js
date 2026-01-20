import { Container, Sprite } from "pixi.js";
import { ModernButton } from "../components/button.js";
import { COLORS } from "../theme.js";

export class StartScreen extends Container {
  constructor(appWidth, appHeight, onStart) {
    super();
    this.w = appWidth;
    this.h = appHeight;

    const bg = Sprite.from('startPage');
    
    bg.anchor.set(0.5);
    bg.position.set(this.w / 2, this.h / 2);

    const scaleX = this.w / bg.texture.width;
    const scaleY = this.h / bg.texture.height;

    const scale = Math.max(scaleX, scaleY);
    
    bg.scale.set(scale);
    this.addChild(bg);

    const btn = new ModernButton({
      text: "Play",
      width: 260,
      height: 60,
      color: COLORS.primary, 
      onClick: onStart
    });

    btn.x = (this.w / 2) - 130; 
    btn.y = this.h * 0.8;    
    
    this.addChild(btn);
  }
}