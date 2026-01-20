import { Container, Sprite, Text } from "pixi.js";
import { STYLES } from "../theme.js";

export class ArchetypeFigurine extends Container {
  constructor({ title, imagePath, onClick }) {
    super();
    imagePath = imagePath;
    const sprite = Sprite.from(imagePath);
    sprite.anchor.set(0.5); 
    sprite.scale.set(0.5);  
    
    sprite.alpha = 0.9; 
    
    this.addChild(sprite);


    const label = new Text({ text: title, style: STYLES.label });
    label.anchor.set(0.5);
    label.y = 180; 


    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
        this.scale.set(1.1); 

        sprite.alpha = 1; 
    });

    this.on('pointerout', () => {
        this.scale.set(1);
        sprite.alpha = 1; 
    });

    this.on('pointerdown', onClick);
  }
}