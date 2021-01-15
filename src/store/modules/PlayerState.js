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
        [ id: String | Number ]: {
          id: String | Number,
          title: String,
          song: Array<Song>
        }
      */
    },
    playingList: []
  }),
  getters: {
    getSourceById: state => id => state.playSources[id],
    getSongById: state => id => state.songs[id],
    getPlayListById: state => id => state.playLists[id],
    getSongsBySourceId: state => ytId => state.playSourcesSongMap[ytId],
    getCurrentPlayingIdx: state =>
      state.playingList.findIndex(id => id === state.currentPlaying.id),

    getPlaySources: state =>
      Object.keys(state.playSources).length ? state.playSources : null,
    getSongs: state => (Object.keys(state.songs).length ? state.songs : null),
    getPlaySourcesSongMap: state =>
      Object.keys(state.playSourcesSongMap).length
        ? state.playSourcesSongMap
        : null,
    getCurrentPlaying: state => state.currentPlaying,
    getPlayingList: state => state.playingList,
    getPlayLists: state =>
      Object.keys(state.playLists).length ? state.playLists : null
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
    setPlayList(state, playList) {
      this._vm.$set(state.playLists, playList.id, playList);
    },
    setPlayingList(state, songs) {
      this._vm.$set(state, 'playingList', songs);
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
    },
    deletPlayList(state, playList) {
      this._vm.$delete(state.playList, playList.id);
    }
  },
  actions: {
    SET_PLAY_SOURCE({ commit }, source) {
      commit('setPlaySource', source);
    },
    SET_SONG({ commit }, song) {
      commit('setSong', song);
    },
    SET_PLAY_LIST({ commit }, playList) {
      commit('setPlayList', playList);
    },
    SET_PLAYING_LIST({ commit }, songs) {
      commit('setPlayingList', songs);
    },
    SET_CURRENT_PLAY_SONG({ commit }, song) {
      commit('setCurrentPlaySong', song);
    },

    DELETE_SONG({ commit }, song) {
      commit('deleteSong', song);
    },
    DELETE_PLAY_LIST({ commit }, playList) {
      commit('deletPlayList', playList);
    }
  }
};

export default PlayerState;
