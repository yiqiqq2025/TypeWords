import http from "@/utils/http.ts";
import { Dict } from "@/types/types.ts";
import { cloneDeep } from "@/utils";

function remove(data?: any) {
  if (data) {
    let s = cloneDeep(data)
    delete s.words
    delete s.articles
    delete s.statistics
    return s;
  }
}

export function dictListVersion() {
  return http<number>('dicts/dictListVersion', null, null, 'get')
}

export function myDictList(params?) {
  return http('dicts/myDictList', null, params, 'get')
}

export function add2MyDict(data) {
  return http('dicts/add2MyDict', remove(data), null, 'post')
}

export function addStat(data) {
  return http('dicts/addStat', data, null, 'post')
}

export function detail(params?, data?) {
  return http<Dict>('dicts/detail', data, params, 'get')
}

export function setDictProp(params?, data?) {
  return http<Dict>('dicts/setDictProp', remove(data), remove(params), 'post')
}
