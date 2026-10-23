import albumCover1 from "@/assets/album-cover-1.jpg";
import albumCover2 from "@/assets/album-cover-2.jpg";
import albumCover3 from "@/assets/album-cover-3.jpg";
import albumCover4 from "@/assets/album-cover-4.jpg";
import artistAvatar from "@/assets/artist-avatar.jpg";
import artistCover from "@/assets/artist-cover.jpg";
import eventVenue from "@/assets/event-venue.jpg";

export const newReleases = [
  { id: 1, title: "Sangue e Fogo", artist: "Infernus BR", cover: albumCover1, genre: "Death Metal" },
  { id: 2, title: "Chamas do Caos", artist: "Vortex", cover: albumCover2, genre: "Thrash Metal" },
  { id: 3, title: "Revolta Urbana", artist: "Colapso", cover: albumCover3, genre: "Punk" },
  { id: 4, title: "Escuridão", artist: "Noite Eterna", cover: albumCover4, genre: "Black Metal" },
  { id: 5, title: "Raízes do Metal", artist: "Terra Morta", cover: albumCover1, genre: "Power Metal" },
  { id: 6, title: "Gritos Silenciosos", artist: "Sombra", cover: albumCover2, genre: "Goth" },
];

export const events = [
  { id: 1, title: "Rock in Rio BR", date: "15 Mar 2026", location: "São Paulo, SP", image: eventVenue },
  { id: 2, title: "Metal Open Air", date: "22 Abr 2026", location: "Curitiba, PR", image: eventVenue },
  { id: 3, title: "Punk Underground Fest", date: "10 Mai 2026", location: "Porto Alegre, RS", image: eventVenue },
  { id: 4, title: "Gothic Night", date: "05 Jun 2026", location: "Belo Horizonte, MG", image: eventVenue },
];

export const artists = [
  { id: "infernus-br", name: "Infernus BR", genre: "Death Metal", avatar: artistAvatar, cover: artistCover, followers: "125K" },
  { id: "vortex", name: "Vortex", genre: "Thrash Metal", avatar: artistAvatar, cover: artistCover, followers: "89K" },
  { id: "colapso", name: "Colapso", genre: "Punk", avatar: artistAvatar, cover: artistCover, followers: "67K" },
  { id: "noite-eterna", name: "Noite Eterna", genre: "Black Metal", avatar: artistAvatar, cover: artistCover, followers: "45K" },
  { id: "terra-morta", name: "Terra Morta", genre: "Power Metal", avatar: artistAvatar, cover: artistCover, followers: "92K" },
  { id: "sombra", name: "Sombra", genre: "Goth", avatar: artistAvatar, cover: artistCover, followers: "34K" },
  { id: "furia-cega", name: "Fúria Cega", genre: "Hard Rock", avatar: artistAvatar, cover: artistCover, followers: "110K" },
  { id: "caos-urbano", name: "Caos Urbano", genre: "Nu-Metal", avatar: artistAvatar, cover: artistCover, followers: "78K" },
  { id: "eclipse-negro", name: "Eclipse Negro", genre: "Symphonic Metal", avatar: artistAvatar, cover: artistCover, followers: "56K" },
  { id: "deserto", name: "Deserto", genre: "Alternative", avatar: artistAvatar, cover: artistCover, followers: "143K" },
  { id: "cinzas", name: "Cinzas", genre: "Emo", avatar: artistAvatar, cover: artistCover, followers: "61K" },
  { id: "abismo", name: "Abismo", genre: "Metal", avatar: artistAvatar, cover: artistCover, followers: "88K" },
];

export const genreFilters = [
  "Todos",
  "Metal",
  "Death Metal",
  "Thrash Metal",
  "Black Metal",
  "Power Metal",
  "Symphonic Metal",
  "Nu-Metal",
  "Emo",
  "Punk",
  "Goth",
  "Hard Rock",
  "Alternative",
];

export const topSingles = [
  { id: 1, title: "Sangue e Fogo", artist: "Infernus BR", cover: albumCover1, plays: "1.2M" },
  { id: 2, title: "Chamas do Caos", artist: "Vortex", cover: albumCover2, plays: "980K" },
  { id: 3, title: "Revolta Urbana", artist: "Colapso", cover: albumCover3, plays: "750K" },
  { id: 4, title: "Escuridão", artist: "Noite Eterna", cover: albumCover4, plays: "620K" },
  { id: 5, title: "Raízes do Metal", artist: "Terra Morta", cover: albumCover1, plays: "540K" },
];

export const newSingles = [
  { id: 1, title: "Fúria Infinita", artist: "Fúria Cega", cover: albumCover3, plays: "45K" },
  { id: 2, title: "Caos Total", artist: "Caos Urbano", cover: albumCover4, plays: "38K" },
  { id: 3, title: "Eclipse", artist: "Eclipse Negro", cover: albumCover1, plays: "32K" },
  { id: 4, title: "Deserto Interior", artist: "Deserto", cover: albumCover2, plays: "28K" },
  { id: 5, title: "Cinzas Vivas", artist: "Cinzas", cover: albumCover3, plays: "22K" },
];

export const newsItems = [
  { id: 1, title: "Infernus BR anuncia nova turnê pelo Brasil em 2026", image: eventVenue, category: "Turnê", date: "2 dias atrás", comments: 14 },
  { id: 2, title: "Festival Metal Open Air revela lineup completo", image: eventVenue, category: "Festival", date: "3 dias atrás", comments: 28 },
  { id: 3, title: "Vortex lança clipe oficial de 'Chamas do Caos'", image: eventVenue, category: "Lançamento", date: "5 dias atrás", comments: 9 },
];

export const artistDetail = {
  id: "infernus-br",
  name: "Infernus BR",
  genre: "Death Metal",
  avatar: artistAvatar,
  cover: artistCover,
  followers: "125K",
  bio: "Infernus BR é uma das maiores bandas de death metal do Brasil, formada em 2010 em São Paulo. Com riffs pesados e letras viscerais, o grupo se tornou referência no cenário underground nacional, levando o metal brasileiro para festivais internacionais.",
  tracks: [
    { id: 1, title: "Sangue e Fogo", duration: "4:02", album: "Inferno Eterno", cover: albumCover1 },
    { id: 2, title: "Ritual Sombrio", duration: "5:18", album: "Inferno Eterno", cover: albumCover1 },
    { id: 3, title: "Cinzas da Guerra", duration: "3:45", album: "Destruição", cover: albumCover4 },
    { id: 4, title: "Abismo Infinito", duration: "6:22", album: "Destruição", cover: albumCover4 },
    { id: 5, title: "Tempestade de Aço", duration: "4:55", album: "Inferno Eterno", cover: albumCover1 },
  ],
  videos: [
    { id: "dQw4w9WgXcQ", title: "Sangue e Fogo (Official)" },
    { id: "dQw4w9WgXcQ", title: "Ritual Sombrio (Live)" },
    { id: "dQw4w9WgXcQ", title: "Making Of - Inferno Eterno" },
    { id: "dQw4w9WgXcQ", title: "Cinzas da Guerra (Lyric Video)" },
  ],
  comments: [
    { id: 1, user: "MetalHead99", text: "Melhor banda de death metal do Brasil! 🤘", date: "2 dias atrás" },
    { id: 2, user: "RockFan_SP", text: "O show em SP foi insano, esperando o próximo!", date: "5 dias atrás" },
    { id: 3, user: "DarkSoul", text: "Ritual Sombrio é a melhor faixa do álbum.", date: "1 semana atrás" },
  ],
};
