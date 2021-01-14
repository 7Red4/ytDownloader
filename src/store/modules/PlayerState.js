import Vue from 'vue';

const PlayerState = {
  state: () => ({
    currentPlaying: null,
    playList: [],
    playingList: [],
    playSources: {},
    playSourcesTimeTagMap: {}
  }),
  getters: {
    getSourceById: state => id => state.playSources[id],
    getSourceByYtUrl: state => ytUrl =>
      Object.values(state.playSources).find(({ url }) => url === ytUrl),
    getPlaySources: state => state.playSources,
    getPlayingList: state => state.playingList,
    getCurrentPlaying: state => state.currentPlaying
  },
  mutations: {
    setPlaySource(state, source) {
      console.log(this);
      this._vm.$set(state.playSources, source.id, source);
    },
    setCurrentPlaySource(state, source) {
      state.currentPlaying = source;
    }
  },
  actions: {
    SET_PLAY_SOURCE({ commit }, source) {
      commit('setPlaySource', source);
    },
    SET_CURRENT_PLAYSOURCE({ commit }, source) {
      commit('setCurrentPlaySource', source);
    }
  }
};

export default PlayerState;
