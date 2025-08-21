import {defineStore} from "pinia"
import {checkAndUpgradeSaveSetting, cloneDeep} from "@/utils";
import {DefaultShortcutKeyMap} from "@/types/types.ts";
import {SAVE_SETTING_KEY} from "@/utils/const.ts";
import {get} from "idb-keyval";

export interface SettingState {
  showToolbar: boolean,
  show: boolean,

  allSound: boolean,
  wordSound: boolean,
  wordSoundVolume: number,
  wordSoundSpeed: number,
  wordSoundType: string,
  keyboardSound: boolean,
  keyboardSoundVolume: number,
  keyboardSoundFile: string,
  effectSound: boolean,
  effectSoundVolume: number,
  repeatCount: number,
  repeatCustomCount?: number,
  dictation: boolean,
  translate: boolean,
  showNearWord: boolean
  ignoreCase: boolean
  allowWordTip: boolean
  waitTimeForChangeWord: number
  fontSize: {
    articleForeignFontSize: number,
    articleTranslateFontSize: number,
    wordForeignFontSize: number,
    wordTranslateFontSize: number,
  },
  showPanel: boolean,
  sideExpand: boolean,
  theme: string,
  shortcutKeyMap: Record<string, string>,
  first: boolean
  firstTime: number
  load: boolean
  conflictNotice: boolean // 其他脚本/插件冲突提示
  ignoreSimpleWord: boolean // 忽略简单词
  wordPracticeMode: number // 单词练习模式，0：智能模式，1：自由模式
  disableShowPracticeSettingDialog: boolean // 不默认显示练习设置弹框
  autoNextWord: boolean //自动切换下一个单词
}

export const getDefaultSettingState = (): SettingState => ({
  showToolbar: true,
  show: false,
  showPanel: true,
  sideExpand: false,

  allSound: true,
  wordSound: true,
  wordSoundVolume: 100,
  wordSoundSpeed: 1,
  wordSoundType: 'us',
  keyboardSound: true,
  keyboardSoundVolume: 100,
  keyboardSoundFile: '机械键盘2',
  effectSound: true,
  effectSoundVolume: 100,
  repeatCount: 1,
  repeatCustomCount: null,
  dictation: false,
  translate: true,

  showNearWord: true,
  ignoreCase: true,
  allowWordTip: true,
  fontSize: {
    articleForeignFontSize: 48,
    articleTranslateFontSize: 20,
    wordForeignFontSize: 48,
    wordTranslateFontSize: 20,
  },
  waitTimeForChangeWord: 300,
  theme: 'auto',
  shortcutKeyMap: cloneDeep(DefaultShortcutKeyMap),
  first: true,
  firstTime: Date.now(),
  load: false,
  conflictNotice: true,
  ignoreSimpleWord: false,
  wordPracticeMode: 0,
  disableShowPracticeSettingDialog: false,
  autoNextWord: true
})

export const useSettingStore = defineStore('setting', {
  state: (): SettingState => {
    return getDefaultSettingState()
  },
  actions: {
    setState(obj: any) {
      this.$patch(obj)
    },
    init() {
      return new Promise(async resolve => {
        //TODO 后面记得删除了
        let configStr = localStorage.getItem(SAVE_SETTING_KEY.key)
        let configStr2 = await get(SAVE_SETTING_KEY.key)
        if (configStr2) {
          //兼容localStorage.getItem
          configStr = configStr2
        }
        let data = checkAndUpgradeSaveSetting(configStr)
        this.setState({...data, load: true})
        // this.load = true
        resolve(true)
      })
    }
  }
})
