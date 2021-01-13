import { ipcRenderer } from 'electron';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import DB from './plugins/database';
import '@mdi/font/css/materialdesignicons.css';
import './assets/style/main.scss';

Vue.config.productionTip = false;
Vue.use(DB);

ipcRenderer.on('get-platform-reply', (event, platform) => {
  Vue.prototype.$platform = platform;
});

ipcRenderer.send('get-platform');

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
