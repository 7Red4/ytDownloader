import Vue from 'vue';
import Vuex from 'vuex';
import AppState from './modules/AppState';
import QueState from './modules/QueState';
import PlayerState from './modules/PlayerState';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    AppState,
    QueState,
    PlayerState
  },
  state: {},
  mutations: {},
  actions: {}
});
