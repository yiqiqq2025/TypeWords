<script setup lang="ts">

import {ShortcutKey} from "@/types/types.ts";
import Logo from "@/pages/pc/components/Logo.vue";
import {useSettingStore} from "@/stores/setting.ts";
import {useRouter} from "vue-router";
import useTheme from "@/hooks/theme.ts";
import BaseIcon from "@/components/BaseIcon.vue";


const settingStore = useSettingStore()
const router = useRouter()
const {toggleTheme} = useTheme()


</script>

<template>
  <div class="layout anim">
    <!--    第一个aside 占位用-->
    <div class="aside space" :class="{'expand':settingStore.sideExpand}"></div>
    <div class="aside anim fixed" :class="{'expand':settingStore.sideExpand}">
      <div class="top">
        <Logo v-if="settingStore.sideExpand"/>
        <div class="row" @click="router.push('/words')">
          <IconMaterialSymbolsLightDictionaryOutlineSharp/>
          <span v-if="settingStore.sideExpand">单词</span>
        </div>
        <div class="row" @click="router.push('/articles')">
          <IconPhArticleNyTimes/>
          <span v-if="settingStore.sideExpand">文章</span>
        </div>
        <div class="row" @click="router.push('/setting')">
          <IconUilSetting/>
          <span v-if="settingStore.sideExpand">设置</span>
        </div>
      </div>
      <div class="bottom flex justify-evenly ">
        <BaseIcon
            @click="settingStore.sideExpand = !settingStore.sideExpand">
          <IconFormkitLeft v-if="settingStore.sideExpand"/>
          <IconFormkitRight v-else/>
        </BaseIcon>
        <BaseIcon
            v-if="settingStore.sideExpand"
            :title="`切换主题(${settingStore.shortcutKeyMap[ShortcutKey.ToggleTheme]})`"
            @click="toggleTheme"
        >
          <IconEpMoon v-if="settingStore.theme === 'light'"/>
          <IconTablerSun v-else/>
        </BaseIcon>
      </div>
    </div>
    <div class="flex-1 z-1 relative">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--color-primary);
}

.aside {
  background: var(--color-second);
  height: 100vh;
  padding: 1rem 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: rgb(0 0 0 / 3%) 0px 0px 12px 0px;
  width: 4.5rem;
  z-index: 2;

  .row {
    @apply cursor-pointer rounded-md  text p-2 my-2 flex items-center gap-2;
    transition: all .5s;
    flex-shrink: 0;

    &:hover {
      background: var(--color-select-bg);
      color: white;
    }

    span {
      flex-shrink: 0;
    }

    svg {
      flex-shrink: 0;
      font-size: 1.5rem !important;
    }
  }

  &.expand {
    width: var(--aside-width);
  }
}
</style>
