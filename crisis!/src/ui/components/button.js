import { Container, Graphics, Text } from "pixi.js";
import { COLORS } from "../theme.js";

export class ModernButton extends Container {
  constructor({ text, width, height, onClick, color = COLORS.primary }) {
    super();
    
    this.bg = new Graphics();
    this.addChild(this.bg);

    const btnText = new Text({ 
      text: text, 
      style: { 
        fontFamily: 'Rajdhani, Arial', 
        fontSize: 18, 
        fill: COLORS.panel, 
        fontWeight: 'bold' 
      }
    });
    btnText.anchor.set(0.5);
    btnText.x = width / 2;
    btnText.y = height / 2;
    this.addChild(btnText);

    // Interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => this.draw(width, height, color, true));
    this.on('pointerout', () => this.draw(width, height, color, false));
    this.on('pointerdown', () => {
        this.scale.set(0.98);
        onClick();
    });
    this.on('pointerup', () => this.scale.set(1));

    this.draw(width, height, color, false);
  }

  draw(w, h, color, isHovered) {
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, 10);
    
    if (isHovered) {
      this.bg.fill({ color: color, alpha: 0.3 });
      this.bg.stroke({ width: 2, color: color });
    } else {
      this.bg.fill({ color: 0xE37B40, alpha: 0.4 });
      this.bg.stroke({ width: 1, color: 0x475569 });
    }
  }
}