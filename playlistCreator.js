 // test key = BQB2WUiRBw45E6gQ_gX0V3ccoTzMpWnjeIr0z7pz_ihADOWM6aqyvSuO7B8IZNlhM0gErVpv4jG__XRwUuL5NUw_mwYGFQiJdJCI7X1eKrdgrT9mrX_cdmt4OG2Yir8GO7B7g593RA5Dwf6hHDgKVWgX204tGPqI46snS0QoX31MKlU
var requirejs = require('requirejs');
 
const SpotifyWebApi = require('spotify-web-api-node');

const Conf = require('conf');
const pkg = require('./package.json');
  
async function createPlaylist() {

	const artistName = document.getElementById("artist-name").value;

        if (artistName === undefined){
            console.log('	Oops! Lembre de adicionar o nome de um artista!')
            process.exit;
		}

		// name of the playlist, optional parameter
		var playlistName = "Trabalho web playlist: "+artistName;

		var allTracks = [];
		var artists = [];

		const spotifyApi = new SpotifyWebApi();

		// get artist URI
		const artistSearch = await spotifyApi.searchArtists(artistName);

		console.log(artistSearch);
		// error check for invalid search
		
		if (artistSearch.body.artists.items[0] === undefined) {
			config.clear();
			console.log('Oops! That search didnt work. Try again please!');
			return;
		}
		let artistURI = artistSearch.body.artists.items[0].uri;
		artistURI = artistURI.slice(15);

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


		// create an empty public playlist
		var options = {
		  json: true, 
		  headers: {
		    'Content-type': 'application/json',
		    'Authorization' : `Bearer ${config.get('bearer')}`,
		    'Accept' : 'application/json'
		  },
		  body: JSON.stringify({ name: `${playlistName}`, public : true})
		};

		got.post(`https://api.spotify.com/v1/users/${config.get('username')}/playlists`, options)
		  .then(response => {
		    const playlistID = response.body.id;

				// function to add tracks to playlist
				function populatePlaylist (id, uris) {
					var url = `https://api.spotify.com/v1/users/${config.get('username')}/playlists/${id}/tracks?uris=${uris}`
					var options = {
					  json: true, 
					  headers: {
					    'Content-type': 'application/json',
					    'Authorization' : `Bearer ${config.get('bearer')}`,
					  }
					};
					got.post(url, options)
					  .then(response => {
					  	spinner.succeed('Success!');
					    console.log('Your playlist is ready! 	Its called "${playlistName}"');
					  })
					  .catch(err => { 
					  	spinner.fail('Failed');
					  	// don't need to reset config since credentials are correct at this point
					  	console.log('There was an error adding songs to the playlist. 	However, a playlist was created. 	Please try a different search.'); 
					  });
				}

				populatePlaylist(playlistID, allTracks);

		  })

		  .catch(async err => { 
		  	spinner.fail('Failed');
		  	config.clear();
		  	console.log('ERROR: Incorrect username or bearer token	You might need to update your bearer token Generate a new one at https://developer.spotify.com/web-api/console/post-playlists/ 	Try again!');
		});
			
}