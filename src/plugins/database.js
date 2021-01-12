import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';
import { remote } from 'electron';
import Vue from 'vue';

const isDev = process.env.NODE_ENV === 'development';
const DB = {
  install(Vue, options) {
    if (!options) {
      options = { name: 'settings.json' };
    }

    let dbPath;
    if (isDev) {
      dbPath = options.name;
    } else {
      dbPath = path.join(remote.app.getPath('userData'), options.name);
    }
    const adapter = new FileSync(dbPath);
    const db = lowdb(adapter);
    db.defaults({}).write();

    Vue.prototype.$db = db;
  }
};

export default DB;

Vue.use(DB);
