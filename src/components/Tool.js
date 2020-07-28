import React from 'react';
import styled from 'styled-components';
import languages from '../translate/languages';
import { Translate } from 'react-i18nify';
import { BrowserRouter  as Router, Switch, Route  ,useParams, useLocation } from "react-router-dom"; 

const Tool = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    font-size: 13px;

    .item {
        display: flex;
       
        padding: 5px 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.4);

        .value {
            display: flex;
            align-items: center;
            select {
                outline: none;
                margin-left: 15px;
            }
            button {
                height: 25px;
                border: none;
                padding: 0 10px;
                margin-left: 15px;
                outline: none;
                cursor: pointer;
                font-size: 12px;
                color: #fff;
                border-radius: 3px;
                background-color: rgb(26, 83, 109);
                transition: all 0.2s ease;
                &:hover {
                    color: #fff;
                    background-color: #2196f3;
                }
                i {
                    margin-right: 5px;
                }
            }
        }
    }
`;
const databaseURL="https://subtitle-8b238.firebaseio.com/";

export function getNote() {
    let aware=" 노트";
   console.log(`${databaseURL}/video${window.location.pathname}.json`,"check");
    fetch(`${databaseURL}/video${window.location.pathname}.json`).then(res =>{
        if (res.status!=200){
            throw new Error (res.statusText)
        }
        return res.json();
    } 
    ).then( async words=>{ 
        
           
            console.log(words.name,"조심");
            aware=words.name;
            return words.name;
       
      } , );

      return  aware;
 }


export default function({note}) { 


  
  

    

    return (
        <Tool>
        
    
            <div className="item">
                <div className="title">
                   <p>단어장 및 주의 사항</p>
                    <p>{note}</p>
                </div>
             
            </div>
        </Tool>
    );
}
