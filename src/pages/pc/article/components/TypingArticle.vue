<script setup lang="ts">
import {onMounted, onUnmounted, watch} from "vue"
import {Article, ArticleWord, Sentence, Word} from "@/types/types.ts";
import {useBaseStore} from "@/stores/base.ts";
import {useSettingStore} from "@/stores/setting.ts";
import {usePlayBeep, usePlayCorrect, usePlayKeyboardAudio, usePlayWordAudio} from "@/hooks/sound.ts";
import {emitter, EventKey} from "@/utils/eventBus.ts";
import {_nextTick} from "@/utils";
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import {getTranslateText} from "@/hooks/article.ts";
import BaseButton from "@/components/BaseButton.vue";
import QuestionForm from "@/pages/pc/article/components/QuestionForm.vue";
import {getDefaultArticle, getDefaultWord} from "@/types/func.ts";
import Toast from '@/pages/pc/components/base/toast/Toast.ts'
import TypingWord from "@/pages/pc/article/components/TypingWord.vue";
import Space from "@/pages/pc/article/components/Space.vue";
import {useWordOptions} from "@/hooks/dict.ts";
import nlp from "compromise/three";
import {nanoid} from "nanoid";

interface IProps {
  article: Article,
  sectionIndex?: number,
  sentenceIndex?: number,
  wordIndex?: number,
  stringIndex?: number,
}

const props = withDefaults(defineProps<IProps>(), {
  article: () => getDefaultArticle(),
  sectionIndex: 0,
  sentenceIndex: 0,
  wordIndex: 0,
  stringIndex: 0,
})

const emit = defineEmits<{
  ignore: [],
  wrong: [val: Word],
  play: [val: {
    sentence: Sentence,
    handle: boolean
  }],
  nextWord: [val: ArticleWord],
  complete: [],
  next: [],
  edit: [val: Article]
}>()

let typeArticleRef = $ref<HTMLInputElement>(null)
let articleWrapperRef = $ref<HTMLInputElement>(null)
let sectionIndex = $ref(0)
let sentenceIndex = $ref(0)
let wordIndex = $ref(0)
let stringIndex = $ref(0)
let input = $ref('')
let wrong = $ref('')
//是否是输入空格
let isSpace = $ref(false)
let isEnd = $ref(false)
let hoverIndex = $ref({
  sectionIndex: -1,
  sentenceIndex: -1,
  wordIndex: -1,
})
let cursor = $ref({
  top: 0,
  left: 0,
})

const currentIndex = $computed(() => {
  return `${sectionIndex}${sentenceIndex}${wordIndex}`
})

const playBeep = usePlayBeep()
const playCorrect = usePlayCorrect()
const playKeyboardAudio = usePlayKeyboardAudio()
const playWordAudio = usePlayWordAudio()
const {
  toggleWordCollect,
} = useWordOptions()

const store = useBaseStore()
const settingStore = useSettingStore()

watch([() => sectionIndex, () => sentenceIndex, () => wordIndex, () => stringIndex], ([a, b, c,]) => {
  checkCursorPosition(a, b, c)
})

watch(() => props.article, init, {immediate: true})

watch(() => settingStore.translate, () => {
  checkTranslateLocation().then(() => checkCursorPosition())
})

function init() {
  isSpace = isEnd = false
  wrong = input = ''
  sectionIndex = 0
  sentenceIndex = 0
  wordIndex = 0
  stringIndex = 0
  //todo 这在直接修改不太合理
  props.article.sections.map((v) => {
    v.map((w) => {
      w.words.map(s => {
        s.input = ''
      })
    })
  })
  typeArticleRef?.scrollTo({top: 0, behavior: "smooth"})
  checkTranslateLocation().then(() => checkCursorPosition())
}

function checkCursorPosition(a = sectionIndex, b = sentenceIndex, c = wordIndex) {
  // console.log('checkCursorPosition')
  _nextTick(() => {
    // 选中目标元素
    const currentWord = document.querySelector(`.section:nth-of-type(${a + 1}) .sentence:nth-of-type(${b + 1}) .word:nth-of-type(${c + 1})`);
    if (currentWord) {
      // 在 currentWord 内找 .word-end
      const end = currentWord.querySelector('.word-end');
      if (end) {
        // 获取 articleWrapper 的位置
        const articleRect = articleWrapperRef.getBoundingClientRect();
        const endRect = end.getBoundingClientRect();
        // 计算相对位置
        cursor = {
          top: endRect.top - articleRect.top,
          left: endRect.left - articleRect.left,
        };
      }
    }
  },)
}

function checkTranslateLocation() {
  // console.log('checkTranslateLocation')
  return new Promise<void>(resolve => {
    _nextTick(() => {
      let articleRect = articleWrapperRef.getBoundingClientRect()
      props.article.sections.map((v, i) => {
        v.map((w, j) => {
          let location = i + '-' + j
          let wordClassName = `.word${location}`
          let word = document.querySelector(wordClassName)
          let wordRect = word.getBoundingClientRect()
          let translateClassName = `.translate${location}`
          let translate: HTMLDivElement = document.querySelector(translateClassName)

          translate.style.opacity = '1'
          translate.style.top = wordRect.top - articleRect.top + 24 + 'px'
          // @ts-ignore
          translate.firstChild.style.width = wordRect.left - articleRect.left + 'px'
          // console.log(word, wordRect.left - articleRect.left)
          // console.log('word-wordRect', wordRect)
        })
      })
      resolve()
    }, 300)
  })
}

let lockNextSentence = false

function nextSentence() {
  if (lockNextSentence) return
  checkTranslateLocation()
  lockNextSentence = true
  // wordData.words = [
  //   {"word": "pharmacy", "trans": ["药房；配药学，药剂学；制药业；一批备用药品"], "phonetic0": "'fɑrməsi", "phonetic1": "'fɑːməsɪ"},
  //   // {"word": "foregone", "trans": ["过去的；先前的；预知的；预先决定的", "发生在…之前（forego的过去分词）"], "phonetic0": "'fɔrɡɔn", "phonetic1": "fɔː'gɒn"}, {"word": "president", "trans": ["总统；董事长；校长；主席"], "phonetic0": "'prɛzɪdənt", "phonetic1": "'prezɪd(ə)nt"}, {"word": "plastic", "trans": ["塑料的；（外科）造型的；可塑的", "塑料制品；整形；可塑体"], "phonetic0": "'plæstɪk", "phonetic1": "'plæstɪk"}, {"word": "provisionally", "trans": ["临时地，暂时地"], "phonetic0": "", "phonetic1": ""}, {"word": "incentive", "trans": ["动机；刺激", "激励的；刺激的"], "phonetic0": "ɪn'sɛntɪv", "phonetic1": "ɪn'sentɪv"}, {"word": "calculate", "trans": ["计算；以为；作打算"], "phonetic0": "'kælkjulet", "phonetic1": "'kælkjʊleɪt"}
  // ]
  // return

  let currentSection = props.article.sections[sectionIndex]
  let currentSentence = currentSection[sentenceIndex]
  //这里把未输入的单词补全，因为删除时会用到input
  currentSentence.words.forEach((word, i) => {
    word.input = word.input + word.word.slice(word.input?.length ?? 0)
  })

  isSpace = false
  stringIndex = 0
  wordIndex = 0
  input = wrong = ''

  //todo 计得把略过的单词加上统计里面去
  // if (!store.allIgnoreWords.includes(currentWord.word.toLowerCase()) && !currentWord.isSymbol) {
  //   statisticsStore.inputNumber++
  // }


  sentenceIndex++
  if (!currentSection[sentenceIndex]) {
    sentenceIndex = 0
    sectionIndex++
    if (!props.article.sections[sectionIndex]) {
      console.log('打完了')
      isEnd = true
      emit('complete')
    } else {
      emit('play', {sentence: props.article.sections[sectionIndex][0], handle: false})
    }
  } else {
    emit('play', {sentence: currentSection[sentenceIndex], handle: false})
  }
  lockNextSentence = false
}

function onTyping(e: KeyboardEvent) {
  if (!props.article.sections.length) return
  // console.log('keyDown', e.key, e.code, e.keyCode)
  wrong = ''
  let currentSection = props.article.sections[sectionIndex]
  let currentSentence = currentSection[sentenceIndex]
  let currentWord: ArticleWord = currentSentence.words[wordIndex]

  const nextWord = () => {
    isSpace = false
    stringIndex = 0
    wordIndex++

    emit('nextWord', currentWord)

    if (!currentSentence.words[wordIndex]) {
      wordIndex = 0
      nextSentence()
    }
  }

  if (isSpace) {
    if (e.code === 'Space') {
      nextWord()
    } else {
      wrong = ' '
      playBeep()

      setTimeout(() => {
        wrong = ''
        wrong = input = ''
      }, 500)
    }
    playKeyboardAudio()
  } else {
    if (sectionIndex === 0 && sentenceIndex === 0 && wordIndex === 0 && stringIndex === 0) {
      emit('play', {sentence: currentSection[sentenceIndex], handle: false})
    }
    let letter = e.key

    let key = currentWord.word[stringIndex]

    // console.log('key', key,)

    let isRight = false
    if (settingStore.ignoreCase) {
      isRight = key.toLowerCase() === letter.toLowerCase()
    } else {
      isRight = key === letter
    }
    if (!isRight) {
      if (!currentWord.isSymbol) {
        emit('wrong', currentWord)
      }
      playBeep()
    }

    input += letter

    if (!currentWord.input) currentWord.input = ''
    currentWord.input = input
    // console.log(currentWord.input)

    wrong = ''
    // console.log('匹配上了')
    stringIndex++
    //如果当前词没有index，说明这个词完了，下一个是空格
    if (!currentWord.word[stringIndex]) {
      input = ''
      if (!currentWord.isSymbol) {
        playCorrect()
      }
      if (currentWord.nextSpace) {
        isSpace = true
      } else {
        nextWord()
      }
    }
    playKeyboardAudio()
  }
  e.preventDefault()
}

function play() {
  let currentSection = props.article.sections[sectionIndex]
  emit('play', {sentence: currentSection[sentenceIndex], handle: true})
}

function del() {
  if (wrong) {
    wrong = ''
  } else {
    if (isEnd) return;
    if (isSpace) {
      isSpace = false
    }
    let endSentence = false
    let endWord = false
    let endString = false
    if (stringIndex === 0) {
      if (wordIndex === 0) {
        if (sentenceIndex === 0) {
          if (sectionIndex === 0) {
            return
          } else {
            endSentence = endString = endWord = true
            sectionIndex--
          }
        } else {
          endString = endWord = true
          sentenceIndex--
        }
      } else {
        endString = true
        wordIndex--
      }
    } else stringIndex--
    let currentSection = props.article.sections[sectionIndex]
    if (endSentence) sentenceIndex = currentSection.length - 1
    let currentSentence = currentSection[sentenceIndex]
    if (endWord) wordIndex = currentSentence.words.length - 1
    let currentWord: ArticleWord = currentSentence.words[wordIndex]
    if (endString) {
      checkTranslateLocation()
      if (currentWord.nextSpace) {
        isSpace = true
        stringIndex = currentWord.word.length
      } else {
        stringIndex = currentWord.word.length - 1
      }
    }
    input = currentWord.input = currentWord.input.slice(0, stringIndex)
  }
  checkCursorPosition()
}

function showSentence(i1: number = sectionIndex, i2: number = sentenceIndex, i3: number = wordIndex) {
  hoverIndex = {sectionIndex: i1, sentenceIndex: i2, wordIndex: i3}
}

function hideSentence() {
  hoverIndex = {sectionIndex: -1, sentenceIndex: -1, wordIndex: -1}
}

function onContextMenu(e: MouseEvent, sentence: Sentence, i, j, w) {
  const selectedText = window.getSelection().toString();
  console.log(selectedText);
  //prevent the browser's default menu
  e.preventDefault();
  //show your menu
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      {
        label: "从这开始",
        onClick: () => {
          sectionIndex = i
          sentenceIndex = j
          wordIndex = w
          stringIndex = 0
          input = wrong = ''
          isEnd = isSpace = false
          let currentSection = props.article.sections[sectionIndex]
          currentSection.slice(sentenceIndex).map(w => {
            w.words.map(v => {
              v.input = ''
            })
          })
          props.article.sections.slice(sectionIndex + 1).map((v, i) => {
            v.map((w) => {
              w.words.map(v => {
                v.input = ''
              })
            })
          })
          emit('play', {sentence: sentence, handle: false})
        }
      },
      {
        label: "添加到收藏",
        onClick: () => {
          let word = props.article.sections[i][j].words[w]
          let doc = nlp(word.word)
          let text = word.word
          // 优先判断是不是动词
          if (doc.verbs().found) {
            text = doc.verbs().toInfinitive().text()
          }
          // 如果是名词（复数 → 单数）
          if (doc.nouns().found) {
            text = doc.nouns().toSingular().text()
          }
          if (!text.length) text = word.word
          console.log('text', text)
          toggleWordCollect(getDefaultWord({word: text, id: nanoid()}))
          Toast.success(text + ' 添加成功')
        }
      },
      {
        label: "复制句子",
        onClick: () => {
          navigator.clipboard.writeText(sentence.text).then(r => {
            Toast.success('已复制')
          })
        }
      },
      {
        label: "复制单词",
        onClick: () => {
          let word = props.article.sections[i][j].words[w]
          navigator.clipboard.writeText(word.word).then(r => {
            Toast.success('已复制')
          })
        }
      },
      {
        label: "播放句子",
        onClick: () => {
          emit('play', {sentence: sentence, handle: true})
        }
      },
      {
        label: "语法分析",
        onClick: () => {
          navigator.clipboard.writeText(sentence.text).then(r => {
            Toast.success('已复制！随后将打开语法分析网站！')
            setTimeout(() => {
              window.open('https://enpuz.com/')
            }, 1000)
          })
        }
      },
    ]
  });
}

onMounted(() => {
  emitter.on(EventKey.resetWord, () => {
    wrong = input = ''
  })
  emitter.on(EventKey.onTyping, onTyping)
})

onUnmounted(() => {
  emitter.off(EventKey.resetWord,)
  emitter.off(EventKey.onTyping, onTyping)
})

defineExpose({showSentence, play, del, hideSentence, nextSentence})

function isCurrent(i: number, j: number, w: number) {
  return `${i}${j}${w}` === currentIndex
}

let showQuestions = $ref(false)
</script>

<template>
  <div class="typing-article" ref="typeArticleRef">
    <header class="mb-4">
      <div class="title word">{{ props.article.title }}</div>
      <div class="titleTranslate" v-if="settingStore.translate">{{ props.article.titleTranslate }}</div>
    </header>

    <div class="article-content" ref="articleWrapperRef">
      <article :class="[
          settingStore.translate && 'tall',
          settingStore.dictation && 'dictation',
      ]">
        <div class="section" v-for="(section,indexI) in props.article.sections">
                <span class="sentence"
                      v-for="(sentence,indexJ) in section">
                  <span
                      v-for="(word,indexW) in sentence.words"
                      @contextmenu="e=>onContextMenu(e,sentence,indexI,indexJ,indexW)"
                      class="word"
                      :class="[(sectionIndex>indexI
                        ?'wrote':
                        (sectionIndex>=indexI &&sentenceIndex>indexJ)
                        ?'wrote' :
                        (sectionIndex>=indexI &&sentenceIndex>=indexJ && wordIndex>indexW)
                        ?'wrote':
                         (sectionIndex>=indexI &&sentenceIndex>=indexJ && wordIndex>=indexW && stringIndex>=word.word.length)
                        ?'wrote':
                        ''),
                        indexW === 0 && `word${indexI}-${indexJ}`,
                        ]">
                    <span class="word-wrap"
                          @mouseenter="settingStore.allowWordTip && showSentence(indexI,indexJ,indexW)"
                          @mouseleave="hideSentence"
                          :class="[
                           hoverIndex.sectionIndex === indexI && hoverIndex.sentenceIndex === indexJ && hoverIndex.wordIndex === indexW
                          &&'hover-show'
                          ]"
                    >
                      <TypingWord :word="word"
                                  :is-typing="true"
                                  v-if="isCurrent(indexI,indexJ,indexW) && !isSpace"/>
                      <TypingWord :word="word" :is-typing="false" v-else/>
                      <span class="border-bottom" v-if="settingStore.dictation"></span>
                    </span>
                   <Space
                       v-if="word.nextSpace"
                       class="word-end"
                       :is-wrong="false"
                       :is-wait="isCurrent(indexI,indexJ,indexW) && isSpace"
                       :is-shake="isCurrent(indexI,indexJ,indexW) && isSpace && wrong !== ''"
                   />
                  </span>
                </span>
        </div>
      </article>
      <div class="translate" v-show="settingStore.translate">
        <template v-for="(v,indexI) in props.article.sections">
          <div class="row"
               :class="[
                   `translate${indexI+'-'+indexJ}`,
                   (sectionIndex>indexI
                        ?'wrote':
                        (sectionIndex>=indexI &&sentenceIndex>indexJ)
                        ?'wrote' :
                        ''),
                        ]"
               v-for="(item,indexJ) in v">
            <span class="space"></span>
            <Transition name="fade">
              <span class="text" v-if="item.translate">{{ item.translate }}</span>
            </Transition>
          </div>
        </template>
      </div>
      <div class="cursor" v-if="!isEnd" :style="{top:cursor.top+'px',left:cursor.left+'px'}"></div>
    </div>

    <div class="options flex justify-center" v-if="isEnd">
      <BaseButton
          @click="init">重新练习
      </BaseButton>
      <BaseButton
          v-if="store.currentBook.lastLearnIndex < store.currentBook.articles.length - 1"
          @click="emit('next')">下一篇
      </BaseButton>
    </div>

    <template v-if="false">
      <div class="translate-bottom mb-10" v-if="settingStore.translate">
        <header class="mb-4">
          <div class="text-2xl center">{{ props.article.titleTranslate }}</div>
        </header>
        <template v-if="getTranslateText(article).length">
          <div class="text-xl mb-4 indent-8" v-for="t in getTranslateText(article)">{{ t }}</div>
        </template>
      </div>
      <div class="center">
        <BaseButton @click="showQuestions =! showQuestions">显示题目</BaseButton>
      </div>
      <div class="toggle" v-if="showQuestions">
        <QuestionForm :questions="article.questions"
                      :duration="300"
                      :immediateFeedback="false"
                      :randomize="true"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">

.wrote {
  color: grey;
}

$translate-lh: 3.2;
$article-lh: 2.4;

.typing-article {
  height: 100%;
  overflow: auto;
  color: var(--color-article);
  width: var(--article-width);
  font-size: 1.6rem;

  header {
    word-wrap: break-word;
    position: relative;
    padding-top: 3rem;

    .title {
      text-align: center;
      font-size: 2.2rem;
      font-family: var(--en-article-family);
    }

    .titleTranslate {
      @extend .title;
      font-size: 1.2rem;
      margin-top: 0.5rem;
      font-family: var(--zh-article-family);
      font-weight: bold;
    }
  }

  .article-content {
    position: relative;
  }

  article {
    word-break: keep-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-family: var(--en-article-family);

    &.dictation {
      .border-bottom {
        display: inline-block !important;
      }
    }

    .wrote, .hover-show {
      :deep(.hide) {
        opacity: 1 !important;
      }

      .border-bottom {
        display: none !important;
      }
    }

    .hover-show {
      border-radius: 0.2rem;
      //background: var(--color-select-bg);
      @apply bg-green!;

      :deep(.hide) {
        opacity: 1 !important;
      }
    }

    &.tall {
      line-height: $article-lh;
    }

    .section {
      margin-bottom: 1.5rem;

      .sentence {
        transition: all .3s;
      }

      .word {
        display: inline-block;

        .word-wrap {
          position: relative;
          transition: background-color .3s;
        }

        .border-bottom {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          border-bottom: 2px solid var(--color-article);
          display: none;
          transform: translateY(-0.2rem);
        }
      }
    }
  }

  .translate {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    font-size: 1.2rem;
    line-height: $translate-lh;
    letter-spacing: .2rem;
    font-family: var(--zh-article-family);
    font-weight: bold;

    .row {
      position: absolute;
      left: 0;
      width: 100%;
      opacity: 0;
      transition: all .3s;

      .space {
        transition: all .3s;
        display: inline-block;
      }
    }
  }
}

.cursor {
  position: absolute;
  left: 0;
  top: 0;
  height: 1.8rem;
  animation: underline 1s infinite steps(1, start);
}

@keyframes underline {
  0%, 100% {
    border-left: .1rem solid var(--color-article);
  }
  50% {
    border-left: .1rem solid transparent;
  }
}

</style>
