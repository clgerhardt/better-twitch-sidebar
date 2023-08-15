// import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import type { FC } from 'react';


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

type DraggableTagProps = {
  tag: Channel;
};

const DraggableTag: FC<DraggableTagProps> = (props) => {
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
  const [activeDrags, setActiveDrags] = useState(0);
  const [items, setItems] = useState<Item[]>([
      {
        id: 1,
        text: 'Tag 1',
      },
      {
        id: 2,
        text: 'Tag 2',
      },
      {
        id: 3,
        text: 'Tag 3',
      },
    ]);

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
  

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setSideBarList((data) => {
        const oldIndex = data.findIndex((item) => item.position === active.id);
        const newIndex = data.findIndex((item) => item.position === over.id);

        return arrayMove(data, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
      <a href="https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=h86j4i63hwg0vfwn97lkxr3k0wjqz9&force_verify=true&redirect_uri=http://localhost:3000&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls">Connect with Twitch</a>
       Access token:  {authInfo.access_token}
       <br></br>
       Active Drags: {activeDrags}
      </header>
      <div className='main-content'>
        <div style={{ width: '20vh', height: '70vh', overflowY: 'scroll'}}>
          <div style={{width: '100%'}}>
            <Toggle
                onChange={setExpanded}
                checked={expanded}
                checkedChildren="Expand"
                unCheckedChildren="Collapse"
            />
          </div>
          <hr />
          <Sidenav expanded={expanded} defaultOpenKeys={['3', '4']}>
            <Sidenav.Body>
              <Nav>
                <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                  <SortableContext items={sideBarList} strategy={verticalListSortingStrategy}>
                    {sideBarList.map((item) => (
                      <DraggableTag tag={item} key={item.id} />
                    ))}
                    {/* {
                      sideBarList.map((item: any) => (
                        <Nav.Item eventKey={item.position} style={{ borderColor: 'red'}} as="div">
                          <div className='grid-row-testing'>
                            <img src={item.channel_profile_image} style={{width: 50, height: 50}} />
                            <p>{item.channel_name}</p>
                          </div>
                        </Nav.Item>
                      ))
                    } */}
                  </SortableContext>
                </DndContext>
              </Nav>
            </Sidenav.Body>
            <Sidenav.Toggle expanded={expanded} onToggle={expanded => setExpanded(expanded)} />
          </Sidenav>
        </div>
        <div>
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
