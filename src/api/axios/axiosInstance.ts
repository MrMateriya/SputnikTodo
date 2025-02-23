import axios from "axios";

const BackendAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  baseURL: import.meta.env.VITE_API_URL,
})

export { BackendAxios }