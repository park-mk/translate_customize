import React from 'react';
import styled from 'styled-components';
import ArtplayerComponent from 'artplayer-react';
import { BrowserRouter  as Router, Switch, Route  ,useParams, useLocation } from "react-router-dom"; 
const Player = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120%;
    width: 100%;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.5);
`;

const databaseURL="https://subtitle-8b238.firebaseio.com/";

export default React.memo(



    function({ options, setPlayer, setCurrentTime , setOption}) {

        let location = useLocation();


      console.log(" this is player")
        return (
            <Player>
                <ArtplayerComponent
                   
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    option={{
                        url:options.videoUrl ,
                        // options.videoUrl,
                        //firevideo,
                        loop: true,
                        autoSize: false,
                        aspectRatio: true,
                        
                        playbackRate: true,
                        fullscreen: true,
                        fullscreenWeb: true,
                        miniProgressBar: true,
                        subtitle: {
                            url: options.subtitleUrl,
                        },
                        moreVideoAttr: {
                            crossOrigin: 'anonymous',
                            preload: 'auto',
                        },
                        muted: false,
                        autoplay: false,
                      
                        autoSize: true,
                      
                        setting: true,
                        loop: true,
                        playbackRate: true,
                        aspectRatio: true,
                        fullscreen: true,
                        fullscreenWeb: true,
                        mutex: true,
                    }}
                    getInstance={art => {
                       
                        art.url="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                          console.log(`${databaseURL}/video${location.pathname.substring(0,location.pathname.length)}.json`,"compare")
                        fetch(`${databaseURL}/video${location.pathname.substring(0,location.pathname.length)}.json`).then(res =>{
                            if (res.status!=200){
                                throw new Error (res.statusText)
                            }
                            return res.json();
                        } 
                        ).then(words=>{ 
                            
                             console.log(words.url,"fufufufufck")
                             art.url=words.url;
                           
                             art.subtitle.switch( words.vtt);
                           
                             let  vtturl=words.vtt
                             //setOption({  vtturl});
                             setPlayer(art);

                             (function loop() {
                                 window.requestAnimationFrame(() => {
                                     if (art.playing) {
                                         setCurrentTime(art.currentTime);
                                     }
                                     loop();
                                 });
                             })();
     
                             art.on('seek', () => {
                                 setCurrentTime(art.currentTime);
                             });
                          } , );
                      
                    }}
                />
                {

                }
            </Player>
           
        );
    },
    () => true,
);
