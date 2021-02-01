const QueState = {
  state: () => ({
    queList: [],
    showQue: false
  }),

  getters: {
    getQueList: state => state.queList,
    getQueById: state => queId => state.queList.find(({ id }) => id === queId),
    getShowQue: state => state.showQue
  },

  mutations: {
    setShowQue(state, show) {
      state.showQue = show;
    },
    setQue(state, que) {
      state.queList.push(que);
    },
    deleteQue(state, que) {
      const targetIdx = queList.findIndex(({ id }) => id === que.id);
      if (targetIdx > -1) {
        state.queList.splice(targetIdx, 1);
      }
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
    DELETE_QUE({ commit }, que) {
      commit('deleteQue', que);
    }
  }
};

export default QueState;
