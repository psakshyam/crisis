import { Container, Graphics, Text, Sprite } from "pixi.js";
import { COLORS, STYLES } from "../theme.js";

export class OptionCard extends Container {
  constructor({ text, iconAlias, width, height, onClick }) {
    super();

    this.bg = new Graphics();
    this.addChild(this.bg);
    this.draw(width, height, false);


    const icon = Sprite.from(iconAlias);
    icon.anchor.set(0.5);
    icon.x = width * 0.15; 
    icon.y = height / 2;
    

    const maxIconSize = height * 0.6;
    const scale = maxIconSize / icon.height;
    icon.scale.set(scale);
    
    this.addChild(icon);


    const availableWidth = width * 0.65; 
    const availableHeight = height - 20; 

    const label = new Text({ 
      text: text, 
      style: {
        ...STYLES.body,
        fontSize: 18,      
        fill: 0xB35F35,     
        fontWeight: "600",
        wordWrap: true,
        wordWrapWidth: availableWidth,
        align: 'left'
      }
    });
    label.anchor.set(0, 0.5); 
    label.x = width * 0.3;   
    label.y = height / 2;

    while (label.height > availableHeight && label.style.fontSize > 10) {
        label.style.fontSize--; 

    }


    this.addChild(label);


    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => this.draw(width, height, true));
    this.on('pointerout', () => this.draw(width, height, false));
    this.on('pointerdown', () => {
        this.scale.set(0.98);
        onClick();
    });
    this.on('pointerup', () => this.scale.set(1));
  }

  draw(w, h, isHovered) {
    this.bg.clear();
    const cardColor = 0xE6B694; 
    const hoverColor = 0xF0C6A8; 

    this.bg.roundRect(0, 0, w, h, 15);
    this.bg.fill(isHovered ? hoverColor : cardColor);
  }
}