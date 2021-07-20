import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
const appRootDir = require('app-root-dir').get();
import PATH from 'path';

const DB = {
  install(Vue, options) {
    if (!options) {
      options = { name: PATH.join(appRootDir, 'db.json') };
    }

    const dbPath = options.name;
    const adapter = new FileSync(dbPath);
    const db = lowdb(adapter);
    db.defaults({}).write();

    Vue.prototype.$db = db;
  }
};

export default DB;
