<template>
  <div class="nfa-test">
    <NFACanvas />
  </div>
</template>

<script setup lang="ts">
import { NFACanvas } from '@/flow/canvas'
</script>

<style scoped>
.nfa-test {
  height: 100vh;
  width: 100%;
}
</style>
