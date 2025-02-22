import {DependencyList} from "react";
import { useAsync } from "./useAsync.ts";

function useFetch<T, E>(url: string, options: RequestInit = {}, dependencies: DependencyList = []) {
  return useAsync<T, E>(async (): Promise<T> => {
    return fetch(url, { ...options })
      .then(res => {
      if (res.ok) return res.json()
      return res.json().then(json => Promise.reject(json))
    })
  }, dependencies)
}

export { useFetch }