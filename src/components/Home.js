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
import { getVtt, vttToUrl } from '../subtitle';
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
    const [note, setNote] = useState("비어있음");

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
   
   
    


    // Update language
    const updateLang = useCallback(
        value => {
            setLocale(value);
            setLanguage(value);
            storage.set('language', value);
        },
        [setLanguage],
    );
    const updateNote = useCallback(
        value => {
           
            setNote(value);
           
        },
        [setNote],
    );


    // Update an option many time
    const setOption = useCallback(
      
        option => {
            setOptions({
                ...options,
                ...option,
            });
         
        },
        [options, setOptions],
    );
      
    // Only way to update all subtitles ss every time update
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
        console.log("sinit");
        const storageSubs = storage.get('subtitles');
        const storageNotes = storage.get('notes');
        if (storageSubs && storageSubs.length) {
        
            console.log(storageSubs.length)
            updateNote(storageNotes);
            updateSubtitles(storageSubs.map(item => new Sub(item.start, item.end,  item.text,item.text2)));
        } else {
            fetch(`${databaseURL}/video${location.pathname.substring(0,location.pathname.length)}.json`).then(res =>{
                if (res.status!=200){
                    throw new Error (res.statusText)
                }
                return res.json();
            } 
            ).then( async words=>{ 
                 
                    updateNote(words.note);
                    storage.set('notes',words.note);
                    NProgress.start().set(0.5);
                    try {
                        const vttText = await getVtt(words.vtt);
                        if (vttText) {
                            const subtitleUrl = vttToUrl(vttText);
                            updateSubtitles(await getSubFromVttUrl(subtitleUrl));
                         
                            setOption({ subtitleUrl, uploadDialog: false });
                            notify(t('open-subtitle-success'));
                        } else {
                            notify(t('open-subtitle-error'), 'error');
                            console.log(options.subtitleUrl,"빠라??");
                        }
                    } catch (error) {
                        notify(error.message, 'error');
                        console.log(options.subtitleUrl,"빠라잉");
                    }
                    NProgress.done();
                
             
             
        
              } , );
            
            //  const subs =  await getSubFromVttUrl("gs://subtitle-8b238.appspot.com/sample.vtt" );
             // updateSubtitles(subs);
        }
    }, [options.subtitleUrl, setSubtitles]);

    const initrefeSubtitles = useCallback(async () => {
      
            const subs = await getSubFromVttUrl(options.subtitleUrl);
            updateSubtitles(subs);
      
    }, [options.subtitleUrl, refe_setSubtitles]);

    // Run only once
    useEffect(() => {
        initSubtitles();
      
      
        updateLang(language);
        if (player && !worker.onmessage) {
            worker.onmessage = event => {
                player.subtitle.switch(event.data);
              
               
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player]);

 

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
        note,
        
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
