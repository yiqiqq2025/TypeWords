<script setup lang="ts">

import {onMounted, onUnmounted} from "vue";
import {useBaseStore} from "@/stores/base.ts";
import {emitter, EventKey, useEvents} from "@/utils/eventBus.ts";
import {useSettingStore} from "@/stores/setting.ts";
import {Article, ArticleItem, ArticleWord, ShortcutKey, Word} from "@/types/types.ts";
import {useOnKeyboardEventListener, useStartKeyboardEventListener} from "@/hooks/event.ts";
import useTheme from "@/hooks/theme.ts";
import Toast from '@/pages/pc/components/base/toast/Toast.ts'
import {cloneDeep} from "@/utils";
import {usePracticeStore} from "@/stores/practice.ts";
import {useArticleOptions} from "@/hooks/dict.ts";
import {genArticleSectionData, usePlaySentenceAudio} from "@/hooks/article.ts";
import router from "@/router.ts";
import {getDefaultArticle} from "@/types/func.ts";
import TypingArticle from "@/pages/pc/article/components/TypingArticle.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import Panel from "@/pages/pc/components/Panel.vue";
import ArticleList from "@/pages/pc/components/list/ArticleList.vue";
import EditSingleArticleModal from "@/pages/pc/article/components/EditSingleArticleModal.vue";
import Tooltip from "@/pages/pc/components/base/Tooltip.vue";
import ConflictNotice from "@/pages/pc/components/ConflictNotice.vue";

const store = useBaseStore()
const settingStore = useSettingStore()
const statisticsStore = usePracticeStore()
const {toggleTheme} = useTheme()

let articleData = $ref({
  list: [],
  article: getDefaultArticle(),
  sectionIndex: 0,
  sentenceIndex: 0,
  wordIndex: 0,
  stringIndex: 0,
})
let showEditArticle = $ref(false)
let typingArticleRef = $ref<any>()
let editArticle = $ref<Article>(getDefaultArticle())

useStartKeyboardEventListener()

function write() {
  // console.log('write')
  settingStore.dictation = true
  repeat()
}

//TODO 需要判断是否已忽略
//todo 使用场景是？
function repeat() {
  // console.log('repeat')
  getCurrentPractice()
}

function prev() {
  // console.log('next')
  if (store.sbook.lastLearnIndex === 0) {
    Toast.warning('已经在第一章了~')
  } else {
    store.sbook.lastLearnIndex--
    getCurrentPractice()
  }
}

const toggleShowTranslate = () => settingStore.translate = !settingStore.translate
const toggleDictation = () => settingStore.dictation = !settingStore.dictation
const togglePanel = () => settingStore.showPanel = !settingStore.showPanel
const skip = () => typingArticleRef?.nextSentence()
const collect = () => toggleArticleCollect(articleData.article)
const shortcutKeyEdit = () => edit()

function toggleConciseMode() {
  settingStore.showToolbar = !settingStore.showToolbar
  settingStore.showPanel = settingStore.showToolbar
}

function next() {
  if (store.sbook.lastLearnIndex >= articleData.list.length - 1) {
    store.sbook.lastLearnIndex = 0
    //todo 这里应该弹窗
  } else store.sbook.lastLearnIndex++
  getCurrentPractice()
}

function init() {
  if (!store.sbook?.articles?.length) {
    router.push('/article')
    return
  }
  articleData.list = cloneDeep(store.sbook.articles)
  getCurrentPractice()
  console.log('init', articleData.article)
}

function setArticle(val: Article) {
  statisticsStore.inputWordNumber = 0
  statisticsStore.wrong = 0
  statisticsStore.total = 0
  statisticsStore.startDate = Date.now()

  articleData.list[store.sbook.lastLearnIndex] = val
  articleData.article = val
  articleData.sectionIndex = 0
  articleData.sentenceIndex = 0
  articleData.wordIndex = 0
  articleData.stringIndex = 0
  articleData.article.sections.map((v, i) => {
    v.map((w, j) => {
      w.words.map(s => {
        if (!store.knownWordsWithSimpleWords.includes(s.word.toLowerCase()) && !s.isSymbol) {
          statisticsStore.total++
        }
      })
    })
  })
}

function getCurrentPractice() {
  emitter.emit(EventKey.resetWord)
  let currentArticle = articleData.list[store.sbook.lastLearnIndex]
  let article = getDefaultArticle(currentArticle)
  // console.log('article', article)
  if (article.sections.length) {
    setArticle(article)
  } else {
    genArticleSectionData(article)
    setArticle(article)
  }
}

function saveArticle(val: Article) {
  console.log('saveArticle', val, JSON.stringify(val.lrcPosition))
  console.log('saveArticle', val.textTranslate)
  showEditArticle = false
  let rIndex = store.sbook.articles.findIndex(v => v.id === val.id)
  if (rIndex > -1) {
    store.sbook.articles[rIndex] = cloneDeep(val)
  }
  setArticle(val)
}

function edit(val: Article = articleData.article) {
  editArticle = val
  showEditArticle = true
}

function wrong(word: Word) {
  let lowerName = word.word.toLowerCase();
  if (!store.wrong.words.find((v: Word) => v.word.toLowerCase() === lowerName)) {
    store.wrong.words.push(word)
  }
  if (!store.knownWordsWithSimpleWords.includes(lowerName)) {
    //todo
  }
}

function nextWord(word: ArticleWord) {
  if (!store.knownWordsWithSimpleWords.includes(word.word.toLowerCase()) && !word.isSymbol) {
    statisticsStore.inputWordNumber++
  }
}

function changeArticle(val: ArticleItem) {
  let rIndex = articleData.list.findIndex(v => v.id === val.item.id)
  if (rIndex > -1) {
    store.sbook.lastLearnIndex = rIndex
    getCurrentPractice()
  }
}

const {
  isArticleCollect,
  toggleArticleCollect
} = useArticleOptions()

function play() {
  typingArticleRef?.play()
}

function show() {
  typingArticleRef?.showSentence()
}


function onKeyUp() {
  typingArticleRef.hideSentence()
}

async function onKeyDown(e: KeyboardEvent) {
  // console.log('e', e)
  switch (e.key) {
    case 'Backspace':
      typingArticleRef.del()
      break
  }
}

useOnKeyboardEventListener(onKeyDown, onKeyUp)


onMounted(init)

useEvents([
  [EventKey.write, write],
  [EventKey.repeatStudy, repeat],
  [EventKey.continueStudy, next],

  [ShortcutKey.PreviousChapter, prev],
  [ShortcutKey.RepeatChapter, repeat],
  [ShortcutKey.DictationChapter, write],
  [ShortcutKey.ToggleShowTranslate, toggleShowTranslate],
  [ShortcutKey.ToggleDictation, toggleDictation],
  [ShortcutKey.ToggleTheme, toggleTheme],
  [ShortcutKey.ToggleConciseMode, toggleConciseMode],
  [ShortcutKey.TogglePanel, togglePanel],
  [ShortcutKey.NextChapter, next],
  [ShortcutKey.PlayWordPronunciation, play],
  [ShortcutKey.ShowWord, show],
  [ShortcutKey.Next, skip],
  [ShortcutKey.ToggleCollect, collect],
  [ShortcutKey.EditArticle, shortcutKeyEdit],
])

let speedMinute = $ref(0)
let timer = $ref(0)
onMounted(() => {
  timer = setInterval(() => {
    speedMinute = Math.floor((Date.now() - statisticsStore.startDate) / 1000 / 60)
  }, 1000)
})

onUnmounted(() => {
  timer && clearInterval(timer)
})

let audioRef = $ref<HTMLAudioElement>()
const {playSentenceAudio} = usePlaySentenceAudio()

</script>
<template>
  <div class="practice-wrapper">
    <div class="practice-article">
      <TypingArticle
          ref="typingArticleRef"
          @edit="edit"
          @wrong="wrong"
          @next="next"
          @nextWord="nextWord"
          @play="e => playSentenceAudio(e,audioRef,articleData.article)"
          :article="articleData.article"
      />

      <div class="panel-wrapper">
        <Panel>
          <template v-slot:title>
            <span>{{
                store.sbook.name
              }} ({{ store.sbook.lastLearnIndex + 1 }} / {{ articleData.list.length }})</span>
          </template>
          <div class="panel-page-item pl-4">
            <ArticleList
                :isActive="true"
                :static="false"
                :show-translate="settingStore.translate"
                @click="changeArticle"
                :active-id="articleData.article.id"
                :list="articleData.list ">
              <template v-slot:suffix="{item,index}">
                <BaseIcon
                    :class="!isArticleCollect(item) ? 'collect' : 'fill'"
                    @click.stop="toggleArticleCollect(item)"
                    :title="!isArticleCollect(item) ? '收藏' : '取消收藏'">
                  <IconPhStar v-if="!isArticleCollect(item)"/>
                  <IconPhStarFill v-else/>
                </BaseIcon>
              </template>
            </ArticleList>
          </div>
        </Panel>
      </div>

      <EditSingleArticleModal
          v-model="showEditArticle"
          :article="editArticle"
          @save="saveArticle"
      />
    </div>
    <div class="footer" :class="!settingStore.showToolbar && 'hide'">
      <Tooltip :title="settingStore.showToolbar?'收起':'展开'">
        <IconIconParkOutlineDown
              @click="settingStore.showToolbar = !settingStore.showToolbar"
              class="arrow"
              :class="!settingStore.showToolbar && 'down'"
              width="24"
              color="#999"/>
      </Tooltip>

      <div class="bottom">
        <div class="flex justify-between items-center">
          <div class="stat">
            <div class="row">
              <div class="num">{{ speedMinute }}分钟</div>
              <div class="line"></div>
              <div class="name">时间</div>
            </div>
            <div class="row">
              <div class="num">{{ statisticsStore.total }}</div>
              <div class="line"></div>
              <div class="name">单词总数</div>
            </div>
          </div>
          <audio ref="audioRef" v-if="articleData.article.audioSrc" :src="articleData.article.audioSrc"
                 controls></audio>
          <div class="flex flex-col items-center justify-center gap-1">
            <div class="flex gap-2 center">
              <BaseIcon
                  :title="`下一句(${settingStore.shortcutKeyMap[ShortcutKey.Next]})`"
                  @click="skip">
                <IconIconParkOutlineGoAhead/>
              </BaseIcon>
              <BaseIcon
                  :title="`重听(${settingStore.shortcutKeyMap[ShortcutKey.PlayWordPronunciation]})`"
                  @click="play">
                <IconFluentReplay16Filled/>
              </BaseIcon>

              <BaseIcon
                  @click="settingStore.dictation = !settingStore.dictation"
                  :title="`开关默写模式(${settingStore.shortcutKeyMap[ShortcutKey.ToggleDictation]})`"
              >
                <IconMajesticonsEyeOffLine v-if="settingStore.dictation"/>
                <IconMdiEyeOutline v-else/>
              </BaseIcon>

              <BaseIcon
                  :title="`开关释义显示(${settingStore.shortcutKeyMap[ShortcutKey.ToggleShowTranslate]})`"
                  @click="settingStore.translate = !settingStore.translate">
                <IconMdiTranslate v-if="settingStore.translate"/>
                <IconMdiTranslateOff v-else/>
              </BaseIcon>

              <!--              <BaseIcon-->
              <!--                  :title="`编辑(${settingStore.shortcutKeyMap[ShortcutKey.EditArticle]})`"-->
              <!--                  icon="tabler:edit"-->
              <!--                  @click="emitter.emit(ShortcutKey.EditArticle)"-->
              <!--              />-->
              <BaseIcon
                  @click="settingStore.showPanel = !settingStore.showPanel"
                  :title="`面板(${settingStore.shortcutKeyMap[ShortcutKey.TogglePanel]})`">
                <IconTdesignMenuUnfold/>
              </BaseIcon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ConflictNotice/>
</template>

<style scoped lang="scss">

.practice-wrapper {
  font-size: 0.9rem;
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.swiper-wrapper {
  height: 100%;
  overflow: hidden;

  .swiper-list {
    transition: transform .3s;
    height: 200%;

    .swiper-item {
      height: 50%;
      overflow: auto;
      display: flex;
      justify-content: center;
    }
  }

  .step1 {
    transform: translate3d(0, -50%, 0);
  }
}

.practice-article {
  flex: 1;
  overflow: hidden;
  width: var(--article-width);
}

.typing-word-wrapper {
  width: var(--toolbar-width);
}

.panel-wrapper {
  position: absolute;
  left: var(--article-panel-margin-left);
  //left: 0;
  top: .8rem;
  z-index: 1;
  height: calc(100% - 1.5rem);
}

.footer {
  width: var(--article-toolbar-width);
  margin-bottom: .8rem;
  transition: all var(--anim-time);
  position: relative;
  margin-top: 1rem;

  &.hide {
    margin-bottom: -6rem;
    margin-top: 3rem;

  }

  .bottom {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    border-radius: .6rem;
    background: var(--color-second);
    padding: .5rem var(--space);
    z-index: 2;
    border: 1px solid var(--color-item-border);
    box-shadow: var(--shadow);

    .stat {
      margin-top: .5rem;
      display: flex;
      justify-content: space-around;
      gap: var(--stat-gap);

      .row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .3rem;
        width: 5rem;
        color: gray;

        .line {
          height: 1px;
          width: 100%;
          background: var(--color-sub-gray);
        }
      }
    }
  }

  .arrow {
    position: absolute;
    top: -50%;
    left: 50%;
    cursor: pointer;
    transition: all .5s;
    transform: rotate(0);
    padding: .5rem;

    &.down {
      top: -90%;
      transform: rotate(180deg);
    }
  }


}

</style>
