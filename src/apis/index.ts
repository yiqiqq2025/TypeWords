import http from "@/utils/http.ts";

export function officialList() {
  return http('dicts/officialList', null, null, 'get')
}

export function dictListVersion() {
  return http<number>('dicts/dictListVersion', null, null, 'get')
}
