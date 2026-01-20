import { Container, Text } from "pixi.js";
import { GlassPanel } from "../components/glass.js";
import { OptionCard } from "../components/options.js";
import { COLORS, STYLES } from "../theme.js";

export class GameplayScreen extends Container {
  constructor(appWidth, appHeight) {
    super();
    this.w = appWidth;
    this.h = appHeight;
    this.setupLayout();
  }

  setupLayout() {
    this.questionText = new Text({
      text: "",
      style: {
        ...STYLES.body,
        fontFamily: "Poppins, sans-serif",

        fontSize: 32,
        fontWeight: "600",
        fill: COLORS.primary,

        align: "center",
        wordWrap: true,
        wordWrapWidth: this.w - 60,
        lineHeight: 40,
      },
    });

    this.questionText.anchor.set(0.5, 0);
    this.questionText.position.set(this.w / 2, 60);

    this.addChild(this.questionText);

    this.optionsContainer = new Container();
    this.addChild(this.optionsContainer);
  }
  //TODO
  updateHUD(score, stage) {}

  setQuestion(qData, onOptionSelected) {
    this.questionText.text = qData.text;

    this.optionsContainer.removeChildren();

    const margin = 20;
    const gap = 20;
    const cols = 2;
    const rows = 2;

    const areaHeight = this.h * 0.55;
    const startY = this.h - areaHeight - margin;

    const cardWidth = (this.w - margin * 2 - gap) / cols;
    const cardHeight = (areaHeight - gap) / rows;

    qData.options.forEach((opt, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const card = new OptionCard({
        text: opt.text,
        iconAlias: `icon_${idx}`,
        width: cardWidth,
        height: cardHeight,
        onClick: () => onOptionSelected(opt),
      });

      card.x = col * (cardWidth + gap);
      card.y = row * (cardHeight + gap);

      this.optionsContainer.addChild(card);
    });

    this.optionsContainer.x = margin;
    this.optionsContainer.y = startY;
  }
}
