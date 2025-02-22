import {DependencyList, useCallback, useEffect, useState} from "react"

function useAsync<T, E>(callback: () => Promise<T>, dependencies: DependencyList = []) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<E>()
  const [value, setValue] = useState<T>()

  const callbackMemoized = useCallback(() => {
    setLoading(true)
    setError(undefined)
    setValue(undefined)
    callback()
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false))
  }, dependencies)

  useEffect(() => {
    callbackMemoized()
  }, [callbackMemoized])

  return { loading, error, value, setValue, setLoading, setError }
}

export { useAsync }