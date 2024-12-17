export class GameSongDto {
  id: number;
  url: string;
  startTime: number;

  constructor(data: { songId: number; url: string; startTime: string }) {
    const { songId, url, startTime } = data;
    this.id = songId;
    this.url = url;
    if (typeof startTime === 'string') {
      const [hours, minutes, seconds] = startTime.split(':').map(Number);
      this.startTime = hours * 3600 + minutes * 60 + seconds;
    } else {
      this.startTime = startTime;
    }
  }
}
