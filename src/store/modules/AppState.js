import Vue from 'vue';

const AppState = {
  state: () => ({
    error: null
  }),

  getters: {
    getError: (state) => state.error
  },

  mutations: {
    setError(state, error) {
      state.error = error;
    }
  },

  actions: {
    SET_ERROR({ commit }, error) {
      commit('setError', error);
    }
  }
};

export default AppState;
