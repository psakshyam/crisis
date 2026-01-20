import { Container, Text, Graphics } from "pixi.js";
import { ArchetypeFigurine } from "../components/archetypeFigurine.js";
import { ModernButton } from "../components/button.js";
import { COLORS, STYLES } from "../theme.js";

export class EndScreen extends Container {
  constructor(appWidth, appHeight, score, feedbackList, archetypeId, onReplay) {
    super();
    this.w = appWidth;
    this.h = appHeight;

    this.feedbackList = Array.isArray(feedbackList)
      ? feedbackList
      : [feedbackList];

    this.setupLayout(score, archetypeId, onReplay);
  }

  setupLayout(score, archetypeId, onReplay) {
    const title = new Text({
      text: "POINTS FOR ROUND 1:",
      style: {
        ...STYLES.header,
        fontSize: 48,
        fill: COLORS.primary, 
        fontWeight: "bold",
      },
    });
    title.anchor.set(0.5, 0);
    title.position.set(this.w / 2, 40);
    this.addChild(title);


    const figurine = new ArchetypeFigurine({
      title: archetypeId.toUpperCase(),
      imagePath: archetypeId,
      onClick: () => {},
    });

    figurine.scale.set(1.3);
    figurine.x = this.w * 0.25;
    figurine.y = this.h * 0.55;
    this.addChild(figurine);

    const listContainer = new Container();

    const BUBBLE_WIDTH = 500;
    let currentY = 0;

    this.feedbackList.forEach((text) => {

        const bubble = this.createFeedbackBubble(text, BUBBLE_WIDTH);

      bubble.x = 0;
      bubble.y = currentY;
      listContainer.addChild(bubble);

      currentY += bubble.height + 20;
    });

    listContainer.x = this.w * 0.75 - BUBBLE_WIDTH / 2; 
    listContainer.y = 150;
    this.addChild(listContainer);

    const totalContainer = new Container();

    const totalLabel = new Text({
      text: "TOTAL:",
      style: {
        ...STYLES.header,
        fontSize: 36,
        fill: COLORS.primary,
        fontWeight: "bold",
      },
    });
    totalLabel.anchor.set(1, 0.5); 
    totalLabel.position.set(-10, 0);

    const subLabel = new Text({
      text: "",
      style: {
        ...STYLES.header,
        fontSize: 24,
        fill: COLORS.primary,
        fontWeight: "bold",
      },
    });
    subLabel.anchor.set(1, 0.5);
    subLabel.position.set(-10, 35);

    const scoreBox = new Graphics();
    scoreBox.roundRect(0, -40, 140, 80, 15);
    scoreBox.fill(0xe6b694); 

    const scoreValue = new Text({
      text: score.toString(),
      style: { ...STYLES.header, fontSize: 48, fill: COLORS.primary },
    });
    scoreValue.anchor.set(0.5);
    scoreValue.position.set(70, 0); 

    scoreBox.addChild(scoreValue);

    totalContainer.addChild(totalLabel, subLabel, scoreBox);

    totalContainer.x = this.w - 200;
    totalContainer.y = this.h - 100;
    this.addChild(totalContainer);

    const btn = new ModernButton({
      text: "NEXT ROUND",
      width: 200,
      height: 60,
      onClick: onReplay,
    });
    btn.x = this.w - 250;
    btn.y = this.h - this.h*0.24;
    this.addChild(btn);
  }

  createFeedbackBubble(text, width) {
    const container = new Container();
    const PADDING = 25;

    const WRAP_WIDTH = width + PADDING * 2.2;


    const label = new Text({
      text: text,
      style: {
        ...STYLES.body,
        fontFamily: "Poppins, sans-serif",
        fontSize: 18,
        fill: 0xb35f35,
        fontWeight: "600",
        align: "left",

        wordWrap: true,
        wordWrapWidth: WRAP_WIDTH,
        breakWords: true, 
        lineHeight: 24,
        padding: 5,
      },
    });

    label.x = PADDING;
    label.y = PADDING;


    const boxHeight = label.height + PADDING * 2 + 5;
    const boxWidth = label.width + PADDING * 2;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxWidth, boxHeight, 15);
    bg.fill(0xe6b694);

    container.addChild(bg, label);
    return container;
  }
}
