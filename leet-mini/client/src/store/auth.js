import { create } from 'zustand';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:4000';
axios.defaults.withCredentials = true;

const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  loadToken: () => {
    const t = localStorage.getItem('token');
    if (t) {
      set({ token: t });
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + t;
      get().fetchMe();
    }
  },
  setToken: (t) => {
    if (t) {
      localStorage.setItem('token', t);
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + t;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
    set({ token: t });
  },
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null });
  },
  fetchMe: async () => {
    try {
      const { data } = await axios.get('/api/me');
      set({ user: data });
    } catch (e) {
      console.error(e);
    }
  },
}));

export default useAuthStore;