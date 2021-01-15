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
    playingListIds: []
  }),
  getters: {
    getSourceById: state => id => state.playSources[id],
    getSongById: state => id => state.songs[id],
    getPlayListById: state => id => state.playLists[id],
    getSongsBySourceId: state => ytId => state.playSourcesSongMap[ytId],
    getCurrentPlayingIdx: state =>
      state.playingListIds.findIndex(id => id === state.currentPlaying.id),

    getPlaySources: state =>
      Object.keys(state.playSources).length ? state.playSources : null,
    getSongs: state => (Object.keys(state.songs).length ? state.songs : null),
    getPlaySourcesSongMap: state =>
      Object.keys(state.playSourcesSongMap).length
        ? state.playSourcesSongMap
        : null,
    getCurrentPlaying: state => state.currentPlaying,
    getPlayingListIds: state => state.playingListIds,
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
    setPlayingListIds(state, songIds) {
      this._vm.$set(state, 'playingListIds', songIds);
    },
    setCurrentPlaySong(state, song) {
      state.currentPlaying = song;
    },

    addSongToList(state, { listId, songId }) {
      if (state.playLists[listId].songs.indexOf(songId) < 0) {
        state.playLists[listId].songs.push(songId);
      }
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
      this._vm.$delete(state.playLists, playList.id);
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
    SET_PLAYING_LIST_IDS({ commit }, songIds) {
      commit('setPlayingListIds', songIds);
    },
    SET_CURRENT_PLAY_SONG({ commit }, song) {
      commit('setCurrentPlaySong', song);
    },

    ADD_SONG_TO_LIST({ commit }, { listId, songId }) {
      commit('addSongToList', { listId, songId });
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
