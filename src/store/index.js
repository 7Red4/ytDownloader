import Vue from 'vue';
import Vuex from 'vuex';
import PlayerState from './modules/PlayerState';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    PlayerState
  },
  state: {},
  mutations: {},
  actions: {}
});
