import { Article, ArticleWord, DictId, Sentence } from "@/types/types.ts";
import { _nextTick, cloneDeep } from "@/utils";
import nlp from "compromise/one";
import { usePlayWordAudio } from "@/hooks/sound.ts";
import { getSentenceAllText, getSentenceAllTranslateText } from "@/hooks/translate.ts";
import { getDefaultArticleWord } from "@/types/func.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { useBaseStore } from "@/stores/base.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";

interface KeyboardMap {
  Period: string,
  Comma: string,
  Slash: string,
  Exclamation: string,
  QuoteLeft: string,
  QuoteRight: string,
}

export const EnKeyboardMap: KeyboardMap = {
  Period: '.',
  Comma: ',',
  Slash: '?',
  Exclamation: '!',
  QuoteLeft: `'`,
  QuoteRight: `'`,
}

function parseSentence(sentence: string) {
  // 先统一一些常见的“智能引号” -> 直引号，避免匹配问题
  sentence = sentence
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // 各种单引号 → '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"'); // 各种双引号 → "

  const len = sentence.length;
  const tokens = [];
  let i = 0;

  while (i < len) {
    const ch = sentence[i];

    // 跳过空白（但不把空白作为 token）
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    const rest = sentence.slice(i);

    // 1) 货币 + 数字（$1,000.50 或 ¥200 或 €100.5）
    let m = rest.match(/^[\$¥€£]\d{1,3}(?:,\d{3})*(?:\.\d+)?%?/);
    if (m) {
      tokens.push({word: m[0], start: i, end: i + m[0].length, isSymbol: false});
      i += m[0].length;
      continue;
    }

    // 2) 数字/小数/百分比（100% 3.14 1,000.00）
    m = rest.match(/^\d{1,3}(?:,\d{3})*(?:\.\d+)?%?/);
    if (m) {
      tokens.push({word: m[0], start: i, end: i + m[0].length, isSymbol: false});
      i += m[0].length;
      continue;
    }

    // 3) 带点缩写或多段缩写（U.S. U.S.A. e.g. i.e. Ph.D.）
    m = rest.match(/^[A-Za-z]+(?:\.[A-Za-z]+)+\.?/);
    if (m) {
      tokens.push({word: m[0], start: i, end: i + m[0].length, isSymbol: false});
      i += m[0].length;
      continue;
    }

    // 4) 单词（包含撇号/连字符，如 it's, o'clock, we'll, mother-in-law）
    m = rest.match(/^[A-Za-z0-9]+(?:[\'\-][A-Za-z0-9]+)*/);
    if (m) {
      tokens.push({word: m[0], start: i, end: i + m[0].length, isSymbol: false});
      i += m[0].length;
      continue;
    }

    // 5) 其它可视符号（标点）——单字符处理（连续标点会被循环拆为单字符）
    //    包括：.,!?;:"'()-[]{}<>/\\@#%^&*~`等非单词非空白字符
    if (/[^\w\s]/.test(ch)) {
      tokens.push({word: ch, start: i, end: i + 1, isSymbol: true});
      i += 1;
      continue;
    }

    // 6) 回退方案：把当前字符当作一个 token（防止意外丢失）
    tokens.push({word: ch, start: i, end: i + 1, isSymbol: /[^\w\s]/.test(ch)});
    i += 1;
  }

  // 计算 nextSpace：查看当前 token 的 end 到下一个 token 的 start 之间是否含空白
  const result = tokens.map((t, idx) => {
    const next = tokens[idx + 1];
    const between = next ? sentence.slice(t.end, next.start) : sentence.slice(t.end);
    const nextSpace = /\s/.test(between);
    return getDefaultArticleWord({word: t.word, nextSpace, isSymbol: !!t.isSymbol});
  });

  return result;
}

//生成文章段落数据
export function genArticleSectionData(article: Article): number {
  let text = article.text.trim()
  let sections: Sentence[][] = []
  text.split('\n\n').filter(Boolean).map((sectionText, i) => {
    let section: Sentence[] = []
    sections.push(section)
    sectionText.trim().split('\n').filter(Boolean).map((item, i, arr) => {
      item = item.trim()
      //如果没有空格，导致修改一行一行的数据时，汇总时全没有空格了，库无法正常断句
      //所以要保证最后一个是空格，但防止用户打N个空格，就去掉再加上一个空格，只需要一个即可
      if (i < arr.length - 1) item += ' '
      let sentence: Sentence = cloneDeep({
        text: item,
        translate: '',
        words: parseSentence(item),
        audioPosition: [0, 0],
      })
      section.push(sentence)
    })
  })

  sections = sections.filter(v => v.length)
  article.sections = sections
  console.log(sections)

  let failCount = 0
  let translateList = article.textTranslate?.split('\n\n') || []
  for (let i = 0; i < article.sections.length; i++) {
    let v = article.sections[i]
    let sList = []
    try {
      let s = translateList[i]
      sList = s.split('\n')
    } catch (e) {
    }

    for (let j = 0; j < v.length; j++) {
      let sentence = v[j]
      try {
        let trans = sList[j]
        if (trans.trim()) {
          sentence.translate = trans
        } else {
          failCount++
        }
      } catch (e) {
        failCount++
        // console.log('没有对应的翻译', sentence.text)
      }
    }
  }

  text = getSentenceAllText(article)
  let translate = getSentenceAllTranslateText(article)

  article.text = text
  article.textTranslate = translate

  let count = 0
  if (article?.lrcPosition?.length) {
    article.sections.map((v, i) => {
      v.map((w, j) => {
        w.audioPosition = article.lrcPosition[count]
        count++
      })
    })
  }
  return failCount
}

export function splitEnArticle2(text: string): string {
  if (!text) {
    text = `Last week I went to the theatre. I had a very good seat. The play was very interesting. I did not enjoy it. A young man and a young woman were sitting behind me. They were talking loudly. I got very angry. I could not hear the actors. I turned round. I looked at the man and the woman angrily. They did not pay any attention. In the end, I could not bear it. I turned round again. I cant hear a word! I said angrily.
Its none of your business, the young man said rudely. This is a private conversation!`
    // text = `While it is yet to be seen what direction the second Trump administration will take globally in its China policy, VOA traveled to the main island of Mahe in Seychelles to look at how China and the U.S. have impacted the country, and how each is fairing in that competition for influence there.`
    // text = "It was Sunday. I never get up early on Sundays. I sometimes stay in bed until lunchtime. Last Sunday I got up very late. I looked out of the window. It was dark outside. 'What a day!' I thought. 'It's raining again.' Just then, the telephone rang. It was my aunt Lucy. 'I've just arrived by train,' she said. 'I'm coming to see you.'\n\n     'But I'm still having breakfast,' I said.\n\n     'What are you doing?' she asked.\n\n     'I'm having breakfast,' I repeated.\n\n     'Dear me,' she said. 'Do you always get up so late? It's one o'clock!'"
  }
  //将中文符号替换
  text = text.replaceAll('’', "'")
  text = text.replaceAll('—', "-")
  text = text.replaceAll('”', '"')
  text = text.replaceAll('“', '"')

  // console.time()
  let keyboardMap = EnKeyboardMap
  let sections: Sentence[][] = []
  let sectionTextList = text.replaceAll('\n\n', '`^`').replaceAll('\n', '').split('`^`')
  // console.log(sectionTextList);
  sectionTextList.filter(v => v).map((sectionText, i) => {
    let section: Sentence[] = []
    sections.push(section)
    sectionText = sectionText.trim()

    let doc = nlp(sectionText)
    let sentenceNlpList = []
    doc.json().map(item => {

      //如果整句大于15个单词以上，检测是否有 逗号子句
      if (item.terms.length > 15) {
        //正则匹配“逗号加and|but|so|because"
        let list = item.text.split(/,\s(?=(and|but|so|because)\b)/).filter(_ => {
          //匹配完之后会把and|but|so|because也提出来，这里不需要重复的，直接筛选掉
          if (_ && !['and', 'but', 'so', 'because'].includes(_)) return _
        })
        if (list.length === 1) {
          sentenceNlpList.push(item)
        } else {
          list.map((text, i) => {
            //分割后每句都没有逗号了，所以除了最后一句外需要加回来
            sentenceNlpList = sentenceNlpList.concat(nlp(text + (i !== list.length - 1 ? ',' : '')).json())
          })
        }
      } else {
        sentenceNlpList.push(item)
      }
    })

    sentenceNlpList.map(item => {
      let sentence: Sentence = cloneDeep({
        //他没有空格，导致修改一行一行的数据时，汇总时全没有空格了，库无法正常断句
        text: item.text + ' ',
        // text: '',
        translate: '',
        words: [],
        audioPosition: [0, 0],
      })
      section.push(sentence)

      const checkQuote = (pre: string, index?: number) => {
        let nearSymbolPosition = null
        if (index === 0) {
          nearSymbolPosition = 'end'
        } else {
          //TODO 可以优化成for+break
          section.slice().reverse().map((sentenceItem, b) => {
            sentenceItem.words.slice().reverse().map((wordItem, c) => {
              if (wordItem.symbolPosition !== '' && nearSymbolPosition === null) {
                nearSymbolPosition = wordItem.symbolPosition
              }
            })
          })
        }

        let word3: ArticleWord = getDefaultArticleWord({
          word: pre,
          nextSpace: false,
          isSymbol: true,
          symbolPosition: ''
        });
        // console.log('rrr', item)
        // console.log('nearSymbolPosition', nearSymbolPosition)
        if (nearSymbolPosition === 'end' || nearSymbolPosition === null) {
          word3.symbolPosition = 'start'
          sentence.words.push(word3)
        } else {
          sentence.words[sentence.words.length - 1].nextSpace = false
          word3.symbolPosition = 'end'
          word3.nextSpace = true

          let addCurrent = false
          sentence.words.slice().reverse().map((wordItem, c) => {
            if (wordItem.symbolPosition === 'start' && !addCurrent) {
              addCurrent = true
            }
          })
          if (addCurrent) {
            sentence.words.push(word3)
          } else {
            // 'Do you always get up so late? It'LICENSE one o'clock!' 会被断成两句
            let lastSentence = section[section.length - 2]
            lastSentence.words = lastSentence.words.concat(sentence.words)
            lastSentence.words.push(word3)
            sentence.words = []
            //这里还不能直接删除sentence，因为后面还有一个  sentence.words = sentence.words.filter(v => v.word !== 'placeholder') 的判断
            // section.pop()
          }
        }
      }

      const checkSymbol = (post: string, nextSpace: boolean = true) => {
        switch (post) {
          case keyboardMap.Period:
          case keyboardMap.Comma:
          case keyboardMap.Slash:
          case keyboardMap.Exclamation:
            sentence.words[sentence.words.length - 1].nextSpace = false
            let word2 = getDefaultArticleWord({
              word: post,
              isSymbol: true,
              nextSpace
            });
            sentence.words.push(word2)
            break
          case keyboardMap.QuoteLeft:
          case ')':
            checkQuote(post)
            break
          case `.'`:
          case `!'`:
          case `?'`:
          case `,'`:
          case `*'`:
            post.split('').map(v => {
              checkSymbol(v, false)
            })
            break
          //类似于这种的“' -- ”的。需要保留空格，用了一个占位符才处理，因为每个符号都会把前面的那个字符的nextSpace改为false
          case ' ':
            // console.log('sentence', sentence)
            //遇到“The clock has stopped!' I looked at my watch.”
            //检测到stopped!' 的'时，如果前引号不在当前句，会把当前句的word合并到前一句。那么当前句的word就为空了，会报错
            //所以需要检测一下
            if (sentence.words.length) {
              sentence.words[sentence.words.length - 1].nextSpace = true
              let word3 = getDefaultArticleWord({
                word: 'placeholder',
                isSymbol: true,
                nextSpace: false,
              });
              sentence.words.push(word3)
            }
            break
          default:
            // console.log('post', post)
            //这里多半是一些奇怪的连接符之类的
            if (post.length > 1) {
              post.split('').map(v => {
                checkSymbol(v, false)
              })
            } else {
              sentence.words[sentence.words.length - 1].nextSpace = false
              let word3 = getDefaultArticleWord({
                word: post,
                isSymbol: true,
                nextSpace: false,
              });
              sentence.words.push(word3)
            }
            break
        }
      }

      item.terms.map((v, index: number) => {
        // console.log('v', v)
        if (v.text) {
          let pre: string = v.pre.trim()
          if (pre) {
            checkQuote(pre, index)
          }

          let word = getDefaultArticleWord({word: v.text, nextSpace: true});
          sentence.words.push(word)

          let post: string = v.post
          //判断是不是等于空，因为正常的词后面都会有个空格。这种不需要处理。
          if (post && post !== ' ') {
            checkSymbol(post.trim())
          }
        }
      })

      //去除空格占位符
      sentence.words = sentence.words.filter(v => v.word !== 'placeholder')
      //如果是空的，直接去掉
      if (!sentence.words.length) {
        section.pop()
      }
    })
    // console.log(sentenceNlpList)
  })

  sections = sections.filter(sectionItem => sectionItem.length)
  sections.map((sectionItem, a) => {
    sectionItem.map((sentenceItem, b) => {
      sentenceItem.text = sentenceItem.words.reduce((previousValue: string, currentValue) => {
        previousValue += currentValue.word + (currentValue.nextSpace ? ' ' : '')
        return previousValue
      }, '')
    })
  })

  // console.log(sections)

  //这里在每一行结尾处，加一个空格，因为. 号后面必要要有空格才能被库正常短句
  text = sections.map(v => v.map(s => s.text.trim()).join(' \n')).join(' \n\n');
  // console.log('s',text)
  // return text
  return text
}

export function splitCNArticle2(text: string): string {
  if (!text) {
    // text = "飞机误点了，侦探们在机场等了整整一上午。他们正期待从南非来的一个装着钻石的贵重包裹。数小时以前，有人向警方报告，说有人企图偷走这些钻石。当飞机到达时，一些侦探等候在主楼内，另一些侦探则守候在停机坪上。有两个人把包裹拿下飞机，进了海关。这时两个侦探把住门口，另外两个侦探打开了包裹。令他们吃惊的是，那珍贵的包裹里面装的全是石头和沙子！"
    text = `那是个星期天，而在星期天我是从来不早起的，有时我要一直躺到吃午饭的时候。上个星期天，我起得很晚。我望望窗外，外面一片昏暗。“鬼天气！”我想，“又下雨了。”正在这时，电话铃响了。是我姑母露西打来的。“我刚下火车，”她说，“我这就来看你。”
“但我还在吃早饭，”我说。
“你在干什么？”她问道。
“我正在吃早饭，”我又说了一遍。
“天啊，”她说，“你总是起得这么晚吗？现在已经1点钟了！”`
    text = `上星期我去看戏。我的座位很好，戏很有意思，但我却无法欣赏。一青年男子与一青年女子坐在我的身后，大声地说着话。我非常生气，因为我听不见演员在说什么。我回过头去怒视着那一男一女，他们却毫不理会。最后，我忍不住了，又一次回过头去，生气地说：“我一个字也听不见了！”
“不关你的事，”那男的毫不客气地说，“这是私人间的谈话！”`
  }
  const segmenterJa = new Intl.Segmenter("zh-CN", {granularity: "sentence"});

  let sectionTextList = text.replaceAll('\n\n', '`^`').replaceAll('\n', '').split('`^`')

  let s = sectionTextList.filter(v => v).map((rowSection, i) => {
    const segments = segmenterJa.segment(rowSection);
    let ss = ''
    Array.from(segments).map(sentenceRow => {
      let row = sentenceRow.segment
      if (row) {
        //这个库总是会把反引号给断句到上一行末尾
        //而 sentence-splitter 这个库总是会把反引号给断句到下一行开头
        if (row[row.length - 1] === "“") {
          row = row.substring(0, row.length - 1)
          ss += (row + '\n') + '“'
        } else {
          ss += (row + '\n')
        }
      }
    })
    return ss
  }).join('\n').trim()
  return s
}

export function getTranslateText(article: Article) {
  return article.textTranslate
    .split('\n\n').filter(v => v)
}

export function usePlaySentenceAudio() {
  const playWordAudio = usePlayWordAudio()
  const settingStore = useSettingStore()
  let timer = $ref(0)

  function playSentenceAudio(sentence: Sentence, ref?: HTMLAudioElement,) {
    if (sentence.audioPosition?.length && ref && ref.src) {
      clearTimeout(timer)
      if (ref.played) {
        ref.pause()
      }
      let start = sentence.audioPosition[0];
      ref.volume = settingStore.wordSoundVolume / 100
      ref.currentTime = start
      ref.play()
      let end = sentence.audioPosition?.[1]
      // console.log(sentence.audioPosition,(end - start) * 1000)

      if (end && end !== -1) {
        timer = setTimeout(() => {
          console.log('停')
          ref.pause()
        }, (end - start) / ref.playbackRate * 1000)
      }
    } else {
      playWordAudio(sentence.text)
    }
  }

  return {
    playSentenceAudio
  }
}

//todo 考虑与syncDictInMyStudyList、changeDict方法合并
export function syncBookInMyStudyList(study = false) {
  _nextTick(() => {
    const base = useBaseStore()
    const runtimeStore = useRuntimeStore()
    let rIndex = base.article.bookList.findIndex(v => v.id === runtimeStore.editDict.id)
    let temp = cloneDeep(runtimeStore.editDict);
    if (!temp.custom && temp.id !== DictId.articleCollect) {
      temp.custom = true
    }
    temp.length = temp.articles.length
    if (rIndex > -1) {
      base.article.bookList[rIndex] = temp
      if (study) base.article.studyIndex = rIndex
    } else {
      base.article.bookList.push(temp)
      if (study) base.article.studyIndex = base.article.bookList.length - 1
    }
  }, 100)
}