import React from 'react';
import styled from 'styled-components';
import ArtplayerComponent from 'artplayer-react';

const Player = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120%;
    width: 100%;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.5);
`;

export default React.memo(
    function({ options, setPlayer, setCurrentTime }) {
        return (
            <Player>
                <ArtplayerComponent
                   
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    option={{
                        url: options.videoUrl,
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
                    }}
                />
            </Player>
        );
    },
    () => true,
);
