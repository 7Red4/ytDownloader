import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import './plugins/database';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

const customTitlebar = require('custom-electron-titlebar');
const titlebar = new customTitlebar.Titlebar();

Vue.config.productionTip = false;
Vue.prototype.$titlebar = titlebar;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
