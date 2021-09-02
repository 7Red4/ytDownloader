import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import DB from './plugins/database';

import '@/assets/style/main.scss';

import './GlobalComponentsInject.js';

function parseYtId(url) {
  var regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : false;
}

function hms2s(str) {
  str = `${str}`;
  const p = str.split(':');
  let s = 0;
  let m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }

  return s;
}

function s2hms(str) {
  if (!str) return '00:00:00';
  return new Date(str * 1000).toISOString().substr(11, 8);
}

Vue.config.productionTip = false;
Vue.use(DB);
Vue.prototype.$pyt = parseYtId;
Vue.prototype.$hms2s = hms2s;
Vue.prototype.$s2hms = s2hms;

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount('#app');

let callStackCounter = 0;

Vue.config.errorHandler = (err, vm, info) => {
  if (callStackCounter >= 60) {
    callStackCounter = 0;
    return;
  }
  console.log({ err, vm, info });
  store.dispatch('SET_ERROR', { err, info });
  callStackCounter++;
};
