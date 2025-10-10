import http from "@/utils/http.ts";

export function officialList() {
  return http('dict/officialList', null, null, 'get')
}