//userpage client gets user data and displays it
window.onload = function(){
  //playlists object
  var playlists;

  //get access token from url
  const urlParams = new URLSearchParams(window.location.search);
  const access = urlParams.get('u');

  //get playlists
  $.get(getURL("playlists", access), function(data){
    playlists = data.items; //set playlists variable to playlists received from server
    for(var i = 0; i < playlists.length; i++){
      $("select").append("<option data-playlist='"+playlists[i].id+"' data-id='"+i+"'>"+playlists[i].name+"</option>");
    }
    $("#go").click("on", function(){//start clean on click
      //find selected dropdown option
      var dropdown = document.getElementsByTagName("select")[0];
      var selected = dropdown.options[dropdown.selectedIndex];

      //get tracks for selected playlist
      var playlist = playlists[selected.getAttribute("data-id")];
      $.get(getURL("playlist", access)+"&id="+playlist.id, function(data){
        var page = data.tracks;
        var tracks = page.items;
        
        //function to add tracks beyond cap of 100
        function nextTracks(offset){
          $.get(getURL('tracks', access)+"&id="+playlist.id+"&offset="+offset, function(data){//get next paging object
            var page = data;//store new paging object
            tracks = tracks.concat(page.items); //add tracks in next to original tracks array
            if(page.next!=null){ //continue to do so until there are no more next paging objects
              nextTracks(offset + 100)
            }
            else{ //if there are no more tracks, continue with creation
              cont()
            }
          });
        }

        function cont(){//make and populate new playlist
          $.get(getURL("create", access)+"&name="+playlist.name + " (Clean)", function(data){
            var playlistID = data.id;
            checkTrack(access, playlistID, tracks, 0);//begin loop through tracks
          });
        }

        if(page.next != null){//if there are more tracks, call next tracks and begin looping pages
          nextTracks(100)
        }
        else{//otherwise continue with creation
          cont()
        }
      })
    })
  });
}

function checkTrack(access, playlistID, tracks, index){
  if(index < tracks.length){
    var track = tracks[index].track;
    //add track function
    function addTrack(track){
      var id = track.id;
      $.get(getURL("addtrack", access)+"&trackid="+id+"&playlistid="+playlistID, function(data){
       $("#yeet").append(track.name).scrollTop($(this)[0].scrollHeight);
       //wait before moving on to next track to avoid internal server errors
       setTimeout(function(){checkTrack(access, playlistID, tracks, index+1)}, 100);
      })
    }

    if(track.explicit){//if track is explicit, search for clean versions on backend
      var name = track.name;
      var artist = track.artists[0].name;
      //get search with info as queries
      $.get(getURL("search", access)+"&name="+name+"&artist="+artist, function(data){
        var results = data.items;
        
        //loop through search results for clean match
        var cleanFound = false;
        for(var i = 0; i < results.length; i++){
          if(!results[i].explicit && results[i].name == name && results[i].artists[0].name == artist){//if clean match, add to new playlist
            addTrack(results[i])
            cleanFound = true;
            break;
          }
        }
        if(!cleanFound){
          //TODO: cool animation of removal?
          setTimeout(function(){checkTrack(access, playlistID, tracks,index+1)}, 50);
        }
      })
    }
    else{
      addTrack(track);
    }
  }
  else{
    //TODO: confirm buttons
  }
}

function getURL(program, access){
  return "http://cleanify.mooo.com/"+program + "?u="+access;
}
