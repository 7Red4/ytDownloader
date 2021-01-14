const PlayerState = {
  state: () => ({
    playSources: {},
    songs: {},
    playSourcesSongMap: {
      /*
        [ ytId: String ]: Array<Song>
      */
    },

    currentPlaying: null,
    playList: [],
    playingList: []
  }),
  getters: {
    getSourceById: state => id => state.playSources[id],
    getSongById: state => id => state.songs[id],
    getSongsBySourceId: state => ytId => state.playSourcesSongMap[ytId],

    getPlaySources: state => state.playSources,
    getSongs: state => state.songs,
    getPlaySourcesSongMap: state => state.playSourcesSongMap,
    getCurrentPlaying: state => state.currentPlaying,
    getPlayingList: state => state.playingList,
    getPlayList: state => state.playList
  },
  mutations: {
    setPlaySource(state, source) {
      this._vm.$set(state.playSources, source.id, source);
    },
    setSong(state, song) {
      // { ytId, src, start, end, length, tag, id } => Song;
      this._vm.$set(state.songs, song.id, song);

      if (state.playSourcesSongMap[song.ytId]) {
        state.playSourcesSongMap[song.ytId].push(song);
      } else {
        this._vm.$set(state.playSourcesSongMap, song.ytId, [song]);
      }
    },
    setCurrentPlaySong(state, source) {
      state.currentPlaying = source;
    }
  },
  actions: {
    SET_PLAY_SOURCE({ commit }, source) {
      commit('setPlaySource', source);
    },
    SET_SONG({ commit }, song) {
      commit('setSong', song);
    },
    SET_CURRENT_PLAY_SONG({ commit }, source) {
      commit('setCurrentPlaySong', source);
    }
  }
};

export default PlayerState;
