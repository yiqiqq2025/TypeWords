<script setup lang="ts">
import {useSettingStore} from "@/stores/setting.ts";

const props = withDefaults(defineProps<{
  isWrong: boolean,
  isWait?: boolean,
  isShake?: boolean,
}>(), {
  isWrong: false,
  isShake: false,
})
const settingStore = useSettingStore()
const isMoveBottom = $computed(() => {
  return settingStore.dictation && !props.isWrong
})
</script>

<template>
   <span class="word-space"
         v-if="isWrong"
         :class="[
           isWrong && 'wrong',
           isWait && 'wait',
           isShake ? isMoveBottom ? 'shakeBottom' : 'shake' : '',
           isMoveBottom && 'to-bottom'
       ]"
         v-bind="$attrs"
   ></span>
  <span v-bind="$attrs" v-else>
    <span class="word-space mx-0.5!"
          :class="[
           isWrong && 'wrong',
           isWait && 'wait',
           isShake ? isMoveBottom ? 'shakeBottom' : 'shake' : '',
           isMoveBottom && 'to-bottom'
       ]"
    ></span>
  </span>
</template>

<style scoped lang="scss">
.word-space {
  position: relative;
  display: inline-block;
  width: 0.8rem;
  height: 1.5rem;
  box-sizing: border-box;
  margin: 0 1px;

  &.wrong {
    border-bottom: 2px solid red;
  }

  &.to-bottom {
    transform: translateY(0.3rem);
  }

  &.wait {
    border-bottom: 2px solid var(--color-article);

    &::after {
      content: ' ';
      position: absolute;
      width: 2px;
      height: .25rem;
      background: var(--color-article);
      bottom: 0;
      right: 0;
    }

    &::before {
      content: ' ';
      position: absolute;
      width: 2px;
      height: .26rem;
      background: var(--color-article);
      bottom: 0;
      left: 0;
    }
  }
}

.shake {
  border-bottom: 2px solid red !important;
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;

  &::after {
    background: red !important;
  }

  &::before {
    background: red !important;
  }
}

.shakeBottom {
  @extend .shake;
  animation: shakeBottom 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

</style>
