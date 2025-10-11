import http from "@/utils/http.ts";
import { Dict } from "@/types/types.ts";

export function dictListVersion() {
  return http<number>('dicts/dictListVersion', null, null, 'get')
}

export function myDictList() {
  return http('dicts/myDictList', null, null, 'get')
}

export function add2MyDict(data) {
  return http('dicts/add2MyDict', null, data, 'get')
}

export function addStat(data) {
  return http('dicts/addStat', data, null, 'post')
}

export function detail(params?, data?) {
  return http<Dict>('dicts/detail', data, params, 'get')
}

export function setDictProp(params?, data?) {
  return http<Dict>('dicts/setDictProp', data, params, 'post')
}
