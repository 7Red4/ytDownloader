const QueState = {
  state: () => ({
    queList: {},
    showQue: false
  }),

  getters: {
    getQueList: state => Object.values(state.queList),
    getQueById: state => queId => state.queList[queId],
    getShowQue: state => state.showQue
  },

  mutations: {
    setShowQue(state, show) {
      state.showQue = show;
    },
    setQue(state, que) {
      this._vm.$set(state.queList, que.id, que);
    },
    deleteQue(state, queId) {
      this._vm.$delete(state.queList, queId);
    }
  },

  actions: {
    SET_SHOW_QUE({ commit }, show) {
      commit('setShowQue', show);
    },
    TOGGLE_SHOW_QUE({ state, commit }) {
      commit('setShowQue', !state.showQue);
    },
    SET_QUE({ commit }, que) {
      commit('setQue', que);
    },
    DELETE_QUE({ commit }, queId) {
      commit('deleteQue', queId);
    }
  }
};

export default QueState;
