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
    playLists: {
      /*
        [ title: String ]: Array<Song>
      */
    },
    playingList: []
  }),
  getters: {
    getSourceById: state => id => state.playSources[id],
    getSongById: state => id => state.songs[id],
    getSongsBySourceId: state => ytId => state.playSourcesSongMap[ytId],
    getCurrentPlayingIdx: state =>
      state.playingList.findIndex(({ id }) => id === state.currentPlaying.id),

    getPlaySources: state => state.playSources,
    getSongs: state => state.songs,
    getPlaySourcesSongMap: state => state.playSourcesSongMap,
    getCurrentPlaying: state => state.currentPlaying,
    getPlayingList: state => state.playingList,
    getPlayLists: state => state.playLists
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
    setCurrentPlaySong(state, song) {
      state.currentPlaying = song;
    },
    deleteSong(state, song) {
      this._vm.$delete(state.songs, song.id);
      let targetIndex = null;
      state.playSourcesSongMap[song.ytId].find(({ id }, index) => {
        if (id === song.id) {
          targetIndex = index;
          return true;
        }
      });
      state.playSourcesSongMap[song.ytId].splice(targetIndex, 1);
    }
  },
  actions: {
    SET_PLAY_SOURCE({ commit }, source) {
      commit('setPlaySource', source);
    },
    SET_SONG({ commit }, song) {
      commit('setSong', song);
    },
    SET_CURRENT_PLAY_SONG({ commit }, song) {
      commit('setCurrentPlaySong', song);
    },

    DELETE_SONG({ commit }, song) {
      commit('deleteSong', song);
    }
  }
};

export default PlayerState;
