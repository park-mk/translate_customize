import React, { useState, useMemo, useCallback, useEffect } from 'react';
import GlobalStyle from './GlobalStyle';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import Sub from '../subtitle/sub';
import clamp from 'lodash/clamp';
import { secondToTime, notify } from '../utils';
import { getSubFromVttUrl, vttToUrlUseWorker } from '../subtitle';
import Storage from '../utils/storage';
import isEqual from 'lodash/isEqual';
import NProgress from 'nprogress';
import { ToastContainer } from 'react-toastify';
import translate, { googleTranslate } from '../translate';
import { t, setLocale } from 'react-i18nify';
import ReactDOM from 'react-dom';
import { BrowserRouter  as Router, Switch, Route  ,useParams, useLocation } from "react-router-dom"; 

import { words } from 'lodash';



const history = [];
let inTranslation = false;
const storage = new Storage();
const worker = new Worker(vttToUrlUseWorker());
const databaseURL="https://subtitle-8b238.firebaseio.com/";

export default function() {
     
    let location = useLocation();
   
    

    // Player instance
    const [player, setPlayer] = useState(

       null
    );

    // Language
    const defaultLang = storage.get('language') || navigator.language.toLowerCase() || 'en';
    const [language, setLanguage] = useState(defaultLang);

    // Subtitle currently playing index
    const [currentIndex, setCurrentIndex] = useState(-1);

    // Subtitle currently playing time
    const [currentTime, setCurrentTime] = useState(0);

    // All subtitles
    const [subtitles, setSubtitles] = useState([]);
    const [refe_subtitles, refe_setSubtitles] = useState([]);
   

    // All options

    
    
    const [options, setOptions] = useState({
       
        videoUrl:
        "https://firebasestorage.googleapis.com/v0/b/subtitle-8b238.appspot.com/o/sample.mp4?alt=media&token=502e260d-6003-4eca-a9c2-7ea7ae8f5307",
         //location.pathname.substring(1,location.pathname.length),
        
      // window.location.href.slice(22),     
       //  Object.values(firebase[location.pathname.substring(1,location.pathname.length)]||"0")[2],
       //  mainvideo,
       
        subtitleUrl: '/sample.vtt',
        helpDialog: false,
        donateDialog: false,
        uploadDialog: false,
        translationLanguage: 'en',
    });
    // firebase
   
    const  url=  geturl();

   const [firevideo,setvideoo]=useState( 
       
      url
   );

   function geturl(){
  fetch(`${databaseURL}/video/0001/url.json`).then(res =>{
          if (res.status!=200){
              throw new Error (res.statusText)
          }
          return res.json();
      } 
      ).then(words=>{ 
           setvideoo(words);
         
                       
        } , );

  }
  
    


    // Update language
    const updateLang = useCallback(
        value => {
            setLocale(value);
            setLanguage(value);
            storage.set('language', value);
        },
        [setLanguage],
    );

    // Update an option
    const setOption = useCallback(
       
        option => {
            setOptions({
                ...options,
                ...option,
            });
         
        },
        [options, setOptions],
    );
      
    // Only way to update all subtitles
    const updateSubtitles = useCallback(
        (subs, saveToHistory = true) => {
            if (subs.length && !isEqual(subs, subtitles)) {
                setSubtitles(subs);

                // Save 100 subtitles to history
                if (saveToHistory) {
                    if (history.length >= 100) {
                        history.shift();
                    }
                    history.push(subs.map(sub => sub.clone));
                }

                // Save to storage
                storage.set('subtitles', subs);
               
                // Convert subtitles to vtt url
                worker.postMessage(subs);
            }
        },
        [setSubtitles, subtitles],
    );

    // Initialize subtitles from url or storage
    const initSubtitles = useCallback(async () => {
   
        const storageSubs = storage.get('subtitles');
        if (storageSubs && storageSubs.length) {
            updateSubtitles(storageSubs.map(item => new Sub(item.start, item.end, item.text,item.text2)));
        } else {
            const subs = await getSubFromVttUrl(options.subtitleUrl);
            updateSubtitles(subs);
        }
    }, [options.subtitleUrl, setSubtitles]);

    const initrefeSubtitles = useCallback(async () => {
      
            const subs = await getSubFromVttUrl(options.subtitleUrl);
            updateSubtitles(subs);
      
    }, [options.subtitleUrl, refe_setSubtitles]);

    // Run only once
    useEffect(() => {
        initSubtitles();
        openVideo();
      
        updateLang(language);
        if (player && !worker.onmessage) {
            worker.onmessage = event => {
                player.subtitle.switch(event.data);
              
               
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player]);

   const  openVideo =useCallback( ()=>{
       var file;
        if (file) {
   
        file="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
            NProgress.start().set(0.5);
            if (typeof file === 'string') {
                console.log("shut up")
               player.url = file;
                // setPlayer({url:file})
                setOption({ videoUrl: file, uploadDialog: false });
                notify(t('open-video-success'));
            } else {
                const $video = document.createElement('video');
                const canPlayType = $video.canPlayType(file.type);
                if (canPlayType === 'maybe' || canPlayType === 'probably') {
                    const videoUrl = URL.createObjectURL(file);
                    player.url = videoUrl;
                    setOption({ videoUrl: videoUrl, uploadDialog: false });
                    notify(t('open-video-success'));
                } else {
                    notify(t('open-video-error'), 'error');
                }
            }
            NProgress.done();
        }
    },
   [subtitles,setOption],);

    // Update current index from current time
    useMemo(() => {
        setCurrentIndex(subtitles.findIndex(item => item.startTime <= currentTime && item.endTime > currentTime));
    }, [subtitles, currentTime, setCurrentIndex]);

  
    // Detect if the subtitle exists
    const hasSubtitle = useCallback(sub => subtitles.indexOf(sub), [subtitles]);

    // Copy all subtitles
    const copySubtitles = useCallback(() => subtitles.map(sub => sub.clone), [subtitles]);

    // Check if subtitle is legal
    const checkSubtitle = useCallback(
        sub => {
            const index = hasSubtitle(sub);
            if (index < 0) return;
            const previous = subtitles[index - 1];
            return (previous && sub.startTime < previous.endTime) || !sub.check;
        },
        [hasSubtitle, subtitles],
    ); 
 
    // Update a single subtitle
    const updateSubtitle = useCallback(
        (sub, key, value) => {
           
            const index = hasSubtitle(sub);
            if (index < 0) return;
            const subs = copySubtitles();
            const { clone } = sub;
            if (typeof key === 'object') {
                Object.assign(clone, key);
            } else {
                clone[key] = value;
            }
            if (clone.check) {
                subs[index] = clone;
                updateSubtitles(subs);
            } else {
                notify(t('parameter-error'), 'error');
            }
            
        },
        [hasSubtitle, copySubtitles, updateSubtitles],
    );

    // Delete a subtitle
    const removeSubtitle = useCallback(
        sub => {
            const index = hasSubtitle(sub);
            if (index < 0) return;
            const subs = copySubtitles();
            if (subs.length === 1) {
                return notify(t('keep-one'), 'error');
            }
            subs.splice(index, 1);
            updateSubtitles(subs);
        },
        [hasSubtitle, copySubtitles, updateSubtitles],
    );

    // Add a subtitle
    const addSubtitle = useCallback(
        (index, sub) => {
            const subs = copySubtitles();
            if (sub) {
                subs.splice(index, 0, sub);
            } else {
                const previous = subs[index - 1];
                const start = previous ? secondToTime(previous.endTime + 0.1) : '00:00:00.001';
                const end = previous ? secondToTime(previous.endTime + 1.1) : '00:00:01.001';
                const sub = new Sub(start, end, t('subtitle-text'));
                subs.splice(index, 0, sub);
            }
            updateSubtitles(subs);
        },
        [copySubtitles, updateSubtitles],
    );

    // Merge two subtitles
    const mergeSubtitle = useCallback(
        sub => {
            const index = hasSubtitle(sub);
            if (index < 0) return;
            const subs = copySubtitles();
            const next = subs[index + 1];
            if (!hasSubtitle(next)) return;
            const merge = new Sub(sub.start, next.end, sub.text + '\n' + next.text);
            subs[index] = merge;
            subs.splice(index + 1, 1);
            updateSubtitles(subs);
        },
        [hasSubtitle, copySubtitles, updateSubtitles],
    );

    // Remove all subtitles
    const removeSubtitles = useCallback(() => {
        updateSubtitles([new Sub('00:00:00.000', '00:00:01.000', t('subtitle-text'))]);
    }, [updateSubtitles]);

    // Undo subtitles
    const undoSubtitles = useCallback(() => {
        if (history.length > 1) {
            history.pop();
            const subs = history[history.length - 1];
            updateSubtitles(subs, false);
            notify(t('history-rollback'));
        } else {
            notify(t('history-empty'), 'error');
        }
    }, [updateSubtitles]);

    // Subtitle time offset
    const timeOffsetSubtitles = useCallback(
        time => {
            const subs = copySubtitles();
            updateSubtitles(
                subs.map(item => {
                    item.start = secondToTime(clamp(item.startTime + time, 0, Infinity));
                    item.end = secondToTime(clamp(item.endTime + time, 0, Infinity));
                    return item;
                }),
            );
            notify(`${t('time-offset')} ${time * 1000}ms`);
        },
        [copySubtitles, updateSubtitles],
    );

    // Clean all subtitles
    const cleanSubtitles = useCallback(() => {
        history.length = 0;
        storage.set('subtitles', []);
        removeSubtitles();
        player.seek = 0;
        notify(t('clear-success'));
    }, [player, removeSubtitles]);

    // Translate a subtitle
    const translateSubtitle = useCallback(
        async sub => {
            if (!inTranslation) {
                const index = hasSubtitle(sub);
                if (index < 0) return;
                try {
                    inTranslation = true;
                    NProgress.start().set(0.5);
                    const text = await googleTranslate(sub.text, options.translationLanguage);
                    if (text) {
                        updateSubtitle(sub, 'text', text);
                        notify(t('translation-success'));
                    }
                    inTranslation = false;
                    NProgress.done();
                } catch (error) {
                    notify(error.message, 'error');
                    inTranslation = false;
                    NProgress.done();
                }
            } else {
                notify(t('translation-progress'), 'error');
            }
        },
        [hasSubtitle, updateSubtitle, options.translationLanguage],
    );

    // Translate all subtitles
    const translateSubtitles = useCallback(async () => {
        if (!inTranslation) {
            const subs = copySubtitles();
            if (subs.length && subs.length <= 1000) {
                inTranslation = true;
                try {
                    updateSubtitles(await translate(subs, options.translationLanguage));
                    notify(t('translation-success'));
                    inTranslation = false;
                } catch (error) {
                    notify(error.message, 'error');
                    inTranslation = false;
                }
            } else {
                notify(t('translation-limit'), 'error');
            }
        } else {
            notify(t('translation-progress'), 'error');
        }
    }, [copySubtitles, updateSubtitles, options.translationLanguage]);

  

    const props = {
        player,
        options,
        language,
        subtitles,
        currentTime,
        currentIndex,
        refe_subtitles,
         firevideo,
        setOption,
        setPlayer,
        setCurrentTime,
        setCurrentIndex,
      
        updateLang,
        hasSubtitle,
        addSubtitle,
        checkSubtitle,
        undoSubtitles,
        mergeSubtitle,
        removeSubtitle,
        updateSubtitle,
        cleanSubtitles,
        updateSubtitles,
        removeSubtitles,
        translateSubtitle,
        translateSubtitles,
        timeOffsetSubtitles,
    };

    return (

      
        <React.Fragment>
           
            <GlobalStyle />
            <Header {...props} />
            <Main {...props} />
          
        
            <ToastContainer />
        </React.Fragment>
    );
}
