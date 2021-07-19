import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const DB = {
  install(Vue, options) {
    if (!options) {
      options = { name: 'db.json' };
    }

    const dbPath = options.name;
    const adapter = new FileSync(dbPath);
    const db = lowdb(adapter);
    db.defaults({}).write();

    Vue.prototype.$db = db;
  }
};

export default DB;
