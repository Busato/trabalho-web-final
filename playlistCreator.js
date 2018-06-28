var SpotifyWebApi = require('spotify-web-api-node');

async function createPlaylist(access_token, refresh_token, userID, artistName) {

    if (artistName === undefined){
		console.log('	Oops! Lembre de adicionar o nome de um artista!')
		return;
		}

		// name of the playlist, optional parameter
		var playlistName = "Trabalho web playlist: "+ artistName;
		var allTracks = [];
		var artists = [];

		//credentials are optional
		var spotifyApi = new SpotifyWebApi({
			clientId: '1d25415827b549e882f3866440a1b25b',
			clientSecret: '1bf119b6a01d4ffe9b06ea9c1aa4b5ca',
			redirectUri: 'http://localhost:8888/callback/'
		});

		// Set access and refresh token for request
		spotifyApi.setAccessToken(access_token);
		spotifyApi.setRefreshToken(refresh_token);

		// Search artist info
		const artistsSearched = await spotifyApi.searchArtists(artistName);
		if (artistsSearched.body.artists.items[0] === undefined) {
			console.log('Oops! O nome deste artista não existe!')
			return;
		}
		// Get artist URI
		const artistURI = artistsSearched.body.artists.items[0].uri.slice(15);

		// get artist top tracks
		let artistTopTracks = await spotifyApi.getArtistTopTracks(artistURI, 'CA');
		artistTopTracks = artistTopTracks.body.tracks;
		for (let artistTrack of artistTopTracks) {
			allTracks.push(artistTrack.uri);
		}

		// get three related artists
		let relatedArtists = await spotifyApi.getArtistRelatedArtists(artistURI);
		relatedArtists = relatedArtists.body.artists;
		for (var i=0;i<3;i++){
			if (relatedArtists[i] !== undefined) {
				var currentArtist = relatedArtists[i].uri;
				artists.push(currentArtist.slice(15));
			}
		}

		for (let i = 0; i < Math.min(artists.length, 2); i++) {
		  let artist = await spotifyApi.getArtistTopTracks(artists[i], 'CA');
		  if (!artist || !artist.body || !artist.body.tracks)
		    continue
		  let { tracks } = artist.body;
		  for (let j = 0; j < Math.min(tracks.length, 3); j++) {
		    if (tracks[j] && tracks[j].uri)
		      allTracks.push(tracks[j].uri)
		  }
		}

	// Create a private playlist
	const playlistCreated = await spotifyApi.createPlaylist(userID, playlistName, { 'public' : false })
	
	const playlistID = playlistCreated.body.id;

	// Add tracks to a playlist
	const responsePlaylist = await spotifyApi.addTracksToPlaylist(userID , playlistID, allTracks);

	return responsePlaylist.statusCode;
}

module.exports.createPlaylist = createPlaylist;
