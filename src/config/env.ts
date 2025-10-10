export const GITHUB = 'https://github.com/zyronon/TypeWords'
export const ProjectName = 'Type Words'
export const Host = '2study.top'
export const Origin = `https://${Host}`
export const APP_NAME = 'Type Words'

const common = {
  word_dict_list_version: 1
}
const map = {
  dev: {
    api: 'http://localhost/',
  }
}
export const env = Object.assign(map['dev'], common)

export const DICT_LIST = {
  WORD: {
    ALL: '/list/dict-list.json',
    RECOMMENDED: '/list/recommend-dict-list.json',
  },
  ARTICLE: {
    ALL: '/list/book-list.json',
    RECOMMENDED: '/list/book-list.json',
  }
}

export const SoundFileOptions = [
  {value: '机械键盘', label: '机械键盘'},
  {value: '机械键盘1', label: '机械键盘1'},
  {value: '机械键盘2', label: '机械键盘2'},
  {value: '老式机械键盘', label: '老式机械键盘'},
  {value: '笔记本键盘', label: '笔记本键盘'},
]
export const APP_VERSION = {
  key: 'type-words-app-version',
  version: 1
}
export const SAVE_DICT_KEY = {
  key: 'typing-word-dict',
  version: 4
}
export const SAVE_SETTING_KEY = {
  key: 'typing-word-setting',
  version: 15
}
export const EXPORT_DATA_KEY = {
  key: 'typing-word-export',
  version: 4
}
export const LOCAL_FILE_KEY = 'typing-word-files'
export const PracticeSaveWordKey = {
  key: 'PracticeSaveWord',
  version: 1
}
export const PracticeSaveArticleKey = {
  key: 'PracticeSaveArticle',
  version: 1
}