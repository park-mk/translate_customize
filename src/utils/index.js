import DT from 'duration-time-conversion';
import { toast } from 'react-toastify';
import firebase from '../firebase';
import { t, Translate } from 'react-i18nify';
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
}

export function getExt(url) {
    if (url.includes('?')) {
        return getExt(url.split('?')[0]);
    }

    if (url.includes('#')) {
        return getExt(url.split('#')[0]);
    }

    return url
        .trim()
        .toLowerCase()
        .split('.')
        .pop();
}

export function sleep(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function secondToTime(seconds = 0) {
    return DT.d2t(seconds.toFixed(3));
}

export function timeToSecond(time) {
    return DT.t2d(time);
}
var getFileBlob = function (url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.addEventListener('load', function () {
        cb(xhr.response);
    });
    xhr.send();
};

export async function downloadFile(url) {
    console.log(url, "url and name")
    // const elink = document.createElement('a');
    // elink.style.display = 'none';
    //  elink.href = url;
    //  elink.download = name;
    // document.body.appendChild(elink);
    //  elink.click();
    //  console.log(elink,"elink")
    //  document.body.removeChild(elink);





    let today=new Date();
    // connecting  to firebase
    let blob = await fetch(url).then(r => r.blob());
    let storageRef = firebase.storage().ref(`${ today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()}`);

   
    var uploadTask = storageRef.child(`${window.location.pathname}.vtt`).put(blob);

    // Register three observers:
    // 1. 'state_changed' observer, called any time the state changes
    // 2. Error observer, called on failure
    // 3. Completion observer, called on successful completion
    uploadTask.on('state_changed', function (snapshot) {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
        }
    }, function (error) {
        // Handle unsuccessful uploads
    }, function () {
        notify(t('submit-success'));
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
            console.log('File available at', downloadURL);
        });
    });
}


export function notify(text = '', type = 'info') {
    // info success warning error default
    return (
        text.trim() &&
        toast[type](text, {
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        })
    );
}

export function getKeyCode(event) {
    const tag = document.activeElement.tagName.toUpperCase();
    const editable = document.activeElement.getAttribute('contenteditable');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && editable !== '' && editable !== 'true') {
        return Number(event.keyCode);
    }
}
