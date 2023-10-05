import React, { useState } from "react";
import { IconButton } from 'rsuite';
import { Icon } from '@rsuite/icons';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { Grid, Row, Col } from 'rsuite';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

// import announcements from "./announcements";
import SortableContainer, { Container } from "./container";
import SortableItem, { Item } from "./sortableItem";
// import { Group } from "../models/Group";

const wrapperStyle = {
  background: "#1F1F23",
  padding: "10px",
  borderRadius: 8,
  margin: '5px'
};

const Sidebar = ({ followersList }) => {
  console.log(followersList)
  const [data, setData] = useState({
    items: followersList
  });
  const [activeId, setActiveId] = useState();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const svgCloseIcon = React.forwardRef((props, ref) => (
    <svg {...props} version="1.1" viewBox="0 0 20 20" x="0px" y="0px" aria-hidden="true" focusable="false" ref={ref}><g><path d="M16 16V4h2v12h-2zM6 9l2.501-2.5-1.5-1.5-5 5 5 5 1.5-1.5-2.5-2.5h8V9H6z"></path></g></svg>
  ));
  const svgOpenIcon = React.forwardRef((props, ref) => (
    <svg {...props} version="1.1" viewBox="0 0 20 20" x="0px" y="0px" aria-hidden="true" focusable="false" ref={ref}><g><path d="M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z"></path></g></svg>
  ));

  
  return (
    <div style={{overflowY: 'auto', height: '100%'}}>
      <Grid fluid style={{marginLeft: '5px', marginTop: '5px', paddingLeft: '10px', color: 'white'}}>
        <Row className="show-grid">
          <Col xs={40}>
            {/* xs={24} sm={24} md={8} */}
            <h4>For You</h4>
          </Col>
          <Col xs={5} xsOffset={8}>
            <IconButton  onClick={() => {setIsCollapsed(!isCollapsed)}} icon={<Icon as={isCollapsed ? svgCloseIcon : svgOpenIcon}/>}></IconButton>
          </Col>
        </Row>
        </Grid>
        <DndContext
          // announcements={announcements}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={getItemIds()}
            strategy={verticalListSortingStrategy}
          >
            {/* <SimpleBarReact> */}
              <div style={wrapperStyle}>
                {getItems().map((item) => {
                  if (item.container) {
                    return (
                      
                        <SortableContainer
                          key={item.id}
                          id={item.id}
                          getItems={getItems}
                          row={item.row}
                          group={item}
                        />
                    );
                  }

                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <Item id={item.id} item={item} />
                    </SortableItem>
                  );
                })}
              </div>
              {/* </SimpleBarReact> */}
          </SortableContext>
          <DragOverlay>{getDragOverlay()}</DragOverlay>
        </DndContext>

        <div style={{textAlign: "center"}}>
          <IconButton onClick={addItem(true)} style={{width: "5rem", height: "5rem"}} size="lg" icon={<ExpandOutlineIcon/>}></IconButton>
        </div>
      </div>
  );

  function addItem(container, row) {
    return () => {
      setData((prev) => ({
        items: [
          ...prev.items,
          {
            id: prev.items.length + 1,
            container,
            row
          }
        ]
      }));
    };
  }

  function isContainer(id) {
    const item = data.items.find((item) => item.id === id);

    return !item ? false : item.container;
  }

  function isRow(id) {
    const item = data.items.find((item) => item.id === id);

    return !item ? false : item.row;
  }

  function getItems(parent) {
    return data.items.filter((item) => {
      if (!parent) {
        return !item.parent;
      }

      return item.parent === parent;
    });
  }

  function getItemIds(parent) {
    return getItems(parent).map((item) => item.id);
  }

  function findParent(id) {
    const item = data.items.find((item) => item.id === id);
    return !item ? false : item.parent;
  }

  function getDragOverlay() {
    if (!activeId) {
      return null;
    }

    if (isContainer(activeId)) {
      const item = data.items.find((i) => i.id === activeId);

      return (
        <Container row={item.row}>
          {getItems(activeId).map((item) => (
            <Item key={item.id} id={item.id} item={item} />
          ))}
        </Container>
      );
    } else {
      const item = data.items.find((i) => i.id === activeId);
      return <Item id={activeId} item={{channel_profile_image: item.channel_profile_image, channel_name: item.channel_name}} />;
    }

  }

  function handleDragStart(event) {
    const { active } = event;
    const { id } = active;

    setActiveId(id);
  }

  function handleDragOver(event) {
    const { active, over, draggingRect } = event;
    const { id } = active;
    let overId;
    if (over) {
      overId = over.id;
    }

    const overParent = findParent(overId);
    const overIsContainer = isContainer(overId);
    const activeIsContainer = isContainer(activeId);
    if (overIsContainer) {
      const overIsRow = isRow(overId);
      const activeIsRow = isRow(activeId);
      // only columns to be added to rows
      if (overIsRow) {
        if (activeIsRow) {
          return;
        }

        if (!activeIsContainer) {
          return;
        }
      } else if (activeIsContainer) {
        return;
      }
    }

    setData((prev) => {
      const activeIndex = data.items.findIndex((item) => item.id === id);
      const overIndex = data.items.findIndex((item) => item.id === overId);

      let newIndex = overIndex;
      const isBelowLastItem =
        over &&
        overIndex === prev.items.length - 1 &&
        draggingRect && draggingRect.offsetTop > over.rect.offsetTop + over.rect.height;

      const modifier = isBelowLastItem ? 1 : 0;

      newIndex = overIndex >= 0 ? overIndex + modifier : prev.items.length + 1;

      let nextParent;
      if (overId) {
        nextParent = overIsContainer ? overId : overParent;
      }

      prev.items[activeIndex].parent = nextParent;
      const nextItems = arrayMove(prev.items, activeIndex, newIndex);

      return {
        items: nextItems
      };
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const { id } = active;
    let overId;
    if (over) {
      overId = over.id;
    }

    const activeIndex = data.items.findIndex((item) => item.id === id);
    const overIndex = data.items.findIndex((item) => item.id === overId);

    let newIndex = overIndex >= 0 ? overIndex : 0;

    if (activeIndex !== overIndex) {
      setData((prev) => ({
        items: arrayMove(prev.items, activeIndex, newIndex)
      }));
    }

    setActiveId(null);
  }
}

export default Sidebar;
