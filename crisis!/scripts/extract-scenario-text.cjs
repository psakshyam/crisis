const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const scenarioFiles = [
  { file: "public/data/scenarios/2008crisis.json", key: "financial_2008" },
  { file: "public/data/scenarios/asianCrisis.json", key: "asian_1997" },
];

const scenariosOut = {};

for (const entry of scenarioFiles) {
  const filePath = path.resolve(process.cwd(), entry.file);
  const cwdName = path.basename(process.cwd());
  const pathCandidates = [entry.file, `${cwdName}/${entry.file}`];

  let source = "";
  let resolved = false;
  for (const candidate of pathCandidates) {
    try {
      source = execSync(`git show HEAD:${candidate}`, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      resolved = true;
      break;
    } catch {
      // Try next candidate path.
    }
  }

  if (!resolved) {
    throw new Error(`Unable to resolve git path for ${entry.file}`);
  }

  const raw = JSON.parse(source);

  const keyBase = `scenarios.${entry.key}`;
  const localeScenario = {
    title: raw.title,
    description: raw.description,
    stages: {},
  };

  raw.title = `i18n:${keyBase}.title`;
  raw.description = `i18n:${keyBase}.description`;

  for (const stage of raw.stages || []) {
    const stageId = String(stage.stage_id);
    const stageBase = `${keyBase}.stages.${stageId}`;

    const localeStage = {
      description: stage.description,
      questions: {},
    };

    stage.description = `i18n:${stageBase}.description`;

    for (const question of stage.questions || []) {
      const questionId = String(question.id);
      const questionBase = `${stageBase}.questions.${questionId}`;

      const localeQuestion = {
        text: question.text,
        fun_fact: question.fun_fact,
        options: {},
      };

      question.text = `i18n:${questionBase}.text`;
      question.fun_fact = `i18n:${questionBase}.fun_fact`;

      for (let i = 0; i < (question.options || []).length; i++) {
        const option = question.options[i];
        const optionId = String(i + 1);
        const optionBase = `${questionBase}.options.${optionId}`;

        localeQuestion.options[optionId] = {
          text: option.text,
          type: option.type,
          feedback: option.feedback,
        };

        option.text = `i18n:${optionBase}.text`;
        option.type = `i18n:${optionBase}.type`;
        option.feedback = `i18n:${optionBase}.feedback`;
      }

      localeStage.questions[questionId] = localeQuestion;
    }

    localeScenario.stages[stageId] = localeStage;
  }

  scenariosOut[entry.key] = localeScenario;

  fs.writeFileSync(filePath, `${JSON.stringify(raw, null, 2)}\n`);
}

const localeFile = path.resolve(
  process.cwd(),
  "src/content/locales/scenarios.en.json",
);
fs.writeFileSync(localeFile, `${JSON.stringify(scenariosOut, null, 2)}\n`);
