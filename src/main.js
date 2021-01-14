import { ipcRenderer } from 'electron';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import DB from './plugins/database';
import '@mdi/font/css/materialdesignicons.css';
import './assets/style/main.scss';

function parseYtId(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
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

Vue.config.productionTip = false;
Vue.use(DB);
Vue.prototype.$pyt = parseYtId;
Vue.prototype.$hms2s = hms2s;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
