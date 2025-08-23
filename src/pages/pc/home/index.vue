<script setup lang="ts">
import {ProjectName} from "@/config/ENV.ts";
import BaseButton from "@/components/BaseButton.vue";
import Radio from "@/pages/pc/components/base/radio/Radio.vue";
</script>

<template>
  <div class="center flex-col gap-3rem">
    <h1>{{ ProjectName }}</h1>
    <div class="text-center -mt-4rem">
      <h2>学习英语，一次敲击，一点进步</h2>
      <h2>记忆不再盲目，学习更高效，开源单词与文章练习工具</h2>
    </div>
    <div class="flex">
      <BaseButton @click="$router.push('/words')">单词练习</BaseButton>
      <BaseButton @click="$router.push('/articles')">文章练习</BaseButton>
    </div>
    <div class="flex w-60vw gap-space">
      <div class="card">
        <div class="emoji">📚</div>
        <div class="title">单词练习</div>
        <div class="desc">
          <ul>
            <li>三种输入模式：跟打 / 复习 / 默写</li>
            <li>智能模式：自动安排复习与默写，更高效记忆</li>
            <li>自由模式：不受限制，想怎么练就怎么练</li>
          </ul>
        </div>
      </div>
      <div class="card">
        <div class="emoji">✍️</div>
        <div class="title">文章练习</div>
        <div class="desc">
          <ul>
            <li>内置常见书籍，也可自行添加文章</li>
            <li>跟打 + 默写双模式，让背诵更高效</li>
            <li>支持边听边默写，强化记忆</li>
            <li>支持批量导入文章，快速扩展练习内容</li>
          </ul>
        </div>
      </div>
      <div class="card">
        <div class="emoji">⚙️</div>
        <div class="title">高度自由</div>
        <div class="desc">
          <ul>
            <li>自由添加词典与文章</li>
            <li>可自定义快捷键</li>
            <li>丰富的键盘音效</li>
            <li>高度定制化的设置选项</li>
            <li>完全开源，可审查、可修改</li>
          </ul>
        </div>
      </div>
      <div class="card">
        <div class="emoji">🎨</div>
        <div class="title">简洁现代</div>
        <div class="desc">
          <ul>
            <li>无广告</li>
            <li>不强制关注任何平台</li>
            <li>简洁设计</li>
            <li>现代化UI</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="w-60vw text-center">
      <h3 class="text-4xl">单词练习</h3>
      <img src="/word.png" alt="word.png" class="w-full rounded-xl">
      <h3 class="text-4xl">文章练习</h3>
      <img src="/article.png" alt="article.png" class="w-full rounded-xl">
    </div>
    <div class="text-center my-10 bottom">
      <div>Released under the GPL License.</div>
      <div>Copyright © 2019-present zyronon 蜀ICP备2025157466号</div>
    </div>
  </div>
</template>
<style scoped lang="scss">
h1 {
  //color: #3451B2;
  font-size: 5rem;
  background: linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 2rem;
}

h2 {
  margin: 0;
}
h3:first-child{
  margin-top: 0;
}

.card {
  @apply flex flex-col items-start gap-2 flex-1 mb-0;
  .emoji {
    display: inline-block;
    background: var(--color-third);
    padding: .6rem;
    border-radius: 0.4rem;
    font-size: 1.5rem;
  }

  .title {
    font-weight: bold;
  }

  ul {
    margin: 0;
    padding-left: 1.2rem;
  }
}

.bottom {
  width: 100%;
  padding-top: 3rem;
  border-top:1px solid #c4c4c4;
}

</style>
