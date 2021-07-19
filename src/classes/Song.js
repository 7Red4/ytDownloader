export default class Song {
  constructor(song) {
    const now = Date.now();
    this.id = now;

    Object.keys(song).forEach((key) => {
      this[key] = song[key];
    });
  }

  id = '';
  src = '';
  ytId = '';
  title = '';
  author = '';
  length = 0;
  start = 0;
  end = 0;
  tag = '';
}
