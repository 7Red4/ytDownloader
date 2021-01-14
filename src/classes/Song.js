export default class Song {
  constructor(song) {
    const now = Date.now();
    this.id = now;
    const { start, end, length, tag, src, ytId } = song;
    this.start = start;
    this.src = src;
    this.ytId = ytId;
    this.end = end;
    this.length = length;
    this.tag = tag;
  }

  id = '';
  src = '';
  ytId = '';
  length = 0;
  start = 0;
  end = 0;
  tag = '';
}
