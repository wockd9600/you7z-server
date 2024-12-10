export class GameSongDto {
  id: number;
  url: string;
  startTime: number;

  constructor(data: { song_id: number; url: string; start_time: string }) {
    const { song_id, url, start_time } = data;
    this.id = song_id;
    this.url = url;
    if (typeof start_time === 'string') {
      const [hours, minutes, seconds] = start_time.split(':').map(Number);
      this.startTime = hours * 3600 + minutes * 60 + seconds;
    } else {
      this.startTime = start_time;
    }
  }
}
