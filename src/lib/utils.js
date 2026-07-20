export const API_BASE = "";

export const imgSrc = (path) =>
  path ? `${API_BASE}/images/${path}` : 'https://placehold.co/155x220/1f293d/38bdf8?text=No+Cover';

export const getDayName = () => {
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return days[new Date().getDay()];
};

export const allGenres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Harem', 
  'Historical', 'Horror', 'Isekai', 'Josei', 'Martial Arts', 'Mecha', 'Military', 
  'Music', 'Mystery', 'Parody', 'Psychological', 'Romance', 'School', 'Sci-Fi', 
  'Seinen', 'Shoujo', 'Shounen', 'Slice of Life', 'Sports', 'Super Power', 
  'Supernatural', 'Thriller', 'Vampire'
];

export const makeSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};
