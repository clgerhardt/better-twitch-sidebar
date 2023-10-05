import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import SimpleBarReact from "simplebar-react";

import { Channel } from "./models/Channel";
import { Group } from "./models/Group";
// import { MultipleContainers } from './components/MultipleContainers';

import ListTest from './components/ListTest';
import Sidebar from './components/sidebar';

let authApi = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/token'
})

let implicitAuthApi = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/authorize?response_type=token'
});


function App() {
  const [authInfo, setAuthInfo] = useState([] as any);
  const [listOfFollowedChannels, setListOfFollowedChannels] = useState([] as any);
  const [sideBarList, setSideBarList] = useState([] as any);
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    const initializeApi = async () => {
      // console.log(window.location.href.split("access_token=")[1].split("&")[0])

    //  let testResult = await implicitAuthApi.post('https://id.twitch.tv/oauth2/authorize?response_type=token', {
    //     'client_id': process.env.REACT_APP_TWITCH_CLIENT_ID,
    //     'redirect_uri': 'http://localhost:3000',
    //     'scop': 'channel%3Amanage%3Apolls+channel%3Aread%3Apolls',
    //     'state': 'c3ab8aa609ea11e793ae92361f002671'
    //   });
    //   console.log(testResult)
      // let result = await authApi.post('https://id.twitch.tv/oauth2/token', {
      //   'client_id': process.env.REACT_APP_TWITCH_CLIENT_ID,
      //   'client_secret': process.env.REACT_APP_TWITCH_CLIENT_SECRET,
      //   'grant_type': 'client_credentials'
      // }).then(item => {
      //   return item;
      // });

      // console.log(result.data)
      // setAuthInfo(result.data);

      let access_token = window.location.href.split("access_token=");
      // console.log(access_token)

      let bearer_token = (access_token.length > 1 ? access_token[1].split("&")[0] : '');

      let api = axios.create({
        headers: {
          'Authorization': 'Bearer ' + bearer_token,
          'Client-ID': process.env.REACT_APP_TWITCH_CLIENT_ID || ''
        }
      })

      if (!bearer_token) return;

      // get list of channels the signed in user follows
      let listOfFollowedChannels: any = [];

      let gettingFollowers = true;
      let firstCall = true;
      let paginationCursor = "";
      while(gettingFollowers) {
        let recievedFollowers = await getFollowedChannels(api, firstCall, paginationCursor).then(d => { return d});
        listOfFollowedChannels.push(...recievedFollowers.data)
        if(recievedFollowers?.pagination?.cursor) {
          paginationCursor = recievedFollowers.pagination.cursor;
        } else {
          gettingFollowers = false;
        }
        firstCall = false;
      }

      // get user data list based on channel names
      const baseGetUserDataUrl = "https://api.twitch.tv/helix/users?"
      let getUserDataUrlToBeAppendedTo = "";
      let getChannelDetailsRequests: any = [];
      let maxAmountDefault = 100;
      listOfFollowedChannels.forEach((channel: any, index: any) => {
        if(maxAmountDefault == 100) {
          getUserDataUrlToBeAppendedTo += baseGetUserDataUrl + `id=${channel.broadcaster_id}`;
          maxAmountDefault -=1;
        } else {
          getUserDataUrlToBeAppendedTo += `&id=${channel.broadcaster_id}`;
          maxAmountDefault -=1;
        }

        if(maxAmountDefault == 0) {
          getChannelDetailsRequests.push(getUserDataUrlToBeAppendedTo);
          getUserDataUrlToBeAppendedTo = "";
          maxAmountDefault = 100;
        } else if(index === listOfFollowedChannels.length - 1) {
          getChannelDetailsRequests.push(getUserDataUrlToBeAppendedTo);
        }
      });

      let userDataPerChannel: any = [];

      let gettingUserData = true;
      let index = 0;
      while(gettingUserData) {
        if(index > getChannelDetailsRequests.length) {
          gettingUserData = false;
          break;
        } else {
          let response = await getUserData(api, getChannelDetailsRequests[index]).then((d) => {return d});
          userDataPerChannel.push(...response.data)
        }
        index++;
      }

      // initiate side bar
      let sideBarList: Array<Channel | Group> = initializeSideNavBar(listOfFollowedChannels, userDataPerChannel);
      setSideBarList(sideBarList);
      setListOfFollowedChannels(listOfFollowedChannels);
    }    

    let getUserData = async (api: any, requestUrl: any) => {
      if(requestUrl) {
        return await api.get(requestUrl).then((item: any) => {
          return item.data;
        });
      }
      return { data: []};
    }

    let getFollowedChannels = async (api: any, firstCall = false, pagination = "") => {
      let baseHelixUrl = `https://api.twitch.tv/helix/channels/followed?user_id=${process.env.REACT_APP_KATICISM_USER_ID}`;
      if(firstCall) {
       return await api.get(baseHelixUrl).then(
        (item: any) => {
          return item.data;
        }
      );
      }
      else if(!firstCall && pagination !== "") {
        return await api.get(`${baseHelixUrl}&after=${pagination}`).then(
          (item: any) => {
            return item.data;
          }
        );
      }
    }

    let initializeSideNavBar = (listOfFollowedChannels: Array<any>, userDataPerChannel: any) => {
      let sideBarList: Array<Channel | Group> = [];
      let tarkovGroup = new Group();
      tarkovGroup.channels = new Array();
      tarkovGroup.position = 2;
      tarkovGroup.index = 2;
      tarkovGroup.id = 2;
      tarkovGroup.container = true;
      let ungrouped = new Group();
      ungrouped.channels = new Array();
      ungrouped.position = 1;
      ungrouped.index = 1;
      ungrouped.id = 1;
      ungrouped.group_name = 'Ungrouped Channels';
      ungrouped.container = true;
      tarkovGroup.group_name = 'Tarkov';
      let eftchannels = ['AquaFPS', 'Gingy', 'StankRat_', 'Tigz', 'HyperRatTV', 'Dylhero', 'BattlestateGames', 'LVNDMARK', 'Anton', 'QuattroAce', 'Pestily', 'JesseKazam']
      sideBarList.push(ungrouped);
      sideBarList.push(tarkovGroup);
      listOfFollowedChannels.forEach((channel: any, index: any) => {
        let newChannel: Channel = {};
        newChannel.channel_id = channel.broadcaster_id;
        newChannel.channel_name = channel.broadcaster_name;
        newChannel.channel_profile_image = userDataPerChannel.find((user: any) => user.id === channel.broadcaster_id).profile_image_url || '';
        if(eftchannels.includes(newChannel.channel_name)) {
          newChannel.id = index + 3;
          newChannel.position = index + 3;
          newChannel.index = index + 3;
          newChannel.parent = 2;
        } else {
          newChannel.id = index + 3;
          newChannel.position = index + 3;
          newChannel.index = index + 3;
          newChannel.parent = 1;
        }
        sideBarList.push(newChannel);
      })
      console.log(sideBarList);
      return sideBarList;
    }

    initializeApi();
  }, []);

  return (
    <div className="wrapper">
      <div className='sidebar'>
        {/* For You <button style={{width: '35px', background: '#1F1F23'}}><svg width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px" aria-hidden="true" focusable="false" className='svg'><g><path d="M16 16V4h2v12h-2zM6 9l2.501-2.5-1.5-1.5-5 5 5 5 1.5-1.5-2.5-2.5h8V9H6z"></path></g></svg></button> */}
        <SimpleBarReact className='simple-react-bar'>
          {sideBarList.length > 0 && <Sidebar followersList={sideBarList}></Sidebar>}
        </SimpleBarReact> 
      </div>
      <div className="main">
        Main content
        <br></br>
        <a href="https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=h86j4i63hwg0vfwn97lkxr3k0wjqz9&force_verify=true&redirect_uri=http://localhost:3000&scope=user%3Aread%3Afollows">Connect with Twitch</a>        
      </div>
    </div>
  );
}

export default App;
