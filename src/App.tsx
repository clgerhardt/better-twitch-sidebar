// import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { Sidenav, Nav } from 'rsuite';
import DashboardIcon from '@rsuite/icons/legacy/Dashboard';
import GroupIcon from '@rsuite/icons/legacy/Group';
import MagicIcon from '@rsuite/icons/legacy/Magic';
import GearCircleIcon from '@rsuite/icons/legacy/GearCircle';

import { Channel } from "./models/Channel";
import { Group } from "./models/Group";


let authApi = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/token'
})

function App() {
  const [authInfo, setAuthInfo] = useState([] as any);
  const [listOfFollowedChannels, setListOfFollowedChannels] = useState([] as any);
  const [sideBarList, setSideBarList] = useState([] as any);

  useEffect(() => {
    const initializeApi = async () => {
      let result = await authApi.post('https://id.twitch.tv/oauth2/token', {
        'client_id': process.env.REACT_APP_TWITCH_CLIENT_ID,
        'client_secret': process.env.REACT_APP_TWITCH_CLIENT_SECRET,
        'grant_type': 'client_credentials'
      }).then(item => {
        return item;
      });
      setAuthInfo(result.data);

      let api = axios.create({
        headers: {
          'Authorization': 'Bearer ' + result.data.access_token,
          'Client-ID': process.env.REACT_APP_TWITCH_CLIENT_ID || ''
        }
      })

      let listOfFollowedChannels = [];

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
      let sideBarList: Array<Channel | Group> = initializeSideNavBar(listOfFollowedChannels);
      setSideBarList(sideBarList);
      setListOfFollowedChannels(listOfFollowedChannels);
    }

    let getFollowedChannels = async (api: any, firstCall = false, pagination = "") => {
      let baseHelixUrl = `https://api.twitch.tv/helix/users/follows?from_id=${process.env.REACT_APP_KATICISM_USER_ID}`;
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

    let initializeSideNavBar = (listOfFollowedChannels: any) => {
      let sideBarList: Array<Channel | Group> = [];
      listOfFollowedChannels.forEach((channel: any, index: number) => {
        let newChannel: Channel = {};
        newChannel.channel_id = channel.to_id;
        newChannel.channel_name = channel.to_name;
        newChannel.position = index + 1;
        sideBarList.push(newChannel);
      })
      return sideBarList;
    }

    initializeApi();
  }, []);
  return (
    <div className="App">
      <header className="App-header">
      <a href="https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=h86j4i63hwg0vfwn97lkxr3k0wjqz9&force_verify=true&redirect_uri=http://localhost:3000&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls">Connect with Twitch</a>
       Access token:  {authInfo.access_token}
      </header>
      <div className='main-content'>
        <div style={{ width: 240, display: "flex" }}>
          <Sidenav defaultOpenKeys={['3', '4']}>
            <Sidenav.Body>
              {/* activeKey="1" */}
              <Nav>
                {
                  sideBarList.map((item: any) => (
                    <Nav.Item eventKey={item.position}>
                        {item.channel_name}
                    </Nav.Item>
                  ))
                }
                {/* <Nav.Item eventKey="1" icon={<DashboardIcon />}>
                  Dashboard
                </Nav.Item>
                <Nav.Item eventKey="2" icon={<GroupIcon />}>
                  User Group
                </Nav.Item> */}
                {/* <Nav.Menu eventKey="3" title="Advanced" icon={<MagicIcon />}>
                  <Nav.Item eventKey="3-1">Geo</Nav.Item>
                  <Nav.Item eventKey="3-2">Devices</Nav.Item>
                  <Nav.Item eventKey="3-3">Loyalty</Nav.Item>
                  <Nav.Item eventKey="3-4">Visit Depth</Nav.Item>
                </Nav.Menu>
                <Nav.Menu eventKey="4" title="Settings" icon={<GearCircleIcon />}>
                  <Nav.Item eventKey="4-1">Applications</Nav.Item>
                  <Nav.Item eventKey="4-2">Channels</Nav.Item>
                  <Nav.Item eventKey="4-3">Versions</Nav.Item>
                  <Nav.Menu eventKey="4-5" title="Custom Action">
                    <Nav.Item eventKey="4-5-1">Action Name</Nav.Item>
                    <Nav.Item eventKey="4-5-2">Action Params</Nav.Item>
                  </Nav.Menu>
                </Nav.Menu> */}
              </Nav>
            </Sidenav.Body>
          </Sidenav>
        </div>
        <div id="">
          <ul>
            {
              listOfFollowedChannels.map((i: any) => (<li key={i.to_id}>{i.to_name}</li>))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
