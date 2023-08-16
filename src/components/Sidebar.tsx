import { useState } from 'react';
import type { FC } from 'react';
import { Sidenav, Nav, Toggle } from 'rsuite';

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core/dist/types/index';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

import { Channel } from "../models/Channel";

const Sidebar = ({sideBarList, updateItemPosition}) => {
    console.log(sideBarList);
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
            <Nav.Item eventKey={tag.position} style={{ background: '#3c3f43', backgroundColor: '#3c3f43'}} as="div">
                <div className='grid-row-testing'>
                <img src={tag.channel_profile_image} style={{width: 50, height: 50}} />
                <p style={{color: 'white'}}>{tag.channel_name}</p>
                </div>
            </Nav.Item>
        </div>
    );
    };

    const [expanded, setExpanded] = useState(true);

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
  
      if (active.id !== over.id) {
        updateItemPosition(active, over);
      }
    };

    return (
        <div className='sidebar'>
            <div>
                <p style={{fontSize: '1.8rem'}}>For You</p>
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
                                <DraggableNavItem tag={item} key={item.id} />
                            ))}
                            </SortableContext>
                        </DndContext>
                    </Nav>
                </Sidenav.Body>
                <Sidenav.Toggle expanded={expanded} onToggle={expanded => setExpanded(expanded)} />
            </Sidenav>
        </div>
    )
};

export default Sidebar;