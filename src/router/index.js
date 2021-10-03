import Vue from 'vue';
import VueRouter from 'vue-router';
import Downloader from '../views/Downloader.vue';
import Player from '../views/Player.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Downloader',
    component: Downloader
  }
  // {
  //   path: '/Player',
  //   name: 'Player',
  //   component: Player
  // }
];

const router = new VueRouter({
  routes
});

export default router;
