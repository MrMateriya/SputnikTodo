import axios from "axios";

const retryDelayMS = 0;

const BackendAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  baseURL: import.meta.env.VITE_API_URL,
})

BackendAxios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        //test
        error.config.url = '/tasks'
        resolve(await axios.request(error.config))
      } catch (e) {
        reject(error)
      }
    }, retryDelayMS)
  })
});

export { BackendAxios }