import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import type { FC } from 'react';

import SideBar from "./components/Sidebar"

import { Sidenav, Nav, Toggle } from 'rsuite';

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core/dist/types/index';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

import { Channel } from "./models/Channel";
import { Group } from "./models/Group";

let authApi = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/token'
})

type Item = {
  id: number;
  text: string;
};

type DraggableNavItemProps = {
  tag: Channel;
};

const DraggableNavItem: FC<DraggableNavItemProps> = (props) => {
  const { tag } = props;
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.position });

  const commonStyle = {
    cursor: 'move',
    transition: 'unset', // Prevent element from shaking after drag
  };

  const style = transform
    ? {
        ...commonStyle,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: isDragging ? 'unset' : transition, // Improve performance/visual effect when dragging
      }
    : commonStyle;

  return (
    <div style={style} ref={setNodeRef} {...listeners}>
      <Nav.Item eventKey={tag.position} style={{ borderColor: 'red'}} as="div">
        <div className='grid-row-testing'>
          <img src={tag.channel_profile_image} style={{width: 50, height: 50}} />
          <p>{tag.channel_name}</p>
        </div>
      </Nav.Item>
    </div>
  );
};

function App() {
  const [authInfo, setAuthInfo] = useState([] as any);
  const [listOfFollowedChannels, setListOfFollowedChannels] = useState([] as any);
  const [sideBarList, setSideBarList] = useState([] as any);
  const [expanded, setExpanded] = useState(true);

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
          getUserDataUrlToBeAppendedTo += baseGetUserDataUrl + `id=${channel.to_id}`;
          maxAmountDefault -=1;
        } else {
          getUserDataUrlToBeAppendedTo += `&id=${channel.to_id}`;
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

    let initializeSideNavBar = (listOfFollowedChannels: Array<any>, userDataPerChannel: any) => {
      let sideBarList: Array<Channel | Group> = [];
      listOfFollowedChannels.forEach((channel: any, index: any) => {
        let newChannel: Channel = {};
        newChannel.channel_id = channel.to_id;
        newChannel.channel_name = channel.to_name;
        newChannel.position = index + 1;
        newChannel.channel_profile_image = userDataPerChannel.find((user: any) => user.id === channel.to_id).profile_image_url || '';
        sideBarList.push(newChannel);
      })
      return sideBarList;
    }

    initializeApi();
  }, []);

  function updateItemPosition(active, over){
    setSideBarList((data) => {
      const oldIndex = data.findIndex((item) => item.position === active.id);
      const newIndex = data.findIndex((item) => item.position === over.id);

      return arrayMove(data, oldIndex, newIndex);
    });
  }

  return (
    <div className="wrapper">
      {/* <div className="sidebar"> */}
      <SideBar sideBarList={sideBarList} updateItemPosition={updateItemPosition} />
      {/* </div> */}
      <div className="main">
        Main content
      </div>
    </div>
    // <div className="container">
    //   <div className="row">
    //     <div className="col-xs-12">
    //       <a href="https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=h86j4i63hwg0vfwn97lkxr3k0wjqz9&force_verify=true&redirect_uri=http://localhost:3000&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls">Connect with Twitch</a>
    //       Access token:  {authInfo.access_token}
    //       <hr />
    //     </div>
    //     <div id="sidebar">
    //       <SideBar sideBarList={sideBarList} updateItemPosition={updateItemPosition} />
    //     </div>
    //     <div className="main">
    //       <p>This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would
    //         be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data
    //         gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main
    //         body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling
    //         infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on
    //         scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the
    //         user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as
    //         more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This
    //         is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would
    //         be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data
    //         gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll.</p>
    //       <p>This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would
    //         be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data
    //         gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main
    //         body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling
    //         infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on
    //         scroll. This is the main body which the user would be scrolling infinitely as more data gets loaded on scroll.</p>
    //     </div>
    //   </div>
    // </div>
  );
}

export default App;
