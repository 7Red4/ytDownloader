const QueState = {
  state: () => ({
    queList: []
  }),

  getters: {
    getQueList: state => state.queList,
    getQueById: state => queId => state.queList.find(({ id }) => id === queId)
  },

  mutations: {
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
    SET_QUE({ commit }, que) {
      commit('setQue', que);
    },
    DELETE_QUE({ commit }, que) {
      commit('deleteQue', que);
    }
  }
};

export default QueState;
