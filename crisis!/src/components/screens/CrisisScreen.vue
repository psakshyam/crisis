<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  playLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
  isBusy: {
    type: Boolean,
    required: true,
  },
  appError: {
    type: String,
    default: "",
  },
  crises: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>
    <p class="error-text" v-if="appError">{{ appError }}</p>
    <div class="list-wrap">
      <article class="list-item" v-for="item in crises" :key="item.id">
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
        </div>
        <button class="ghost" :disabled="isBusy" @click="emit('select', item.id)">
          {{ isBusy ? loadingLabel : playLabel }}
        </button>
      </article>
    </div>
  </section>
</template>
