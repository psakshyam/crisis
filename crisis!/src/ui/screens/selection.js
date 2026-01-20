import { Container, Text } from "pixi.js";
import { GlassPanel } from "../components/glass.js";
import { ModernButton } from "../components/button.js";
import { ArchetypeFigurine } from "../components/archetypeFigurine.js";
import { COLORS, STYLES } from "../theme.js";

export class SelectionScreen extends Container {
  constructor(appWidth, appHeight, titleText, items, onSelected, mode = 'grid') {
    super();
    this.w = appWidth;
    this.h = appHeight;
    this.items = items;
    this.onSelected = onSelected;
    this.mode = mode; 

    this.setupHeader(titleText);
    this.setupItems();
  }

setupHeader(text) {
    const title = new Text({ text: text.toUpperCase(), style: STYLES.header });
    title.anchor.set(0.5);
    title.position.set(this.w / 2, 80);
    this.addChild(title);
  }

  setupItems() {
    const startY = this.h * 0.5;
    
    if (this.mode === 'grid') {
        const totalWidth = this.w;
      const count = this.items.length;
      const spacing = totalWidth / (count + 1);
      this.items.forEach((item, index) => {

        const figurine = new ArchetypeFigurine({
            title: item.title,
            imagePath: item.image,
            onClick: () => this.onSelected(item.id)
        });

        figurine.x = spacing * (index + 1);
        figurine.y = startY;

        this.addChild(figurine);
      });

    } else {
      let currentY = 150;
      
      this.items.forEach((item) => {
        const panelWidth = this.w - 100;
        const panelHeight = 100;
        
        const panel = new GlassPanel(panelWidth, panelHeight);
        panel.position.set(50, currentY);

        const title = new Text({ text: item.title, style: { ...STYLES.body, fontSize: 24, fontWeight: 'bold' } });
        title.position.set(20, 20);

        const sub = new Text({ text: "", style: { ...STYLES.body, fontSize: 14, fill: COLORS.danger } });
        sub.position.set(20, 55);

        const btn = new ModernButton({
          text: "Select",
          width: 150,
          height: 50,
          color: COLORS.danger,
          onClick: () => this.onSelected(item.id)
        });
        btn.position.set(panelWidth - 170, 25);

        panel.addChild(title, sub, btn);
        this.addChild(panel);
        
        currentY += 120;
      });
    }
  }
}