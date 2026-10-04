<script setup>
import { computed } from "vue";
import RichText from "./RichText.vue";
import { ART, backgroundFor, expressionSrc, propSrc } from "./sceneArt.js";

// One full-screen story frame. Art is layered (background, character, props)
// and every word is live text, so the layout reflows for any aspect ratio.
//
// beat.layout:
//   desk     – office, character seated behind laptop, speech bubble
//   close    – office, close-up on the character (banner bubble)
//   office   – office desk with props, no character
//   kitchen  – kitchen background, Angela, caption
//   profile  – standing character + profile cards
//   mission  – white page, seated character, mission banner
//   card     – white page, title + body (e.g. "Question!")
//   announce – white page, title + body inside the gradient banner (fun fact)
const props = defineProps({
  beat: { type: Object, required: true },
  character: { type: Object, default: null },
  scenario: { type: Object, default: null },
  visible: { type: Number, default: Infinity },
  // Longest bubble text in a run of frames: the bubble is sized for it so it
  // doesn't change size as the text changes.
  reserveText: { type: String, default: "" },
});

const layout = computed(() => props.beat.layout || "desk");
const art = computed(() => props.character?.art || null);

const background = computed(() => backgroundFor(props.beat, props.scenario));
const characterSrc = computed(() => expressionSrc(props.character, props.beat.expression));
const propSrcs = computed(() => (props.beat.props || []).map((key) => ({ key, src: propSrc(key) })));

const title = computed(() => props.beat.title ?? props.scenario?.[props.beat.title_from] ?? "");
const body = computed(() => props.beat.body ?? props.scenario?.[props.beat.body_from] ?? "");
const bubble = computed(() => props.beat.bubble || null);
const profile = computed(() => props.character?.profile || null);
const mission = computed(() => props.beat.mission || props.character?.mission || "Make the optimal decision.");
</script>

<template>
  <section class="scene" :class="`scene--${layout}`">
    <img v-if="background" class="scene-bg" :src="background" alt="" />

    <!-- Seated character at a desk (desk + mission layouts) -->
    <div v-if="layout === 'desk' || layout === 'mission'" class="scene-rig" aria-hidden="true">
      <img
        v-if="layout === 'mission'"
        class="scene-rig-questions"
        :src="ART.questions"
        alt=""
      />
      <img v-if="characterSrc" class="scene-rig-character" :src="characterSrc" alt="" />
      <div class="scene-desk"></div>
      <img class="scene-rig-laptop" :src="ART.laptop" alt="" />
      <img
        v-if="layout === 'mission'"
        class="scene-rig-file"
        :src="ART.solutionFile"
        alt=""
      />
    </div>

    <div v-else-if="layout === 'close'" class="scene-close" aria-hidden="true">
      <img v-if="characterSrc" class="scene-close-character" :src="characterSrc" alt="" />
      <div class="scene-desk scene-desk--close"></div>
    </div>

    <div v-else-if="layout === 'office'" class="scene-office" aria-hidden="true">
      <div class="scene-desk scene-desk--wide"></div>
      <img
        v-for="p in propSrcs"
        :key="p.key"
        :class="['scene-prop', `scene-prop--${p.key}`]"
        :src="p.src"
        alt=""
      />
    </div>

    <template v-else-if="layout === 'kitchen'">
      <img
        class="scene-kitchen-figure"
        :src="beat.figure || ART.angela"
        alt=""
      />
    </template>

    <div v-else-if="layout === 'profile'" class="scene-profile">
      <img v-if="art?.standing" class="scene-profile-figure" :src="art.standing" alt="" />
      <div v-if="profile" class="scene-profile-cards">
        <article class="scene-profile-card">
          <!-- light beam from the figure; spans exactly this card's height -->
          <span v-if="art?.standing" class="scene-profile-beam" aria-hidden="true"></span>
          <h2 class="scene-profile-title">{{ character.name }}</h2>
          <p><strong>Name:</strong> {{ profile.name }}</p>
          <p v-if="profile.age"><strong>Age:</strong> {{ profile.age }}</p>
          <p><strong>Occupation:</strong><br />{{ profile.occupation || character.role }}</p>
        </article>
        <article class="scene-profile-card">
          <p v-if="profile.background"><strong>Background:</strong><br />{{ profile.background }}</p>
          <p v-if="profile.motivation"><strong>Motivation:</strong><br />{{ profile.motivation }}</p>
          <p v-if="profile.conflict"><strong>Conflict:</strong><br />{{ profile.conflict }}</p>
        </article>
      </div>
    </div>

    <div v-if="layout === 'mission'" class="scene-banner scene-banner--mission">
      <p class="scene-banner-kicker">Mission</p>
      <p class="scene-banner-body">{{ mission }}</p>
    </div>

    <div v-if="layout === 'card'" class="scene-card">
      <h2 class="scene-card-title">{{ title }}</h2>
      <p v-if="body" class="scene-card-body">
        <RichText :text="body" :highlights="beat.highlights" :visible="visible" />
      </p>
    </div>

    <div v-if="layout === 'announce'" class="scene-card">
      <div class="scene-banner scene-banner--announce">
        <h2 class="scene-banner-kicker">{{ title }}</h2>
        <p class="scene-banner-body">
          <RichText :text="body" :highlights="beat.highlights" :visible="visible" />
        </p>
      </div>
    </div>

    <!-- the assistant interjecting from off to the side -->
    <img
      v-if="beat.assistant"
      class="scene-assistant"
      :src="ART.assistant"
      alt=""
    />

    <p v-if="beat.caption" class="scene-caption">{{ beat.caption }}</p>

    <div
      v-if="bubble"
      class="scene-bubble"
      :class="[
        `scene-bubble--${bubble.style || 'oval'}`,
        `scene-bubble--tail-${bubble.tail || 'left'}`,
        `scene-bubble--in-${layout}`,
      ]"
    >
      <p v-if="bubble.speaker" class="scene-bubble-speaker">{{ bubble.speaker }}</p>
      <p class="scene-bubble-text">
        <span v-if="reserveText" class="scene-bubble-sizer" aria-hidden="true">{{ reserveText }}</span>
        <RichText :text="bubble.text" :highlights="bubble.highlights" :visible="visible" />
      </p>
    </div>
  </section>
</template>
